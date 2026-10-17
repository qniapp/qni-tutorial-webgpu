import { expect, test, type Page } from '@playwright/test'
import { APP_URL } from '../src/components/qni-webgpu-app-url'

type MockState = {
  calls: { circuit: string; showStatePanel: boolean; url: string }[]
  paletteCalls: { present: boolean; palette?: string[] }[]
  wireCalls: { present: boolean; value?: number }[]
  restartCalls: { show: boolean; invoke: () => void }[]
  destroyed: number[]
  live: number
  maxLive: number
  release: (() => void)[]
  currentCircuit?: string
  progress?: (value: { stage: string; loaded: number; total: number | null }) => void
  deviceLost?: (error: unknown) => void
}

declare global {
  interface Window {
    __qniMock: MockState
    __qniHeld: boolean
    __qniFail: boolean
    __qniAdapterAvailable: boolean
    __qniElement?: HTMLElement
  }
}

const embedPath = '/qni-tutorial-webgpu/qni-webgpu/qni-embed.mjs'
const mockModule = `
  export async function startEmbed(canvas, circuit, settings) {
    const mock = window.__qniMock;
    const id = mock.calls.length;
    mock.progress = settings.onProgress;
    mock.deviceLost = settings.onDeviceLost;
    mock.restartCalls.push({ show: settings.showRestartButton, invoke: settings.onRestart });
    mock.wireCalls.push({ present: Object.hasOwn(settings, 'maxWireCount'), value: settings.maxWireCount });
    mock.paletteCalls.push({ present: Object.hasOwn(settings, 'palette'), palette: settings.palette });
    mock.calls.push({ circuit, showStatePanel: settings.showStatePanel, url: new URL(import.meta.url).pathname });
    if (window.__qniFail) throw new Error('mock GPU failure');
    mock.live++;
    mock.maxLive = Math.max(mock.maxLive, mock.live);
    if (window.__qniHeld) await new Promise(resolve => mock.release.push(resolve));
    let destroyed = false;
    return { preferredHeight(width) { return window.__qniHeight ?? (400 + Math.floor(width / 100)) }, circuitJSON() { return mock.currentCircuit ?? circuit }, destroy() {
      if (destroyed) throw new Error('duplicate destroy');
      destroyed = true;
      mock.destroyed.push(id);
      mock.live--;
    } };
  }
`

async function boot(page: Page, options: { gpu?: boolean; adapterAvailable?: boolean; held?: boolean; importFails?: boolean } = {}) {
  const requests: string[] = []
  await page.addInitScript(({ gpu, adapterAvailable, held }) => {
    window.__qniAdapterAvailable = adapterAvailable
    Object.defineProperty(navigator, 'gpu', { configurable: true, value: gpu ? {
      requestAdapter: async () => window.__qniAdapterAvailable ? {} : null,
    } : undefined })
    window.__qniMock = { calls: [], paletteCalls: [], wireCalls: [], restartCalls: [], destroyed: [], live: 0, maxLive: 0, release: [] }
    window.__qniHeld = held
    window.__qniFail = false
  }, { gpu: options.gpu !== false, adapterAvailable: options.adapterAvailable !== false, held: options.held ?? false })
  // Only the app entry is mocked; qni-embed-error.mjs is served from dist.
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

test('automatic height uses ready runner geometry', async ({ page }) => {
  await boot(page)
  await running(page)
  expect(await page.locator('qni-webgpu-circuit').evaluate(element => {
    const canvas = element.shadowRoot!.querySelector('canvas')!
    return element.getBoundingClientRect().height - 48 - Math.floor(canvas.getBoundingClientRect().width / 100)
  })).toBe(400)
})

test('automatic height follows edited layout metadata', async ({ page }) => {
  await boot(page)
  await running(page)
  await page.evaluate(() => { (window as Window & { __qniHeight?: number }).__qniHeight = 900 })
  await expect(page.locator('qni-webgpu-circuit')).toHaveCSS('height', '948px')
})

test('removing explicit height restores automatic height', async ({ page }) => {
  await boot(page)
  await running(page)
  await page.locator('qni-webgpu-circuit').evaluate(element => {
    element.setAttribute('height', '640')
    element.removeAttribute('height')
  })
  expect(await page.locator('qni-webgpu-circuit').evaluate(element => {
    const canvas = element.shadowRoot!.querySelector('canvas')!
    return element.getBoundingClientRect().height - 48 - Math.floor(canvas.getBoundingClientRect().width / 100)
  })).toBe(400)
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
    const element = document.querySelector('qni-webgpu-circuit') as HTMLElement
    const shadow = element.shadowRoot!
    const errorRoot = shadow.querySelector('.error-slot > div')!.shadowRoot!
    return { code: element.dataset.errorCode, message: errorRoot.querySelector('h3')!.textContent, hidden: shadow.querySelector('canvas')!.hidden, calls: window.__qniMock.calls.length }
  })) }).toEqual({ requests: [], code: 'webgpu-unsupported', message: 'このブラウザーでは動きません', hidden: true, calls: 0 })
})

