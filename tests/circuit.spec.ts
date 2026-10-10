import { expect, test, type Page } from '@playwright/test'
import { APP_URL } from '../src/components/qni-webgpu-app-url'

type MockState = {
  calls: { circuit: string; showStatePanel: boolean; url: string }[]
  destroyed: number[]
  live: number
  maxLive: number
  release: (() => void)[]
  currentCircuit?: string
  progress?: (value: { stage: string; loaded: number; total: number | null }) => void
}

declare global {
  interface Window {
    __qniMock: MockState
    __qniHeld: boolean
    __qniFail: boolean
    __qniElement?: HTMLElement
  }
}

const embedPath = '/qni-tutorial-webgpu/qni-webgpu/qni-embed.mjs'
const mockModule = `
  export async function startEmbed(canvas, circuit, settings) {
    const mock = window.__qniMock;
    const id = mock.calls.length;
    mock.progress = settings.onProgress;
    mock.calls.push({ circuit, showStatePanel: settings.showStatePanel, url: new URL(import.meta.url).pathname });
    if (window.__qniFail) throw new Error('mock GPU failure');
    mock.live++;
    mock.maxLive = Math.max(mock.maxLive, mock.live);
    if (window.__qniHeld) await new Promise(resolve => mock.release.push(resolve));
    let destroyed = false;
    return { circuitJSON() { return mock.currentCircuit ?? circuit }, destroy() {
      if (destroyed) throw new Error('duplicate destroy');
      destroyed = true;
      mock.destroyed.push(id);
      mock.live--;
    } };
  }
`

async function boot(page: Page, options: { gpu?: boolean; held?: boolean; importFails?: boolean } = {}) {
  const requests: string[] = []
  await page.addInitScript(({ gpu, held }) => {
    Object.defineProperty(navigator, 'gpu', { configurable: true, value: gpu ? {} : undefined })
    window.__qniMock = { calls: [], destroyed: [], live: 0, maxLive: 0, release: [] }
    window.__qniHeld = held
    window.__qniFail = false
  }, { gpu: options.gpu !== false, held: options.held ?? false })
  await page.route('**/qni-embed.mjs', async route => {
    requests.push(new URL(route.request().url()).pathname)
    await route.fulfill({
      status: options.importFails ? 500 : 200,
      contentType: 'text/javascript',
      body: options.importFails ? '' : mockModule,
    })
  })
  await page.goto('/qni-tutorial-webgpu/h_gate/')
  await page.waitForFunction(() => customElements.get('qni-webgpu-circuit'))
  return requests
}

async function running(page: Page) {
  await page.locator('qni-webgpu-circuit[data-state="running"]').waitFor()
}

async function snapshot(page: Page) {
  return page.evaluate(() => {
    const element = document.querySelector('qni-webgpu-circuit')!
    return {
      state: (element as HTMLElement).dataset.state,
      calls: window.__qniMock.calls,
      destroyed: window.__qniMock.destroyed,
      live: window.__qniMock.live,
      maxLive: window.__qniMock.maxLive,
    }
  })
}

test('uses the deployed base URL and exposes an accessible canvas', async ({ page }) => {
  const requests = await boot(page)
  await running(page)
  const accessibility = await page.evaluate(() => {
    const shadow = document.querySelector('qni-webgpu-circuit')!.shadowRoot!
    return {
      open: shadow.mode,
      focusable: shadow.querySelector('canvas')!.tabIndex,
      label: shadow.querySelector('canvas')!.getAttribute('aria-label'),
      role: shadow.querySelector('[role="status"]')!.getAttribute('role'),
      live: shadow.querySelector('[role="status"]')!.getAttribute('aria-live'),
    }
  })
  expect({ requests, ...(await snapshot(page)), accessibility }).toEqual({
    requests: [embedPath], state: 'running',
    calls: [{ circuit: '{"cols":[["|0>"]]}', showStatePanel: true, url: embedPath }],
    destroyed: [], live: 1, maxLive: 1,
    accessibility: { open: 'open', focusable: 0, label: '量子回路シミュレーター', role: 'status', live: 'polite' },
  })
})

