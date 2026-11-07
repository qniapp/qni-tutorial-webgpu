import { expect, test } from '@playwright/test'

test('multi-qubit operations provides six focused Orbit prompts', async ({ page }) => {
  await page.route('https://js.withorbit.com/**', route => route.abort())
  await page.goto('/qni-tutorial-webgpu/multi_qubit_operation/')
  const review = page.locator('orbit-reviewarea')
  await expect(review).toHaveAttribute('color', 'blue')
  const prompts = review.locator('orbit-prompt')
  await expect(prompts).toHaveCount(6)
  const cards = await prompts.evaluateAll(elements => elements.map(element => ({
    question: element.getAttribute('question'),
    answer: element.getAttribute('answer'),
  })))
  expect(cards.every(card => card.question && card.answer)).toBe(true)
  expect(new Set(cards.map(card => card.question)).size).toBe(6)
  // Flipping the selected bit, rather than always adding its weight, picks the partner.
  for (const [index, label, bit] of [[1, 6, 0], [2, 1, 1], [3, 6, 2]]) {
    expect(cards[index].answer).toBe(`|${label ^ (1 << bit)}⟩ の振幅です。`)
  }
  expect(cards[4].answer).toBe('$2^{n-1}$ です。')
  await expect(page.locator('script[src="https://js.withorbit.com/orbit-web-component.js"]')).toHaveAttribute('type', 'module')
  // Check that Astro emitted literal braces and MathJax rendered both corrected formulas.
  const summary = page.locator('p').filter({ hasText: '演算ペアの決めかたは一般に' })
  await expect(summary.locator('mjx-container')).toHaveCount(3)
  await expect(summary.locator('mjx-merror')).toHaveCount(0)
})