test('unavailable adapter shows its cause and retry clears the error before restarting', async ({ page }) => {
  await boot(page, { adapterAvailable: false })
  const element = page.locator('qni-webgpu-circuit')
  const slot = element.locator('.error-slot')
  await expect(element).toHaveAttribute('data-state', 'error')
  await expect(element).toHaveAttribute('data-error-code', 'gpu-adapter-unavailable')
  await expect(slot.getByRole('heading', { level: 3 })).toHaveText('GPU を使えませんでした')
  await expect(element.locator('canvas')).toBeHidden()
  expect((await snapshot(page)).calls).toHaveLength(0)
  expect((await snapshot(page)).live).toBe(0)

  await page.evaluate(() => {
    window.__qniAdapterAvailable = true
    window.__qniHeld = true
  })
  await slot.getByRole('button', { name: '再試行', exact: true }).click()
  await page.waitForFunction(() => window.__qniMock.release.length === 1)
  await expect(element).toHaveAttribute('data-state', 'loading')
  await expect(element).not.toHaveAttribute('data-error-code')
  await expect(slot).toBeHidden()
  await expect(slot.locator('[data-qni-startup-error]')).toHaveCount(0)
  await expect(element.locator('canvas')).toBeVisible()
  await page.evaluate(() => window.__qniMock.release.shift()!())
  await running(page)
  await expect(element).not.toHaveAttribute('data-error-code')
  expect((await snapshot(page)).calls).toHaveLength(1)
  expect((await snapshot(page)).live).toBe(1)
})

test('device loss renders the supplied error and retry preserves an available edited circuit', async ({ page }) => {
  await boot(page)
  await running(page)
  const edited = '{"cols":[["H"],["Measure"]]}'
  await page.evaluate(circuit => {
    window.__qniMock.currentCircuit = circuit
    window.__qniMock.deviceLost!({ name: 'QniStartupError', code: 'gpu-device-lost', message: 'mock device lost' })
  }, edited)
  const element = page.locator('qni-webgpu-circuit')
  const slot = element.locator('.error-slot')
  await expect(element).toHaveAttribute('data-state', 'error')
  await expect(element).toHaveAttribute('data-error-code', 'gpu-device-lost')
  await expect(slot.getByRole('heading', { level: 3 })).toHaveText('GPU との接続が切れました')
  await expect(element.locator('canvas')).toBeHidden()
  expect((await snapshot(page)).destroyed).toEqual([0])
  expect((await snapshot(page)).live).toBe(0)
  await slot.getByRole('button', { name: '再試行', exact: true }).click()
  await running(page)
  await expect(slot).toBeHidden()
  await expect(slot.locator('[data-qni-startup-error]')).toHaveCount(0)
  await expect(element).not.toHaveAttribute('data-error-code')
  expect((await snapshot(page)).calls.at(-1)?.circuit).toBe(edited)
  expect((await snapshot(page)).maxLive).toBe(1)
})

