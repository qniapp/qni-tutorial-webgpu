import { chromium, expect, test, type Locator, type Page } from '@playwright/test'
import { readFileSync } from 'node:fs'

test.use({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true })

const releasePin = readFileSync(new URL('../qni-embed.ref', import.meta.url), 'utf8').trim()

test('pinned H-gate embed runs real GPU code and fits a touch phone', async ({ page }, testInfo) => {
  const sourceBuild = testInfo.project.metadata.sourceEmbed === true
  let artifactBase = sourceBuild ? '/qni-tutorial-webgpu/qni-webgpu/' : '/qni-tutorial-webgpu/qni-webgpu-prebuilt/'
  const runtimeRequests: string[] = []
  const upstreamGateRequests: string[] = []
  const failures: string[] = []
  page.on('request', request => {
    const path = new URL(request.url()).pathname
    if (path.startsWith('/qni-tutorial-webgpu/qni-webgpu-prebuilt/') && /\/h-gate\.js$/.test(path)) {
      upstreamGateRequests.push(path)
    }
    if (/\/qni-(?:embed(?:-error)?\.mjs|web\.js|web_bg\.wasm)(?:\?|$)/.test(request.url())) {
      runtimeRequests.push(new URL(request.url()).pathname)
    }
  })
  page.on('pageerror', error => failures.push(error.message))
  page.on('response', response => {
    if (new URL(response.url()).pathname.startsWith(artifactBase) && !response.ok()) {
      failures.push(`${response.status()} ${response.url()}`)
    }
  })
  await page.goto('/qni-tutorial-webgpu/h_gate/')
  if (sourceBuild) {
    await expect(page.locator('html')).not.toHaveAttribute('data-qni-embed-base')
    const pin = readFileSync(new URL('../qni-webgpu.ref', import.meta.url), 'utf8').trim()
    const provenance = await page.evaluate(async base => {
      const runtime = await import(/* @vite-ignore */ `${base}qni-embed.mjs`)
      return { source: runtime.SOURCE_COMMIT, api: runtime.EMBED_API_VERSION }
    }, artifactBase)
    expect(provenance).toEqual({ source: pin, api: 1 })
  } else {
    await expect(page.locator('html')).toHaveAttribute('data-qni-embed-base', /^\/qni-tutorial-webgpu\/qni-webgpu-prebuilt\/embed-[a-f0-9]{40}\/$/)
    artifactBase = (await page.locator('html').getAttribute('data-qni-embed-base'))!
    expect(artifactBase).toBe(`/qni-tutorial-webgpu/qni-webgpu-prebuilt/embed-${releasePin}/`)
  }
  expect(await page.evaluate(() => ({ width: innerWidth, touch: navigator.maxTouchPoints > 0 })))
    .toEqual({ width: 390, touch: true })

  const circuit = page.locator('qni-webgpu-circuit')
  await expect(circuit).toHaveCount(1)
  await circuit.scrollIntoViewIfNeeded()
  // No skip on missing WebGPU: this is the dedicated SwiftShader acceptance gate.
  await expect(circuit).toHaveAttribute('data-state', 'running', { timeout: 45_000 })
  await expect.poll(async () => circuit.evaluate(async element => {
    try {
      const state = await (element as CircuitElement).runner.readStateVector()
      return Array.from(state)
    } catch {
      return [] // Readback may not exist until the first submitted GPU frame.
    }
  }), { timeout: 10_000, message: 'runner computes the authored zero state' }).toEqual([1, 0, 0, 0])
  await circuit.evaluate(element => element.setAttribute('circuit', '{"cols":[["H"]]}'))
  await expect.poll(async () => circuit.evaluate(async element => {
    try {
      const state = await (element as CircuitElement).runner.readStateVector()
      return state.length === 4
        && Math.abs(state[0] - Math.SQRT1_2) < 0.0001
        && Math.abs(state[1]) < 0.0001
        && Math.abs(state[2] - Math.SQRT1_2) < 0.0001
        && Math.abs(state[3]) < 0.0001
    } catch { return false }
  }), { timeout: 10_000, message: 'runner computes H on zero, interleaved real/imaginary' }).toBe(true)
  expect(upstreamGateRequests).toEqual([])
  expect(await page.evaluate(() => !!customElements.get('h-gate'))).toBe(true)

  for (const asset of ['qni-embed.mjs', 'qni-embed-error.mjs', 'qni-web.js', 'qni-web_bg.wasm']) {
    expect(runtimeRequests).toContain(`${artifactBase}${asset}`)
  }
  expect(runtimeRequests.every(path => path.startsWith(artifactBase))).toBe(true)
  const geometry = await circuit.evaluate(element => {
    const box = element.getBoundingClientRect()
    const canvas = element.shadowRoot!.querySelector('canvas')!.getBoundingClientRect()
    return {
      left: box.left, right: box.right, width: box.width,
      canvasLeft: canvas.left, canvasRight: canvas.right,
      viewport: innerWidth, document: document.documentElement.scrollWidth,
    }
  })
  expect(geometry.width).toBeGreaterThan(0)
  expect(geometry.left).toBeGreaterThanOrEqual(0)
  expect(geometry.right).toBeLessThanOrEqual(geometry.viewport)
  expect(geometry.canvasLeft).toBeGreaterThanOrEqual(geometry.left)
  expect(geometry.canvasRight).toBeLessThanOrEqual(geometry.right)
  expect(geometry.document).toBeLessThanOrEqual(geometry.viewport)
  expect(failures).toEqual([])
})