test('disconnect destroys the runner and reconnect starts a new one', async ({ page }) => {
  await boot(page)
  await running(page)
  const idle = await page.evaluate(() => {
    window.__qniElement = document.querySelector('qni-webgpu-circuit') as HTMLElement
    window.__qniElement.remove()
    return { state: window.__qniElement.dataset.state, live: window.__qniMock.live }
  })
  await page.evaluate(() => document.body.append(window.__qniElement!))
  await running(page)
  const state = await snapshot(page)
  expect({ idle, state: state.state, calls: state.calls.length, destroyed: state.destroyed, live: state.live, maxLive: state.maxLive })
    .toEqual({ idle: { state: 'idle', live: 0 }, state: 'running', calls: 2, destroyed: [0], live: 1, maxLive: 1 })
})

test('serializes reconnect behind pending startup and destroys its stale handle', async ({ page }) => {
  await boot(page, { held: true })
  await page.waitForFunction(() => window.__qniMock.release.length === 1)
  const pending = await page.evaluate(() => {
    const element = document.querySelector('qni-webgpu-circuit')!
    element.remove()
    document.body.append(element)
    return { calls: window.__qniMock.calls.length, state: (element as HTMLElement).dataset.state }
  })
  await page.evaluate(() => window.__qniMock.release.shift()!())
  await page.waitForFunction(() => window.__qniMock.release.length === 1)
  await page.evaluate(() => window.__qniMock.release.shift()!())
  await running(page)
  const state = await snapshot(page)
  expect({ pending, calls: state.calls.length, destroyed: state.destroyed, live: state.live, maxLive: state.maxLive, state: state.state })
    .toEqual({ pending: { calls: 1, state: 'loading' }, calls: 2, destroyed: [0], live: 1, maxLive: 1, state: 'running' })
})

test('disconnect during pending startup cleans up without restarting', async ({ page }) => {
  await boot(page, { held: true })
  await page.waitForFunction(() => window.__qniMock.release.length === 1)
  await page.evaluate(() => {
    window.__qniElement = document.querySelector('qni-webgpu-circuit') as HTMLElement
    window.__qniElement.remove()
    window.__qniMock.release.shift()!()
  })
  await page.waitForFunction(() => window.__qniMock.destroyed.length === 1)
  expect(await page.evaluate(() => ({ state: window.__qniElement!.dataset.state, calls: window.__qniMock.calls.length, live: window.__qniMock.live, destroyed: window.__qniMock.destroyed })))
    .toEqual({ state: 'idle', calls: 1, live: 0, destroyed: [0] })
})

test('circuit and settings changes restart with the latest values and default circuit', async ({ page }) => {
  await boot(page)
  await running(page)
  await page.evaluate(() => {
    const element = document.querySelector('qni-webgpu-circuit')!
    element.removeAttribute('circuit')
    element.setAttribute('show-state-panel', 'false')
  })
  await running(page)
  const state = await snapshot(page)
  expect(state).toEqual({
    state: 'running',
    calls: [
      { circuit: '{"cols":[["|0>"]]}', showStatePanel: true, url: embedPath },
      { circuit: '{"cols":[]}', showStatePanel: false, url: embedPath },
    ],
    destroyed: [0], live: 1, maxLive: 1,
  })
})

test('dimension changes resize without restarting', async ({ page }) => {
  await boot(page)
  await running(page)
  await page.evaluate(() => {
    const element = document.querySelector('qni-webgpu-circuit')!
    element.setAttribute('width', '320')
    element.setAttribute('height', '240')
  })
  expect(await page.evaluate(() => {
    const element = document.querySelector('qni-webgpu-circuit')!
    const canvas = element.shadowRoot!.querySelector('canvas')!
    return {
      width: element.getBoundingClientRect().width, height: element.getBoundingClientRect().height,
      canvasMatches: canvas.width === Math.round(316 * devicePixelRatio) && canvas.height === Math.round(192 * devicePixelRatio),
      calls: window.__qniMock.calls.length, destroyed: window.__qniMock.destroyed,
    }
  })).toEqual({ width: 320, height: 240, canvasMatches: true, calls: 1, destroyed: [] })
})

test('missing WebGPU shows a Japanese message without importing a fallback', async ({ page }) => {
  const requests = await boot(page, { gpu: false })
  await page.locator('qni-webgpu-circuit[data-state="unsupported"]').waitFor()
  expect({ requests, ...(await page.evaluate(() => {
    const shadow = document.querySelector('qni-webgpu-circuit')!.shadowRoot!
    return { message: shadow.querySelector('[role="status"]')!.textContent, hidden: shadow.querySelector('canvas')!.hidden, calls: window.__qniMock.calls.length }
  })) }).toEqual({ requests: [], message: 'このブラウザーはWebGPUに対応していません。', hidden: true, calls: 0 })
})

