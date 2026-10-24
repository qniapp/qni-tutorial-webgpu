import { expect, test } from '@playwright/test'

for (const width of [390, 1280]) {
  test(`multi-qubit PHASE review markup and layout at ${width}px`, async ({ page }) => {
    // Keep the regression test independent of the external Orbit service.
    await page.route('https://js.withorbit.com/**', route => route.abort())
    await page.setViewportSize({ width, height: 900 })
    await page.goto('/qni-tutorial-webgpu/multi_qubit_phase_gate/')
    const review = page.locator('orbit-reviewarea')
    await expect(review).toHaveAttribute('color', 'blue')
    const prompts = review.locator('orbit-prompt')
    await expect(prompts).toHaveCount(6)
    for (const prompt of await prompts.all()) {
      await expect(prompt).toHaveAttribute('question', /\S/)
      await expect(prompt).toHaveAttribute('answer', /\S/)
      expect(await prompt.evaluate(el => el.getAttributeNames().filter(name => !name.startsWith('data-astro-')).sort())).toEqual(['answer', 'question'])
      expect(await prompt.getAttribute('question')).not.toMatch(/[\u2460-\u2473]/u)
      expect(await prompt.getAttribute('answer')).not.toMatch(/[\u2460-\u2473]/u)
    }
    await expect(page.locator('script[src="https://js.withorbit.com/orbit-web-component.js"]')).toHaveCount(1)
    const prose = await page.locator('.content-with-margin > p').last().boundingBox()
    const box = await review.boundingBox()
    expect(prose).not.toBeNull()
    expect(box).not.toBeNull()
    expect(box!.x).toBeCloseTo(prose!.x, 1)
    expect(box!.width).toBeCloseTo(prose!.width, 1)
  })
}