// The TypeScript-private runner is intentionally accessed at runtime: readbacks
// and edit/selection assertions must belong to this migrated host, not a global.
type CircuitElement = HTMLElement & {
  runner: {
    readStateVector(): Promise<Float32Array>
    selectedStep(): number | null
    circuitJSON(): string
  }
}

const mobileCols = Array.from({ length: 14 }, (_, i) => i === 0 ? ['H', 1, 1, 'X'] : ['X'])

async function startMeasurement(page: Page) {
  await page.goto('/qni-tutorial-webgpu/measurement_operation/')
  await page.waitForFunction(() => document.documentElement.dataset.mathjax === 'ready')
  await page.evaluate(() => document.fonts.ready)
  const circuit = page.locator('main qni-webgpu-circuit').first()
  await expect(circuit).toHaveCount(1)
  // Keep the real article and custom element; only author deterministic content.
  await circuit.evaluate(element => {
    element.setAttribute('show-state-panel', 'false')
    element.setAttribute('max-wire-count', '4')
    element.setAttribute('palette', '["H","X"]')
    element.setAttribute('selected-step', '0')
  })
  await circuit.evaluate((element, cols) => {
    element.setAttribute('circuit', JSON.stringify({ cols }))
  }, mobileCols)
  await circuit.scrollIntoViewIfNeeded()
  // Missing GPU support is a failure, never a skip.
  await expect(circuit).toHaveAttribute('data-state', 'running', { timeout: 45_000 })
  await expect.poll(() => circuit.evaluate(async element => {
    try {
      const runner = (element as CircuitElement).runner
      const state = await runner.readStateVector()
      return { vector: Array.from(state, n => Math.round(n * 1e6) / 1e6), step: runner.selectedStep(), cols: JSON.parse(runner.circuitJSON()).cols }
    } catch { return null }
  }), { timeout: 10_000 }).toEqual({
    // Column zero applies H on wire zero and X on wire three: (|8>+|9>)/√2.
    vector: Array.from({ length: 32 }, (_, i) => i === 16 || i === 18 ? 0.707107 : 0),
    step: 0, cols: mobileCols,
  })
  // Leave article space above and below the canvas for native scrolling.
  await circuit.locator('canvas').evaluate(element => {
    scrollBy(0, element.getBoundingClientRect().top - 120)
  })
  await expectNoHorizontalOverflow(page, circuit)
  return circuit
}

async function expectNoHorizontalOverflow(page: Page, circuit: Locator) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390)
  const box = await circuit.locator('canvas').boundingBox()
  expect(box).not.toBeNull()
  expect(box!.x).toBeGreaterThanOrEqual(0)
  expect(box!.x + box!.width).toBeLessThanOrEqual(390)
}

async function canvasPoint(circuit: Locator, x: number, y: number) {
  const box = await circuit.locator('canvas').boundingBox()
  expect(box).not.toBeNull()
  expect(x).toBeLessThan(box!.width)
  expect(y).toBeLessThan(box!.height)
  return { x: box!.x + x, y: box!.y + y }
}

async function swipe(page: Page, from: { x: number; y: number }, to: { x: number; y: number }) {
  const cdp = await page.context().newCDPSession(page)
  try {
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ ...from, id: 1 }] })
    for (let i = 1; i <= 12; i++) {
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{
        x: from.x + (to.x - from.x) * i / 12,
        y: from.y + (to.y - from.y) * i / 12, id: 1,
      }] })
      await page.waitForTimeout(25)
    }
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
  } finally {
    await cdp.detach()
  }
  await page.waitForTimeout(200)
}

