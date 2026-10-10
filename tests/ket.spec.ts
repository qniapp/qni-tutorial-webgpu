import { expect, test } from '@playwright/test'

for (const width of [1440, 390]) {
  test(`real MathJax typesets exactly the original 12 prose kets at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 })
    await page.goto('/qni-tutorial-webgpu/h_gate/')
    await page.waitForFunction(() => document.documentElement.dataset.mathjax === 'ready')
    await page.evaluate(() => document.fonts.ready)
    await expect(page.locator('h-gate svg')).toHaveCount(19)
    await expect(page.locator('qubit-circle svg')).toHaveCount(24)
    const kets = page.locator('mjx-container[jax="CHTML"]')
    await expect(kets).toHaveCount(12)
    expect(await kets.allTextContents()).toEqual(['|0⟩','|1⟩','|1⟩','|1⟩','|0⟩','|0⟩','|1⟩','|0⟩','|1⟩','|0⟩','|1⟩','|0⟩'])
    await expect(page.locator('mjx-assistive-mml math')).toHaveCount(12)
    await expect(page.locator('.qc-figure mjx-container, details mjx-container')).toHaveCount(0)
    expect(await kets.first().evaluate(e => ({
      size: getComputedStyle(e).fontSize,
      width: e.getBoundingClientRect().width, height: e.getBoundingClientRect().height,
      shadow: !!e.shadowRoot, registered: !!customElements.get('mjx-container'),
      marked: performance.getEntriesByName('mathjax-typeset-complete').length,
      overflow: document.documentElement.scrollWidth > innerWidth,
    }))).toMatchObject({ size: '19.12px', width: 22.296875, height: 21, shadow: false, registered: false, marked: 1, overflow: false })
    await kets.first().click({ button: 'right' })
    await expect(page.locator('.CtxtMenu_Menu').first()).toBeVisible()
  })
}

test('pages without math do not load MathJax', async ({ page }) => {
  const mathRequests: string[] = []
  page.on('request', r => { if (r.url().includes('/mathjax/')) mathRequests.push(r.url()) })
  await page.goto('/qni-tutorial-webgpu/')
  await expect(page.locator('#MathJax-script')).toHaveCount(0)
  expect(mathRequests).toEqual([])
})
