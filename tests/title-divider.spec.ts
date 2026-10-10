import { expect, test } from '@playwright/test'
for (const width of [1440, 390]) {
  test(`shared title divider uses original border and vertical spacing at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 })
    await page.goto('/qni-tutorial-webgpu/h_gate/')
    await page.waitForFunction(() => document.documentElement.dataset.mathjax === 'ready')
    const actual = await page.locator('.page-title-block').evaluate(e => {
      const s = getComputedStyle(e), r = e.getBoundingClientRect(), h = e.querySelector('h1')!.getBoundingClientRect(), p = document.querySelector('.content-with-margin > p')!.getBoundingClientRect()
      return { topColor:s.borderTopColor, topWidth:s.borderTopWidth, topStyle:s.borderTopStyle, bottomColor:s.borderBottomColor, bottomWidth:s.borderBottomWidth, bottomStyle:s.borderBottomStyle, marginTop:s.marginTop, marginBottom:s.marginBottom, paddingBottom:s.paddingBottom, h1ToLine:r.bottom-1-h.bottom, lineToParagraph:p.top-r.bottom+1, fullWidth:r.width===document.querySelector('.content-with-margin')!.getBoundingClientRect().width }
    })
    expect(actual).toEqual({ topColor:'rgb(228, 228, 231)', topWidth:'0px', topStyle:'solid', bottomColor:'rgb(228, 228, 231)', bottomWidth:'1px', bottomStyle:'solid', marginTop:'0px', marginBottom:'40px', paddingBottom:'40px', h1ToLine:73, lineToParagraph:41, fullWidth:true })
    await expect(page.locator('.site-header span')).toHaveText('実験版')
    await expect(page.locator('body > footer p')).toContainText('WebGPU 対応ブラウザ')
  })
}
test('index also gets the shared divider', async ({ page }) => {
  await page.goto('/qni-tutorial-webgpu/')
  await expect(page.locator('.page-title-block')).toHaveCount(1)
})
