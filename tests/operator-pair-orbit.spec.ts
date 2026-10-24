import { expect, test } from '@playwright/test'

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
    const answers = [
      '右から n ビット目だけが異なり、ほかの桁はすべて同じです。',
      '異なるのは n ビット目だけで、その桁の重みが $2^{n-1}$ だからです。',
      '100 です。',
      '対象外の右から 3 ビット目も異なるからです。',
    ]
    for (const [index, answer] of answers.entries()) {
      await expect(prompts.nth(index)).toHaveAttribute('answer', answer)
      await expect(prompts.nth(index)).toHaveAttribute('question', /\S/)
    }
    await expect(page.locator('script[src="https://js.withorbit.com/orbit-web-component.js"]'))
      .toHaveCount(1)
    const proseBox = await page.locator('.content-with-margin > p').last().boundingBox()
    const reviewBox = await review.boundingBox()
    expect(proseBox).not.toBeNull()
    expect(reviewBox).not.toBeNull()
    expect(reviewBox!.width).toBeGreaterThan(0)
    expect(reviewBox!.x).toBeCloseTo(proseBox!.x, 1)
    expect(reviewBox!.width).toBeCloseTo(proseBox!.width, 1)
  })
}
