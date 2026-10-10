import { expect, test } from '@playwright/test'

for (const width of [390, 1440]) {
  test(`interactive Bell image replacement preserves all three stages at ${width}`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 })
    await page.goto('/qni-tutorial-webgpu/entanglement/')
    const diagram = page.locator('.bell-illustration')
    await expect(diagram.locator('button')).toHaveCount(3)
    for (const [index, amplitudes] of [[0, [1, 0, 0, 0]], [1, [Math.SQRT1_2, Math.SQRT1_2, 0, 0]], [2, [Math.SQRT1_2, 0, 0, Math.SQRT1_2]]] as const) {
      await diagram.locator('button').nth(index).focus()
      expect(await diagram.locator('qubit-circle').evaluateAll(elements => elements.map(element => Number(element.getAttribute('data-amplitude'))))).toEqual(amplitudes)
    }
    await expect(diagram.locator('h-gate')).toHaveAttribute('data-glyph', 'regular')
    await expect(page.locator('qni-webgpu-circuit').getByRole('button', { name: '量子回路を実行' })).toBeVisible()
  })

  test(`interactive four-section field matches the original Bell decoding table at ${width}`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 })
    await page.goto('/qni-tutorial-webgpu/discriminating_bell_states/')
    for (const [index, expected] of ['区画 A / 00 / なし', '区画 B / 01 / Z', '区画 C / 10 / X', '区画 D / 11 / Y'].entries()) {
      await page.locator('.drone-field button').nth(index).click()
      await expect(page.locator('.drone-field').getByRole('status')).toHaveText(expected)
    }
  })
}
