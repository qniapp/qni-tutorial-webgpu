import { expect, test } from '@playwright/test'
import expectedPrompts from './fixtures/superdense-coding-orbit.json' with { type: 'json' }

for (const width of [390, 1280, 1440]) {
  test(`superdense coding review content and layout at ${width}px`, async ({ page }) => {
    // Verify the host markup without depending on the external Orbit service.
    await page.route('https://js.withorbit.com/**', route => route.abort())
    await page.setViewportSize({ width, height: 900 })
    await page.goto('/qni-tutorial-webgpu/superdense_coding_circuit/')

    const review = page.locator('orbit-reviewarea')
    const prompts = review.locator('orbit-prompt')
    await expect(review).toHaveAttribute('color', 'blue')
    await expect(prompts).toHaveCount(7)
    const answers = await prompts.evaluateAll(nodes => nodes.map(node => node.getAttribute('answer')))
    expect(answers).toEqual([
      'ベルペアです。',
      '何もしません。',
      'Z ゲートです。',
      'X ゲートです。',
      'X ゲートと Z ゲートを両方適用します。',
      '1 個です。',
      '受け取った量子ビットと手元の量子ビットの組をベル測定します。',
    ])
    for (const [index, { question, answer }] of expectedPrompts.entries()) {
      await expect(prompts.nth(index)).toHaveAttribute('question', question)
      await expect(prompts.nth(index)).toHaveAttribute('answer', answer)
    }
    await expect(page.locator('script[src="https://js.withorbit.com/orbit-web-component.js"]')).toHaveCount(1)
    const prose = await page.locator('.content-with-margin > p').last().boundingBox()
    const box = await review.boundingBox()
    expect(prose).not.toBeNull()
    expect(box).not.toBeNull()
    expect(box!.x).toBeCloseTo(prose!.x, 1)
    expect(box!.width).toBeCloseTo(prose!.width, 1)
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  })
}
