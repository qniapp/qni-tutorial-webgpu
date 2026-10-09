import { expect, test } from '@playwright/test'

const pagePath = '/qni-tutorial-webgpu/h_gate/'

test('wide notes occupy the right margin and share the superscript counter', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 })
  await page.goto(pagePath)
  await expect(page.locator('aside.note')).toHaveCount(0)
  await expect(page.locator('.margin-note')).toHaveCount(4)
  const note = page.locator('#margin-note-h-gate + .margin-note')
  await expect(note).toBeVisible()
  const geometry = await note.evaluate(el => {
    const noteRect = el.getBoundingClientRect()
    const paragraph = el.parentElement!.getBoundingClientRect()
    const label = el.previousElementSibling!.previousElementSibling!
    return {
      noteLeft: noteRect.left, paragraphRight: paragraph.right,
      fontSize: getComputedStyle(el).fontSize,
      lineHeight: getComputedStyle(el).lineHeight,
      noteCounter: getComputedStyle(el, '::before').content,
      labelCounter: getComputedStyle(label, '::after').content,
      counterIncrement: getComputedStyle(label).counterIncrement,
    }
  })
  expect(geometry.noteLeft).toBeCloseTo(geometry.paragraphRight, 0)
  expect(geometry.fontSize).toBe('14px')
  expect(geometry.lineHeight).toBe('20px')
  expect(geometry.noteCounter).toBe('counter(margin-note-counter)')
  expect(geometry.labelCounter).toBe(geometry.noteCounter)
  expect(geometry.counterIncrement).toBe('margin-note-counter 1')
})

for (const width of [390, 639, 640, 767, 768]) {
  test(`notes at ${width}px fit the viewport and toggle on narrow screens without JS`, async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width, height: 900 }, javaScriptEnabled: false })
    const page = await context.newPage()
    await page.goto(pagePath)
    for (const id of ['h-gate', 'circuit-help', 'h-gate-rotation', 'related-pages']) {
      const note = page.locator(`#margin-note-${id} + .margin-note`)
      const toggle = page.locator(`label[for="margin-note-${id}"]`)
      if (width < 640) {
        await expect(note).toBeHidden()
        await toggle.click()
        await expect(note).toBeVisible()
        await expect(page.locator(`#margin-note-${id}`)).toBeChecked()
      } else {
        await expect(note).toBeVisible()
      }
      const bounds = await note.boundingBox()
      expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(width)
      if (width < 640) {
        await toggle.click()
        await expect(note).toBeHidden()
      }
    }
    await context.close()
  })
}

test('index uses an unnumbered reusable note', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 900 })
  await page.goto('/qni-tutorial-webgpu/')
  await expect(page.locator('aside.note')).toHaveCount(0)
  await expect(page.locator('.margin-note')).toBeHidden()
  await page.locator('label[for="margin-note-webgpu-support"]').click()
  await expect(page.locator('.margin-note')).toBeVisible()
})
