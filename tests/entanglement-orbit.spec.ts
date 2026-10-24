import { expect, test } from '@playwright/test'

for (const width of [390, 1440]) {
  test(`entanglement review content and placement at ${width}`, async ({ page }) => {
    // Assert our markup without depending on the external Orbit service.
    await page.route('https://js.withorbit.com/**', route => route.abort())
    await page.setViewportSize({ width, height: 1000 })
    await page.goto('/qni-tutorial-webgpu/entanglement/')
    const review = page.locator('orbit-reviewarea')
    await expect(review).toHaveCount(1)
    await expect(review).toHaveAttribute('color', 'blue')
    const prompts = review.locator('orbit-prompt')
    await expect(prompts).toHaveCount(4)
    for (const [index, answer] of [
      'CNOT ゲートです。',
      '50% です。',
      '|1⟩ です。',
      '結果が異なる |01⟩ と |10⟩ の振幅がともに 0 だからです。',
    ].entries()) {
      await expect(prompts.nth(index)).toHaveAttribute('answer', answer)
      await expect(prompts.nth(index)).toHaveAttribute('question', /ベル状態 \(\|00⟩ \+ \|11⟩\)\/√2/)
    }
    await expect(page.locator('script[src="https://js.withorbit.com/orbit-web-component.js"]')).toHaveCount(1)
    expect(await review.evaluate(element => {
      const circuit = document.querySelector('main qni-webgpu-circuit')!
      return Boolean(circuit.compareDocumentPosition(element) & Node.DOCUMENT_POSITION_FOLLOWING)
    })).toBe(true)
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  })
}
