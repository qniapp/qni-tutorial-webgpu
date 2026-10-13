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
    // MathJax scales kets to match the surrounding font's x-height, so absolute
    // px depend on the host's system-ui font (19.12px / 19.424px / 18.4px seen).
    // Check sizes relative to the paragraph text instead.
    const metrics = await kets.first().evaluate(e => {
      const p = e.closest('p')!
      const size = parseFloat(getComputedStyle(e).fontSize), text = parseFloat(getComputedStyle(p).fontSize)
      const rect = e.getBoundingClientRect()
      return {
        sizeRatio: size / text, widthRatio: rect.width / size,
        height: rect.height, lineHeight: parseFloat(getComputedStyle(p).lineHeight),
        shadow: !!e.shadowRoot, registered: !!customElements.get('mjx-container'),
        marked: performance.getEntriesByName('mathjax-typeset-complete').length,
        overflow: document.documentElement.scrollWidth > innerWidth,
      }
    })
    expect(metrics.sizeRatio).toBeGreaterThanOrEqual(1.12)
    expect(metrics.sizeRatio).toBeLessThanOrEqual(1.24)
    expect(metrics.widthRatio).toBeCloseTo(1.166, 1)
    expect(metrics.height).toBeLessThanOrEqual(metrics.lineHeight)
    expect(metrics).toMatchObject({ shadow: false, registered: false, marked: 1, overflow: false })
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
