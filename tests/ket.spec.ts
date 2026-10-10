import { expect, test } from '@playwright/test'

for (const width of [1440, 390]) {
  test(`bare original tags and exactly the original 12 prose kets at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 })
    await page.goto('/qni-tutorial-webgpu/h_gate/')
    await page.evaluate(() => document.fonts.ready)
    await expect(page.locator('h-gate svg')).toHaveCount(19)
    await expect(page.locator('qubit-circle svg')).toHaveCount(24)
    const kets = page.locator('mjx-container[jax="CHTML"]')
    await expect(kets).toHaveCount(12)
    expect(await kets.first().evaluate(e => e.getBoundingClientRect().height)).toBeCloseTo(21.12, 0)
    expect(await kets.allTextContents()).toEqual(['|0⟩','|1⟩','|1⟩','|1⟩','|0⟩','|0⟩','|1⟩','|0⟩','|1⟩','|0⟩','|1⟩','|0⟩'])
    await expect(page.locator('.qc-figure mjx-container, details mjx-container')).toHaveCount(0)
    expect(await kets.first().evaluate(e => ({
      font: getComputedStyle(e).fontFamily,
      size: getComputedStyle(e).fontSize,
      role: e.getAttribute('role'), label: e.getAttribute('aria-label'),
      shadow: !!e.shadowRoot, registered: !!customElements.get('mjx-container'),
      mathjax: 'MathJax' in window, overflow: document.documentElement.scrollWidth > innerWidth,
    }))).toMatchObject({ font: 'TutorialMathJaxMain, serif', size: '19.12px', role: 'math', label: 'ケット 0', shadow: false, registered: false, mathjax: false, overflow: false })
  })
}