test('failure to load the error module falls back to a reload message', async ({ page }) => {
  await page.route('**/qni-embed-error.mjs', route => route.fulfill({ status: 500, body: '' }))
  await boot(page)
  const element = page.locator('qni-webgpu-circuit')
  await expect(element).toHaveAttribute('data-state', 'error')
  await expect(element.locator('.error-slot')).toHaveText('量子回路を起動できませんでした。ページを再読み込みしてください。')
  await expect(element.locator('canvas')).toBeHidden()
  expect((await snapshot(page)).calls).toHaveLength(0)
  expect((await snapshot(page)).live).toBe(0)
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
      code: await page.locator('qni-webgpu-circuit').getAttribute('data-error-code'),
      message: await page.locator('qni-webgpu-circuit .error-slot').getByRole('heading', { level: 3 }).textContent(),
      logged: errors.some(error => error.includes('量子回路の起動に失敗しました。')),
      live: (await snapshot(page)).live,
    }).toEqual({
      code: failure === 'parse' ? 'invalid-embed' : failure === 'import' ? 'load-failed' : 'unknown',
      message: failure === 'parse' ? '回路のデータに問題があります' : failure === 'import' ? '読み込みに失敗しました' : '量子回路を起動できませんでした',
      logged: true, live: 0,
    })
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

test('palette JSON reaches startEmbed, [] hides it and absence omits the option', async ({ page }) => {
  await boot(page)
  await running(page)
  expect(await page.evaluate(() => window.__qniMock.paletteCalls.at(-1))).toEqual({ present: true, palette: ['H', 'X'] })
  for (const palette of ['["|0>","P(π/4)","Measure"]', '[]', null]) {
    await page.evaluate(value => {
      const element = document.querySelector('qni-webgpu-circuit')!
      if (value === null) element.removeAttribute('palette')
      else element.setAttribute('palette', value)
    }, palette)
    await running(page)
    expect(await page.evaluate(() => window.__qniMock.paletteCalls.at(-1))).toEqual(palette === null ? { present: false } : { present: true, palette: JSON.parse(palette) })
  }
  expect((await snapshot(page)).maxLive).toBe(1)
})

test('run-button opts into the embedded restart action without an external button', async ({ page }) => {
  await boot(page)
  await running(page)
  await page.locator('qni-webgpu-circuit').evaluate(e => e.setAttribute('run-button', ''))
  await running(page)
  expect(await page.evaluate(() => ({
    settings: window.__qniMock.restartCalls.map(c => c.show),
    externalButtons: document.querySelector('qni-webgpu-circuit')!.shadowRoot!.querySelectorAll('button').length,
  }))).toEqual({ settings: [false, true], externalButtons: 0 })
})

for (const edited of [false, true]) {
  test(`status-bar restart preserves ${edited ? 'edited' : 'unchanged'} circuit and one live runner`, async ({ page }) => {
    await boot(page)
    await running(page)
    await page.locator('qni-webgpu-circuit').evaluate(e => e.setAttribute('run-button', ''))
    await running(page)
    const current = edited ? '{"cols":[["|1>"],["Measure"]]}' : '{"cols":[["|0>"]]}'
    await page.evaluate(value => {
      window.__qniMock.currentCircuit = value
      window.__qniMock.restartCalls.at(-1)!.invoke()
    }, current)
    await running(page)
    const state = await snapshot(page)
    expect({ circuit: state.calls.at(-1)?.circuit, calls: state.calls.length, live: state.live, maxLive: state.maxLive })
      .toEqual({ circuit: current, calls: 3, live: 1, maxLive: 1 })
  })
}

for (const phase of ['loading', 'disconnected', 'removed'] as const) {
  test(`restart callback ignores ${phase} or stale runners`, async ({ page }) => {
    await boot(page)
    await running(page)
    await page.locator('qni-webgpu-circuit').evaluate(e => e.setAttribute('run-button', ''))
    await running(page)
    await page.evaluate(phase => {
      const e = document.querySelector('qni-webgpu-circuit')!
      const callback = window.__qniMock.restartCalls.at(-1)!.invoke
      if (phase === 'loading') e.setAttribute('circuit', '{"cols":[["H"]]}')
      else if (phase === 'disconnected') e.remove()
      else e.removeAttribute('run-button')
      callback()
    }, phase)
    if (phase !== 'disconnected') await running(page)
    // Also invoke the old callback after the replacement runner is ready.
    await page.evaluate(() => window.__qniMock.restartCalls[1].invoke())
    await page.waitForTimeout(100)
    expect(await page.evaluate(() => ({ calls: window.__qniMock.calls.length, live: window.__qniMock.live })))
      .toEqual({ calls: phase === 'disconnected' ? 2 : 3, live: phase === 'disconnected' ? 0 : 1 })
  })
}

