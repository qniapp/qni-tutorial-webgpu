import { expect, test } from '@playwright/test'
import expectedPrompts from './fixtures/operator-pair-orbit.json' with { type: 'json' }

for (const width of [390, 1440]) {
  test(`operator pair review markup and column at ${width}px`, async ({ page }) => {
    // Check our markup independently of the third-party service's availability.
    await page.route('https://js.withorbit.com/**', route => route.abort())
    await page.setViewportSize({ width, height: 900 })
    await page.goto('/qni-tutorial-webgpu/operator_pair/')
    const review = page.locator('orbit-reviewarea')
    await expect(review).toHaveAttribute('color', 'blue')
    const prompts = review.locator('orbit-prompt')
    await expect(prompts).toHaveCount(4)
    for (const [index, { question, answer }] of expectedPrompts.entries()) {
      await expect(prompts.nth(index)).toHaveAttribute('answer', answer)
      await expect(prompts.nth(index)).toHaveAttribute('question', question)
    }
    const script = page.locator('script[src="https://js.withorbit.com/orbit-web-component.js"]')
    await expect(script).toHaveCount(1)
    await expect(script).toHaveAttribute('type', 'module')
    const proseBox = await page.locator('.content-with-margin > p').last().boundingBox()
    const reviewBox = await review.boundingBox()
    expect(proseBox).not.toBeNull()
    expect(reviewBox).not.toBeNull()
    expect(reviewBox!.width).toBeGreaterThan(0)
    expect(reviewBox!.x).toBeCloseTo(proseBox!.x, 1)
    expect(reviewBox!.width).toBeCloseTo(proseBox!.width, 1)
  })
}
