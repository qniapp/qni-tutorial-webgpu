import { expect, test } from '@playwright/test'
import expectedPrompts from './fixtures/entanglement-orbit.json' with { type: 'json' }

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
    for (const [index, { question, answer }] of expectedPrompts.entries()) {
      await expect(prompts.nth(index)).toHaveAttribute('answer', answer)
      await expect(prompts.nth(index)).toHaveAttribute('question', question)
    }
    await expect(page.locator('script[src="https://js.withorbit.com/orbit-web-component.js"]')).toHaveCount(1)
    expect(await review.evaluate(element => {
      const circuit = document.querySelector('main qni-webgpu-circuit')!
      return Boolean(circuit.compareDocumentPosition(element) & Node.DOCUMENT_POSITION_FOLLOWING)
    })).toBe(true)
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  })
}