for (const enabled of [true, false]) {
  test(`changing run-button to ${enabled} preserves the edited circuit`, async ({ page }) => {
    await boot(page)
    await running(page)
    if (!enabled) {
      await page.locator('qni-webgpu-circuit').evaluate(e => e.setAttribute('run-button', ''))
      await running(page)
    }
    const edited = '{"cols":[["X"],["Measure"]]}'
    await page.evaluate(({ edited, enabled }) => {
      window.__qniMock.currentCircuit = edited
      document.querySelector('qni-webgpu-circuit')!.toggleAttribute('run-button', enabled)
    }, { edited, enabled })
    await running(page)
    expect((await snapshot(page)).calls.at(-1)?.circuit).toBe(edited)
  })
}

test('rapid run-button changes preserve the edited circuit', async ({ page }) => {
  await boot(page)
  await running(page)
  const edited = '{"cols":[["X"],["Measure"]]}'
  await page.evaluate(edited => {
    window.__qniMock.currentCircuit = edited
    const e = document.querySelector('qni-webgpu-circuit')!
    e.setAttribute('run-button', '')
    e.removeAttribute('run-button')
  }, edited)
  await running(page)
  expect((await snapshot(page)).calls.at(-1)?.circuit).toBe(edited)
})

test('removing run-button disables the embedded restart setting', async ({ page }) => {
  await boot(page)
  await running(page)
  await page.locator('qni-webgpu-circuit').evaluate(e => e.setAttribute('run-button', ''))
  await running(page)
  await page.locator('qni-webgpu-circuit').evaluate(e => e.removeAttribute('run-button'))
  await running(page)
  expect(await page.evaluate(() => window.__qniMock.restartCalls.map(c => c.show))).toEqual([false, true, false])
})

test('max-wire-count forwards integers, restarts on change and omits absent settings', async ({ page }) => {
  await boot(page)
  await running(page)
  expect(await page.evaluate(() => window.__qniMock.wireCalls.at(-1))).toEqual({ present: true, value: 1 })
  for (const value of ['4', ' 02 ', null]) {
    await page.locator('qni-webgpu-circuit').evaluate((element, value) => {
      if (value === null) element.removeAttribute('max-wire-count')
      else element.setAttribute('max-wire-count', value)
    }, value)
    await running(page)
    expect(await page.evaluate(() => window.__qniMock.wireCalls.at(-1))).toEqual(value === null ? { present: false } : { present: true, value: Number(value) })
  }
  expect((await snapshot(page)).maxLive).toBe(1)
})

for (const value of ['', '0', '-1', '1.5', '2foo', 'NaN', '9007199254740992']) {
  test(`rejects invalid max-wire-count ${JSON.stringify(value)}`, async ({ page }) => {
    await boot(page)
    await running(page)
    await page.locator('qni-webgpu-circuit').evaluate((element, value) => element.setAttribute('max-wire-count', value), value)
    await page.locator('qni-webgpu-circuit[data-state="error"]').waitFor()
    await expect(page.locator('qni-webgpu-circuit')).toHaveAttribute('data-error-code', 'invalid-embed')
    await expect(page.locator('.error-slot').getByRole('heading', { level: 3 })).toHaveText('回路のデータに問題があります')
    expect((await snapshot(page)).calls).toHaveLength(1)
    expect((await snapshot(page)).live).toBe(0)
  })
}

for (const palette of ['not-json', 'null', '"H"', '["H",1]']) {
  test(`rejects invalid palette ${palette} without starting a new runner`, async ({ page }) => {
    await boot(page)
    await running(page)
    await page.locator('qni-webgpu-circuit').evaluate((element, value) => element.setAttribute('palette', value), palette)
    await page.locator('qni-webgpu-circuit[data-state="error"]').waitFor()
    await expect(page.locator('qni-webgpu-circuit')).toHaveAttribute('data-error-code', 'invalid-embed')
    await expect(page.locator('.error-slot').getByRole('heading', { level: 3 })).toHaveText('回路のデータに問題があります')
    expect((await snapshot(page)).calls).toHaveLength(1)
    expect((await snapshot(page)).live).toBe(0)
  })
}
