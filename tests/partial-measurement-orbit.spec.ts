import { expect, test } from '@playwright/test'

for (const width of [390, 1280]) {
  test(`partial measurement review markup and layout at ${width}px`, async ({ page }) => {
    // Keep this regression deterministic; live Orbit interactions are checked separately.
    await page.route('https://js.withorbit.com/**', route => route.abort())
    await page.setViewportSize({ width, height: 900 })
    await page.goto('/qni-tutorial-webgpu/partial_measurement/')

    const review = page.locator('orbit-reviewarea')
    await expect(review).toHaveCount(1)
    await expect(review).toHaveAttribute('color', 'blue')
    const prompts = review.locator('orbit-prompt')
    await expect(prompts).toHaveCount(5)
    const answers = [
      '状態 1 と状態 3 の確率を足します。',
      '1/3 + 1/3 = 2/3 です。',
      'どちらも最下位ビットが 1 で、測定結果の 0 と両立しないからです。',
      '得られた測定結果のもとで、残る状態の確率の合計を 100% にするためです。',
      '1/2（50%）です。',
    ]
    for (const [index, answer] of answers.entries()) {
      await expect(prompts.nth(index)).toHaveAttribute('answer', answer)
      await expect(prompts.nth(index)).toHaveAttribute('question', /.+/)
    }
    await expect(prompts.nth(0)).toHaveAttribute('question', /最下位ビット（このページのビット 1）/)
    await expect(prompts.nth(4)).toHaveAttribute('question', /1 が出た後/)
    await expect(page.locator('script[src="https://js.withorbit.com/orbit-web-component.js"]')).toHaveCount(1)

    const prose = await page.locator('.content-with-margin > p').last().boundingBox()
    const box = await review.boundingBox()
    expect(prose).not.toBeNull()
    expect(box).not.toBeNull()
    expect(box!.x).toBeCloseTo(prose!.x, 1)
    expect(box!.width).toBeCloseTo(prose!.width, 1)
    expect(box!.y).toBeGreaterThan(prose!.y + prose!.height)
  })
}
