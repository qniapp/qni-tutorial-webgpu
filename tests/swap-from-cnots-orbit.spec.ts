import { expect, test } from '@playwright/test'
import expectedPrompts from './fixtures/swap-from-cnots-orbit.json' with { type: 'json' }

for (const width of [390, 1440]) {
  test(`SWAP puzzle keeps the exercise before its solution and review at ${width}px`, async ({ page }) => {
    await page.route('https://js.withorbit.com/**', route => route.abort())
    await page.setViewportSize({ width, height: 1000 })
    await page.goto('/qni-tutorial-webgpu/swap_from_cnots/')

    const exercise = page.locator('main qni-webgpu-circuit')
    await expect(exercise).toHaveCount(1)
    await expect(exercise).toHaveAttribute('circuit', '{"cols":[["|0>","|1>"]]}')
    const solution = page.locator('main details')
    await expect(solution).not.toHaveAttribute('open', '')
    await solution.locator('summary').click()
    await expect(solution).toHaveAttribute('open', '')
    await expect(solution).toContainText('A→B、B→A、A→B')

    const review = page.locator('orbit-reviewarea[color="blue"]')
    const prompts = review.locator('orbit-prompt')
    await expect(prompts).toHaveCount(3)
    for (const [index, { question, answer }] of expectedPrompts.entries()) {
      await expect(prompts.nth(index)).toHaveAttribute('question', question)
      await expect(prompts.nth(index)).toHaveAttribute('answer', answer)
    }
    await expect(prompts.nth(0)).toHaveAttribute('answer', 'A→B、B→A、A→B です。（B→A、A→B、B→A でも同じ働きです）')
    await expect(prompts.nth(1)).toHaveAttribute('answer', /b XOR \(a XOR b\)/)
    await expect(prompts.nth(2)).toHaveAttribute('answer', '何もしない回路でも、同じ測定結果になるからです。')
    await expect(page.locator('script[src="https://js.withorbit.com/orbit-web-component.js"]')).toHaveAttribute('type', 'module')
    expect(await page.locator('main').evaluate(main => {
      const exercise = main.querySelector('qni-webgpu-circuit')!
      const solution = main.querySelector('details')!
      const review = main.querySelector('orbit-reviewarea')!
      return Boolean(exercise.compareDocumentPosition(solution) & Node.DOCUMENT_POSITION_FOLLOWING)
        && Boolean(solution.compareDocumentPosition(review) & Node.DOCUMENT_POSITION_FOLLOWING)
    })).toBe(true)
    await page.evaluate(() => document.fonts.ready)
    const proseBox = await page.locator('main p').first().boundingBox()
    const reviewBox = await review.boundingBox()
    expect(reviewBox!.x).toBeCloseTo(proseBox!.x, 1)
    const solutionBox = await solution.boundingBox()
    expect(reviewBox!.width).toBeCloseTo(solutionBox!.width, 1)
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width)
  })
}

test('the solution exchanges all four computational basis inputs without phases', () => {
  // CNOT only permutes basis amplitudes: checking every basis vector also
  // establishes the same SWAP action on their arbitrary superpositions.
  for (const a of [0, 1]) {
    for (const b of [0, 1]) {
      let A = a
      let B = b
      B ^= A
      A ^= B
      expect([A, B]).toEqual([b, a ^ b])
      B ^= A
      expect([A, B]).toEqual([b, a])
      // The alternative starting direction in the answer is also a SWAP.
      A = a
      B = b
      A ^= B
      B ^= A
      A ^= B
      expect([A, B]).toEqual([b, a])
    }
  }
})
