import { expect, test } from '@playwright/test'

for (const width of [390, 1440]) {
  test(`disentangle review preserves the inverse Bell learning targets at ${width}`, async ({ page }) => {
    // Keep the markup regression independent of Orbit availability.
    await page.route('https://js.withorbit.com/**', route => route.abort())
    await page.setViewportSize({ width, height: 1000 })
    await page.goto('/qni-tutorial-webgpu/disentangle/')
    const review = page.locator('orbit-reviewarea')
    await expect(review).toHaveAttribute('color', 'blue')
    const prompts = review.locator('orbit-prompt')
    await expect(prompts).toHaveCount(5)
    expect(await prompts.evaluateAll(elements => elements.map(element => element.getAttribute('answer')))).toEqual([
      'q0 を制御・q1 を標的とする CNOT です。',
      '最後に行った操作から逆順に取り消すためです。',
      'q0 に H を適用します。',
      'q0 = 0、q1 = 0 です。',
      '逆ベル回路です。',
    ])
    for (const prompt of await prompts.all()) {
      await expect(prompt).toHaveAttribute('question', /\S+\?$/)
    }
    await expect(page.locator('script[src="https://js.withorbit.com/orbit-web-component.js"]')).toHaveCount(1)
    await expect(page.locator('qni-webgpu-circuit')).toHaveCount(7)
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  })
}
