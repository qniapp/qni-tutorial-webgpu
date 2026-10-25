import { expect, test } from '@playwright/test'

for (const width of [390, 639, 640, 767, 768, 1280, 1920]) {
  test(`Orbit review matches the prose column at ${width}px`, async ({ page }) => {
    const proseLeft = width >= 768
      ? 256 + Math.max(0, (width - 256 - 1120) / 2) + 24
      : width <= 640 ? 16 : 24
    // The host owns the column width, even when the third-party embed is offline.
    await page.route('https://js.withorbit.com/**', route => route.abort())
    await page.setViewportSize({ width, height: 900 })
    for (const slug of ['h_gate', 'superposition', 'cpu_vs_qpu_operations', 'teleportation_circuit']) {
      await page.goto(`/qni-tutorial-webgpu/${slug}/`)
      const prose = await page.locator('.content-with-margin > p').last().boundingBox()
      const review = await page.locator('orbit-reviewarea').boundingBox()
      expect(prose, slug).not.toBeNull()
      expect(review, slug).not.toBeNull()
      expect(prose!.width, slug).toBeGreaterThan(0)
      expect(review!.x, slug).toBeCloseTo(prose!.x, 1)
      expect(review!.width, slug).toBeCloseTo(prose!.width, 1)
      expect(prose!.x, slug).toBe(proseLeft)
    }
    // Keep the independently sized figures left-aligned with that same column.
    await page.goto('/qni-tutorial-webgpu/h_gate/')
    const figure = await page.locator('.content-with-margin > figure').first().boundingBox()
    expect(figure).not.toBeNull()
    expect(figure!.x).toBe(proseLeft)
  })
}
