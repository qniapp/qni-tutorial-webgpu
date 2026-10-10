import { expect, test } from '@playwright/test'

for (const width of [390, 1440]) {
  test(`CNOT four-state image replacement preserves binary labels and XOR pairs at ${width}`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 })
    await page.goto('/qni-tutorial-webgpu/cnot_gate/')
    const diagram = page.locator('.ket-pairs')
    await expect(diagram.locator('button')).toHaveCount(4)
    await expect(diagram.locator('.arcs')).toHaveCount(0)
    expect(await diagram.locator('button').evaluateAll(buttons => buttons.map(button => button.getAttribute('aria-label')))).toEqual([
      '状態 0 と 2 の演算ペア', '状態 1 と 3 の演算ペア', '状態 2 と 0 の演算ペア', '状態 3 と 1 の演算ペア',
    ])
    await diagram.locator('button').nth(1).focus()
    expect(await diagram.locator('button[aria-pressed="true"]').evaluateAll(buttons => buttons.map(button => button.getAttribute('data-index')))).toEqual(['1', '3'])
    await expect(diagram.getByRole('status')).toHaveText('状態 1 (01) / 3 (11)')
  })

}
