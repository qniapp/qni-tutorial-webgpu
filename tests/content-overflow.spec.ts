import { expect, test } from '@playwright/test'

for (const width of [390, 1440]) {
  test(`all ported pages have no inner content scrollbars at ${width}px`, async ({ page }) => {
    test.setTimeout(240_000)
    await page.setViewportSize({ width, height: 1100 })
    await page.goto('/qni-tutorial-webgpu/')
    const slugs = await page.locator('.toc-static a[data-slug]').evaluateAll(links => links.map(link => link.getAttribute('data-slug')!))
    expect(slugs.length).toBeGreaterThan(0)
    const failures: object[] = []
    for (const slug of slugs) {
      await page.goto(`/qni-tutorial-webgpu/${slug ? `${slug}/` : ''}`)
      if (await page.locator('#MathJax-script').count()) {
        await page.locator('html[data-mathjax="ready"]').waitFor({ state: 'attached' })
      }
      await page.evaluate(() => document.fonts.ready)
      await page.waitForTimeout(100)
      const scrollbars = await page.locator('.content-with-margin').evaluate(root => {
        const bad: object[] = []
        const visit = (parent: Element | ShadowRoot) => {
          for (const element of parent.children) {
            const style = getComputedStyle(element)
            const rect = element.getBoundingClientRect()
            const horizontal = element.scrollWidth > element.clientWidth && ['auto', 'scroll'].includes(style.overflowX)
            const vertical = element.scrollHeight > element.clientHeight && ['auto', 'scroll'].includes(style.overflowY)
            if (rect.width && rect.height && style.visibility !== 'hidden' && element.clientWidth && element.clientHeight && (horizontal || vertical)) {
              bad.push({ tag: element.localName, classes: element.getAttribute('class'), horizontal, vertical })
            }
            visit(element)
            if (element.shadowRoot) visit(element.shadowRoot)
          }
        }
        visit(root)
        return bad
      })
      if (scrollbars.length) failures.push({ slug, scrollbars })
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), slug).toBe(true)
    }
    expect(failures).toEqual([])
  })
}
