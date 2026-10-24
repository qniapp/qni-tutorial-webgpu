import { expect, test } from '@playwright/test'

for (const width of [390, 1440]) {
  test(`multi-qubit superposition review markup at ${width}px`, async ({ page }) => {
    // Test the host contract without relying on the external Orbit service.
    await page.route('https://js.withorbit.com/**', route => route.abort())
    await page.setViewportSize({ width, height: 900 })
    await page.goto('/qni-tutorial-webgpu/multi_qubit_superposition/')

    const review = page.locator('orbit-reviewarea')
    const prompts = review.locator('orbit-prompt')
    await expect(review).toHaveAttribute('color', 'blue')
    await expect(prompts).toHaveCount(5)
    const questions = await prompts.evaluateAll(nodes => nodes.map(node => node.getAttribute('question')))
    expect(new Set(questions).size).toBe(5)
    for (const question of questions) {
      expect(question).toContain('計算基底')
      expect(question).not.toMatch(/[\u2460-\u2473]/u)
    }
    for (let index = 0; index < 5; index++) {
      await expect(prompts.nth(index)).toHaveAttribute('answer', /\S/)
    }
    await expect(prompts.nth(1)).toHaveAttribute('answer', /^25%/)
    await expect(prompts.nth(2)).toHaveAttribute('answer', /^1 個/)
    await expect(prompts.nth(3)).toHaveAttribute('answer', '1（100%）です。')
    await expect(page.locator('script[src="https://js.withorbit.com/orbit-web-component.js"]')).toHaveCount(1)
    await expect(page.locator('qni-webgpu-circuit')).toHaveCount(3)

    const box = await review.boundingBox()
    expect(box).not.toBeNull()
    expect(box!.width).toBeGreaterThan(0)
    expect(box!.x).toBeGreaterThanOrEqual(0)
    expect(box!.x + box!.width).toBeLessThanOrEqual(width)
  })
}
