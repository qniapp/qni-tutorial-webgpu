import { expect, test } from '@playwright/test'
import expectedPrompts from './fixtures/cphase-orbit.json' with { type: 'json' }

test('CPHASE review prompts cover notation, action, and CZ', async ({ page }) => {
  await page.goto('/qni-tutorial-webgpu/cphase/')

  const areas = page.locator('orbit-reviewarea')
  await expect(areas).toHaveCount(3)
  const prompts = page.locator('orbit-reviewarea orbit-prompt')
  await expect(prompts).toHaveCount(7)
  for (const [index, { question, answer }] of expectedPrompts.entries()) {
    await expect(prompts.nth(index)).toHaveAttribute('question', question)
    await expect(prompts.nth(index)).toHaveAttribute('answer', answer)
  }
  await expect(prompts.nth(0)).toHaveAttribute('answer', 'コントロールビットとターゲットビットが両方 1 の成分です。')
  await expect(prompts.nth(2)).toHaveAttribute('answer', '両方とも π/4 にします。')
  await expect(prompts.nth(3)).toHaveAttribute('question', /状態ラベルの右端をビット 1/)
  await expect(prompts.nth(3)).toHaveAttribute('answer', 'π/4 ラジアンです。')
  await expect(prompts.nth(5)).toHaveAttribute('answer', 'π ラジアンです。')
  await expect(prompts.nth(6)).toHaveAttribute('answer', '−1 です。')
  await expect(page.locator('script[src="https://js.withorbit.com/orbit-web-component.js"]')).toHaveCount(1)
  await expect(page.locator('qni-webgpu-circuit')).toHaveCount(4)
})
