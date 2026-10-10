import { expect, test } from '@playwright/test'
for (const width of [1440,390]) {
  test(`pair colors, XOR partners and accessible selection at ${width}px`, async ({ page }) => {
    await page.setViewportSize({width,height:1000})
    await page.goto('/qni-tutorial-webgpu/operator_pair/')
    await page.waitForFunction(()=>document.documentElement.dataset.mathjax==='ready')
    await expect(page.locator('.ket-pairs')).toHaveCount(4)
    await expect(page.locator('main img')).toHaveCount(0)
    for (const bit of [1,2,3]) {
      const diagram=page.locator(`.ket-pairs[data-bit="${bit}"][data-labels-only="false"]`)
      await expect(diagram.locator('button')).toHaveCount(8)
      await diagram.locator('button[data-index="3"]').click()
      expect(await diagram.locator('button[aria-pressed="true"]').evaluateAll(es=>es.map(e=>Number((e as HTMLElement).dataset.index)).sort())).toEqual([3,3^(2**(bit-1))].sort())
      await diagram.locator('button[data-index="0"]').focus()
      await page.keyboard.press('Enter')
      await expect(diagram.getByRole('status')).toContainText('000')
      expect(await diagram.locator('button[aria-pressed="true"]').count()).toBe(2)
    }
    expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(width)
    expect(await page.locator('mjx-merror').count()).toBe(0)
  })
  test(`X swap images replaced by three interactive pair diagrams at ${width}px`, async ({ page }) => {
    await page.setViewportSize({width,height:1000})
    await page.goto('/qni-tutorial-webgpu/multi_qubit_operation/')
    await page.waitForFunction(()=>document.documentElement.dataset.mathjax==='ready')
    await expect(page.locator('.ket-pairs')).toHaveCount(3)
    await expect(page.locator('.ket-pairs .arcs')).toHaveCount(3)
    await expect(page.locator('main img')).toHaveCount(0)
    for (const bit of [1,2,3]) {
      const diagram=page.locator(`.ket-pairs[data-bit="${bit}"]`)
      await diagram.locator('button[data-index="0"]').click()
      expect(await diagram.locator('button[aria-pressed="true"]').count()).toBe(2)
    }
  })
}