test('authored introduction permits an empty-space vertical touch swipe', async ({ page }) => {
  await page.goto('/qni-tutorial-webgpu/')
  const circuit = page.locator('qni-webgpu-circuit')
  await circuit.scrollIntoViewIfNeeded()
  await expect(circuit).toHaveAttribute('data-state', 'running', { timeout: 45_000 })
  await circuit.locator('canvas').evaluate(element => {
    scrollBy(0, element.getBoundingClientRect().top - 120)
  })
  const before = await page.evaluate(() => scrollY)
  const authored = await circuit.evaluate(element => (element as CircuitElement).runner.circuitJSON())
  const box = (await circuit.locator('canvas').boundingBox())!
  await swipe(page, await canvasPoint(circuit, box.width - 40, 380), await canvasPoint(circuit, box.width - 40, 160))
  await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(before + 50)
  expect(await circuit.evaluate(element => (element as CircuitElement).runner.circuitJSON())).toBe(authored)
  await expectNoHorizontalOverflow(page, circuit)
})

test('real runtime renders its unavailable-adapter error on a touch phone', async ({ baseURL }) => {
  const browser = await chromium.launch({ args: ['--no-sandbox', '--disable-gpu'] })
  try {
    const page = await browser.newPage({ baseURL, viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true })
    await page.goto('/qni-tutorial-webgpu/h_gate/')
    const circuit = page.locator('qni-webgpu-circuit')
    await circuit.scrollIntoViewIfNeeded()
    await expect(circuit).toHaveAttribute('data-state', 'error', { timeout: 45_000 })
    await expect(circuit).toHaveAttribute('data-error-code', 'gpu-adapter-unavailable')
    await expect(circuit.locator('.error-slot').getByRole('heading')).toBeVisible()
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390)
    const box = (await circuit.boundingBox())!
    expect(box.x).toBeGreaterThanOrEqual(0)
    expect(box.x + box.width).toBeLessThanOrEqual(390)
  } finally {
    await browser.close()
  }
})

test('migrated measurement embed swipes to later steps on a 390px GPU phone', async ({ page }) => {
  const circuit = await startMeasurement(page)
  // Upstream's article canvas starts at y=40. Use its canvas-local y=295,
  // but derive the swipe's right edge from the narrower tutorial canvas.
  const box = (await circuit.locator('canvas').boundingBox())!
  await swipe(page, await canvasPoint(circuit, box.width - 40, 295), await canvasPoint(circuit, 60, 295))
  const tap = await canvasPoint(circuit, 144, 295)
  await page.touchscreen.tap(tap.x, tap.y)
  await expect.poll(() => circuit.evaluate(element => (element as CircuitElement).runner.selectedStep())).toBeGreaterThan(1)
  expect(await circuit.evaluate(element => JSON.parse((element as CircuitElement).runner.circuitJSON()).cols)).toEqual(mobileCols)
  await expectNoHorizontalOverflow(page, circuit)
})

test('migrated measurement embed touch gate drag edits without scrolling the article', async ({ page }) => {
  const circuit = await startMeasurement(page)
  const before = await page.evaluate(() => scrollY)
  expect(before).toBeGreaterThan(50)
  // Move the authored H from column zero/wire zero to column two/wire one.
  await swipe(page, await canvasPoint(circuit, 88, 216), await canvasPoint(circuit, 200, 272))
  await expect.poll(() => circuit.evaluate(element => JSON.parse((element as CircuitElement).runner.circuitJSON()).cols))
    .toEqual([[1, 1, 1, 'X'], ['X'], ['X', 'H'], ...Array.from({ length: 11 }, () => ['X'])])
  expect(await page.evaluate(() => scrollY)).toBe(before)
  await expectNoHorizontalOverflow(page, circuit)
})

test('migrated measurement embed permits native vertical article scrolling and subsequent taps', async ({ page }) => {
  const circuit = await startMeasurement(page)
  const before = await page.evaluate(() => scrollY)
  const box = (await circuit.locator('canvas').boundingBox())!
  await swipe(page, await canvasPoint(circuit, box.width - 40, 380), await canvasPoint(circuit, box.width - 40, 160))
  await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(before + 50)
  expect(await circuit.evaluate(element => JSON.parse((element as CircuitElement).runner.circuitJSON()).cols)).toEqual(mobileCols)
  await page.evaluate(y => scrollTo(0, y), before)
  const tap = await canvasPoint(circuit, 144, 295)
  await page.touchscreen.tap(tap.x, tap.y)
  await expect.poll(() => circuit.evaluate(element => (element as CircuitElement).runner.selectedStep())).toBe(1)
  await expectNoHorizontalOverflow(page, circuit)
})
