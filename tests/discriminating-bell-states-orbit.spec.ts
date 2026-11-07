import { expect, test } from '@playwright/test'
import prompts from './fixtures/discriminating-bell-states-orbit.json' with { type: 'json' }

for (const width of [1440, 390]) {
  test(`Bell discrimination review markup and layout at ${width}px`, async ({ page }) => {
    // Deterministic local checks; live Orbit interaction is verified separately.
    await page.route('https://js.withorbit.com/**', route => route.abort())
    await page.setViewportSize({ width, height: 1000 })
    await page.goto('/qni-tutorial-webgpu/discriminating_bell_states/')
    const review = page.locator('main orbit-reviewarea[color="blue"]')
    await expect(review).toHaveCount(1)
    await expect(review.locator('orbit-prompt')).toHaveCount(prompts.length)
    for (const [index, prompt] of prompts.entries()) {
      await expect(review.locator('orbit-prompt').nth(index)).toHaveAttribute('question', prompt.question)
      await expect(review.locator('orbit-prompt').nth(index)).toHaveAttribute('answer', prompt.answer)
    }
    await expect(page.locator('script[src="https://js.withorbit.com/orbit-web-component.js"]')).toHaveAttribute('type', 'module')
    const bounds = await review.boundingBox()
    expect(bounds).not.toBeNull()
    expect(bounds!.x).toBeGreaterThanOrEqual(0)
    expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(width)
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width)
  })
}
