import { expect, test } from '@playwright/test'
import pages from './fixtures/auto-height-pages.json' with { type: 'json' }

for (const width of [390, 1440]) {
  test(`all 68 pages use the real runner preferred height at ${width}px`, async ({ page }) => {
    test.setTimeout(900_000)
    await page.goto('/qni-tutorial-webgpu/')
    const adapter = await page.evaluate(async () => {
      const gpu = (navigator as Navigator & { gpu?: { requestAdapter(): Promise<unknown> } }).gpu
      return !!(gpu && await gpu.requestAdapter())
    })
    test.skip(!adapter, 'WebGPU adapter unavailable; startup geometry is covered separately')
    await page.setViewportSize({ width, height: 1000 })
    // Keep the production module and GPU path; expose only layout metadata to the test.
    await page.route('**/qni-embed.mjs', async route => {
      const response = await route.fetch()
      const body = (await response.text()).replace('export async function startEmbed(', 'async function startOriginalEmbed(')
        + '\nexport async function startEmbed(canvas, circuit, settings) { const runner = await startOriginalEmbed(canvas, circuit, settings); canvas.preferredHeightForTest = width => runner.preferredHeight(width); return runner; }\n'
      await route.fulfill({ response, body })
    })
    const failures: unknown[] = []
    for (const slug of pages) {
      await page.goto(`/qni-tutorial-webgpu/${slug === 'index' ? '' : `${slug}/`}`)
      await page.waitForFunction(() => [...document.querySelectorAll('qni-webgpu-circuit')]
        .every(element => element.getAttribute('data-state') === 'running'), null, { timeout: 60_000 })
      await page.waitForTimeout(300)
      const sizes = await page.locator('qni-webgpu-circuit').evaluateAll(elements => elements.map(element => {
        const canvas = element.shadowRoot!.querySelector('canvas') as HTMLCanvasElement & { preferredHeightForTest(width: number): number }
        const rect = canvas.getBoundingClientRect()
        const preferred = canvas.preferredHeightForTest(rect.width)
        return { height: rect.height, preferred, hostHeight: element.getBoundingClientRect().height,
          estimated: parseFloat((element as HTMLElement).style.getPropertyValue('--_qni-auto-height')),
          overflow: rect.right > innerWidth + 1 || rect.left < -1 }
      }))
      for (const size of sizes) if (size.overflow || Math.abs(size.height - size.preferred) > 1
        || Math.abs(size.hostHeight - size.preferred - 48) > 1) failures.push({ slug, ...size })
    }
    expect(failures).toEqual([])
  })
}
