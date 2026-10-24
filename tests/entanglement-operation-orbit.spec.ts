import { expect, test } from '@playwright/test'
import expectedPrompts from './fixtures/entanglement-operation-orbit.json' with { type: 'json' }

for (const width of [390, 1440]) {
  test(`entanglement operation review preserves standalone prompts at ${width}`, async ({ page }) => {
    // Keep the markup regression independent of Orbit availability.
    await page.route('https://js.withorbit.com/**', route => route.abort())
    await page.setViewportSize({ width, height: 1000 })
    await page.goto('/qni-tutorial-webgpu/entanglement_operation/')
    const review = page.locator('orbit-reviewarea')
    await expect(review).toHaveAttribute('color', 'blue')
    const prompts = review.locator('orbit-prompt')
    await expect(prompts).toHaveCount(6)
    const answers = await prompts.evaluateAll(elements => elements.map(element => element.getAttribute('answer')))
    expect(answers).toEqual([
      '(|01⟩ + |10⟩)/√2 です。',
      '10 です（確率 100%）。',
      '01 です（確率 100%）。',
      '11 です（確率 100%）。',
      '逆ベル回路です。',
      'Z ゲートです。',
    ])
    for (const [index, { question, answer }] of expectedPrompts.entries()) {
      await expect(prompts.nth(index)).toHaveAttribute('question', question)
      await expect(prompts.nth(index)).toHaveAttribute('answer', answer)
    }
    for (const index of [1, 2, 3]) {
      await expect(prompts.nth(index)).toHaveAttribute('question', /左がビット 2、右がビット 1/)
      await expect(prompts.nth(index)).toHaveAttribute('question', /CNOT（制御: ビット 1、標的: ビット 2）、ビット 1 の H/)
    }
    await expect(page.locator('script[src="https://js.withorbit.com/orbit-web-component.js"]')).toHaveCount(1)
    await expect(page.locator('qni-webgpu-circuit')).toHaveCount(3)
    const bounds = await review.boundingBox()
    expect(bounds).not.toBeNull()
    expect(bounds!.x).toBeGreaterThanOrEqual(0)
    expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(width)
  })
}

test('local operations followed by inverse Bell circuit give the review answers', () => {
  const s = Math.SQRT1_2
  const bell = [s, 0, 0, s]
  const x = ([a, b, c, d]: number[]) => [b, a, d, c]
  const z = ([a, b, c, d]: number[]) => [a, -b, c, -d]
  const cnot = ([a, b, c, d]: number[]) => [a, d, c, b]
  const h = ([a, b, c, d]: number[]) => [(a + b) * s, (a - b) * s, (c + d) * s, (c - d) * s]
  expect(x(bell)).toEqual([0, s, s, 0])
  for (const [encoded, expected] of [[x(bell), 2], [z(bell), 1], [z(x(bell)), 3]] as const) {
    h(cnot(encoded)).forEach((amplitude, index) => {
      expect(amplitude ** 2).toBeCloseTo(index === expected ? 1 : 0, 12)
    })
  }
})
