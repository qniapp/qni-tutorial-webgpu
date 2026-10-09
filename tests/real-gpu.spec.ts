import { expect, test } from '@playwright/test'

// This test exercises the real pinned bundle, unlike the lifecycle mocks.
test('built H-gate page loads the real WebGPU runner under the Pages base path', async ({ page }, testInfo) => {
  const consoleErrors: string[] = []
  const pageErrors: string[] = []
  const notFound: string[] = []
  page.on('console', message => { if (message.type() === 'error') consoleErrors.push(message.text()) })
  page.on('pageerror', error => pageErrors.push(error.message))
  page.on('response', response => { if (response.status() === 404) notFound.push(response.url()) })
  await page.goto('/qni-tutorial-webgpu/h_gate/')
  const webgpu = await page.evaluate(async () => {
    const gpu = (navigator as Navigator & { gpu?: { requestAdapter(): Promise<unknown> } }).gpu
    return { present: !!gpu, adapter: !!(gpu && await gpu.requestAdapter()) }
  })
  console.log('Headless WebGPU:', JSON.stringify(webgpu))
  test.skip(!webgpu.adapter, 'Headless Chromium cannot acquire a WebGPU adapter on this machine')
  const element = page.locator('qni-webgpu-circuit')
  await element.locator('canvas').scrollIntoViewIfNeeded()
  await page.waitForFunction(() => {
    const state = document.querySelector<HTMLElement>('qni-webgpu-circuit')?.dataset.state
    return state === 'running' || state === 'error'
  })
  const result = await page.evaluate(async () => {
    const element = document.querySelector<HTMLElement>('qni-webgpu-circuit')!
    if (element.dataset.state !== 'running') return { started: false, amplitudes: [] }
    const modulePath = '/qni-tutorial-webgpu/qni-webgpu/qni-web.js'
    const module = await import(modulePath) as { read_state_vector(): Promise<Float32Array> }
    const deadline = performance.now() + 10_000
    while (performance.now() < deadline) {
      try {
        const values = Array.from(await module.read_state_vector())
        if (values.length) return { started: true, amplitudes: values }
      } catch { /* First render may not have populated test readback yet. */ }
      await new Promise(resolve => setTimeout(resolve, 50))
    }
    throw new Error('Runner did not produce a GPU state vector')
  })
  await page.locator('figure img').scrollIntoViewIfNeeded()
  await page.waitForFunction(() => {
    const image = document.querySelector<HTMLImageElement>('figure img')!
    return image.complete && image.naturalWidth > 0
  })
  await element.locator('canvas').screenshot({ path: testInfo.outputPath('h-gate-canvas.png') })
  await page.screenshot({ path: testInfo.outputPath('h-gate-page.png'), fullPage: true })
  console.log('Real embed verification:', JSON.stringify({ ...webgpu, ...result, consoleErrors, pageErrors, notFound }))
  expect({ ...webgpu, ...result, consoleErrors, pageErrors, notFound })
    .toEqual({ present: true, adapter: true, started: true, amplitudes: [1, 0, 0, 0], consoleErrors: [], pageErrors: [], notFound: [] })
})

test('index links and local assets respect the Pages base path', async ({ page }) => {
  await page.route('**/qni-embed.mjs', route => route.fulfill({
    contentType: 'text/javascript',
    body: 'export async function startEmbed() { return {destroy(){}} }',
  }))
  await page.goto('/qni-tutorial-webgpu/')
  const links = await page.locator('a[href]').evaluateAll(elements => elements.map(element => element.getAttribute('href')))
  await page.goto('/qni-tutorial-webgpu/h_gate/')
  const assets = await page.locator('img[src], link[rel="icon"]').evaluateAll(elements => elements.map(element => element.getAttribute('src') ?? element.getAttribute('href')))
  expect([...links, ...assets].every(url => url?.startsWith('/qni-tutorial-webgpu/'))).toBe(true)
})
