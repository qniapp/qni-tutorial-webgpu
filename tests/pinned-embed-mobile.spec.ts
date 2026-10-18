import { expect, test } from '@playwright/test'

test('pinned H-gate embed runs real GPU code and fits a touch phone', async ({ page }) => {
  let artifactBase = '/qni-tutorial-webgpu/qni-webgpu-prebuilt/'
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
  await expect(page.locator('html')).toHaveAttribute('data-qni-embed-base', /^\/qni-tutorial-webgpu\/qni-webgpu-prebuilt\/embed-[a-f0-9]{40}\/$/)
  artifactBase = (await page.locator('html').getAttribute('data-qni-embed-base'))!
  expect(await page.evaluate(() => ({ width: innerWidth, touch: navigator.maxTouchPoints > 0 })))
    .toEqual({ width: 390, touch: true })

  const circuit = page.locator('qni-webgpu-circuit')
  await expect(circuit).toHaveCount(1)
  await circuit.scrollIntoViewIfNeeded()
  // No skip on missing WebGPU: this is the dedicated SwiftShader acceptance gate.
  await expect(circuit).toHaveAttribute('data-state', 'running', { timeout: 45_000 })
  await expect.poll(async () => circuit.evaluate(async element => {
    try {
      const state = await (element as HTMLElement & { readStateVector(): Promise<Float32Array> }).readStateVector()
      return Array.from(state)
    } catch {
      return [] // Readback may not exist until the first submitted GPU frame.
    }
  }), { timeout: 10_000, message: 'runner computes the authored zero state' }).toEqual([1, 0, 0, 0])
  expect(upstreamGateRequests).toEqual([])
  expect(await page.evaluate(() => !!customElements.get('h-gate'))).toBe(true)

  for (const asset of ['qni-embed.mjs', 'qni-web.js', 'qni-web_bg.wasm']) {
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