test('shows Japanese progress with an honest unknown compressed total', async ({ page }) => {
  await boot(page, { held: true })
  await page.waitForFunction(() => window.__qniMock.release.length === 1)
  const messages = await page.evaluate(() => {
    const status = document.querySelector('qni-webgpu-circuit')!.shadowRoot!.querySelector('[role="status"]')!
    return [
      { stage: 'download', loaded: 50, total: 100 },
      { stage: 'download', loaded: 1048576, total: null },
      { stage: 'compile', loaded: 0, total: null },
      { stage: 'gpu', loaded: 0, total: null },
      { stage: 'prepare', loaded: 0, total: null },
    ].map(value => {
      window.__qniMock.progress!(value)
      return status.textContent
    })
  })
  expect(messages).toEqual(['ダウンロード中… 50%', 'ダウンロード中… 1.0 MB', 'コンパイル中…', 'GPU 初期化中…', '準備中…'])
})

for (const failure of ['import', 'parse', 'GPU'] as const) {
  test(`${failure} failure exposes a Japanese error and logs the cause`, async ({ page }) => {
    const errors: string[] = []
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()) })
    await boot(page, { importFails: failure === 'import' })
    if (failure !== 'import') {
      await running(page)
      await page.evaluate(kind => {
        window.__qniFail = kind === 'GPU'
        document.querySelector('qni-webgpu-circuit')!.setAttribute('circuit', kind === 'parse' ? '{' : '{"cols":[]}')
      }, failure)
    }
    await page.locator('qni-webgpu-circuit[data-state="error"]').waitFor()
    expect({
      message: await page.locator('qni-webgpu-circuit').locator('[role="status"]').textContent(),
      logged: errors.some(error => error.includes('量子回路の起動に失敗しました。')),
      live: (await snapshot(page)).live,
    }).toEqual({ message: '量子回路を起動できませんでした。', logged: true, live: 0 })
  })
}

test('canvas fills the blue frame inside its border and the tab stays attached', async ({ page }) => {
  await boot(page)
  await running(page)
  expect(await page.locator('qni-webgpu-circuit').evaluate(e => {
    const s = e.shadowRoot!, frame = s.querySelector('.frame')!, canvas = s.querySelector('canvas')!, tab = s.querySelector('.open-tab')!
    const f = frame.getBoundingClientRect(), c = canvas.getBoundingClientRect(), t = tab.getBoundingClientRect(), b = parseFloat(getComputedStyle(frame).borderWidth)
    return { left: c.left - f.left - b, right: f.right - b - c.right, top: c.top - f.top - b, bottom: f.bottom - b - c.bottom, tabGap: t.top - f.bottom, tabLeft: t.left - f.left, buffer: canvas.width === Math.round(c.width * devicePixelRatio) && canvas.height === Math.round(c.height * devicePixelRatio) }
  })).toEqual({ left: 0, right: 0, top: 0, bottom: 0, tabGap: 0, tabLeft: 0, buffer: true })
})

test('open link has the exact label, safe new-tab attributes and encoded circuit', async ({ page }) => {
  await boot(page)
  await running(page)
  const link = page.locator('qni-webgpu-circuit').getByRole('link', { name: 'Qniで開く', exact: true })
  expect(await link.evaluate((a: HTMLAnchorElement) => ({
    label: a.textContent, target: a.target, rel: a.rel,
    path: new URL(a.href).pathname, circuit: JSON.parse(decodeURIComponent(new URL(a.href).hash.slice(1))),
  }))).toEqual({ label: 'Qniで開く', target: '_blank', rel: 'noopener', path: new URL(APP_URL, 'http://localhost').pathname, circuit: { cols: [['|0>']] } })
})

for (const event of ['pointerdown', 'focus', 'keydown', 'click']) {
  test(`open link exports the current circuit synchronously on ${event}`, async ({ page }) => {
    await boot(page)
    await running(page)
    const current = '{"cols":[["H"],["•","X"],["S†"]]}'
    await page.evaluate(circuit => { window.__qniMock.currentCircuit = circuit }, current)
    const link = page.locator('qni-webgpu-circuit').getByRole('link', { name: 'Qniで開く', exact: true })
    await link.evaluate(a => a.addEventListener('click', e => e.preventDefault()))
    await link.dispatchEvent(event)
    expect(await link.evaluate((a: HTMLAnchorElement) => new URL(a.href).hash.slice(1))).toBe(encodeURIComponent(current))
  })
}
