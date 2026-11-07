import { expect, test } from '@playwright/test'
import expectedPrompts from './fixtures/cnot-orbit.json' with { type: 'json' }

for (const width of [390, 1280]) {
  test(`CNOT review markup and column at ${width}px`, async ({ page }) => {
    // Check our markup deterministically; the live Orbit service is external.
    await page.route('https://js.withorbit.com/**', route => route.abort())
    await page.setViewportSize({ width, height: 900 })
    await page.goto('/qni-tutorial-webgpu/cnot_gate/')
    const review = page.locator('orbit-reviewarea')
    await expect(review).toHaveAttribute('color', 'blue')
    const prompts = review.locator('orbit-prompt')
    await expect(prompts).toHaveCount(6)
    for (const [index, { question, answer }] of expectedPrompts.entries()) {
      const prompt = prompts.nth(index)
      await expect(prompt).toHaveAttribute('question', question)
      await expect(prompt).toHaveAttribute('answer', answer)
      expect(await prompt.getAttribute('question')).not.toMatch(/[\u2460-\u2473]/)
    }
    await expect(prompts.nth(2)).toHaveAttribute('answer', '|01⟩ と |11⟩ のペアです。')
    await expect(prompts.nth(3)).toHaveAttribute('answer', '(|00⟩ + |11⟩)/√2 です。')
    await expect(page.locator('script[src="https://js.withorbit.com/orbit-web-component.js"]')).toHaveCount(1)
    const prose = await page.locator('.content-with-margin > p').last().boundingBox()
    const area = await review.boundingBox()
    expect(area!.x).toBeCloseTo(prose!.x, 1)
    expect(area!.width).toBeCloseTo(prose!.width, 1)
  })
}
