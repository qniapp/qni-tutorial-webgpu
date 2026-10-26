import { expect, test } from '@playwright/test'

test('Introduction quiz has a plain heading and body instructions', async ({ page }) => {
  await page.route('https://js.withorbit.com/**', route => route.abort())
  await page.goto('/qni-tutorial-webgpu/')
  const review = page.locator('orbit-reviewarea')
  await expect(page.getByRole('heading', { name: 'クイズ', exact: true })).toBeVisible()
  await expect(review.locator('xpath=following-sibling::p[1]')).toHaveText(
    'Show Answer で答えを表示し、思い出せたら Remembered、忘れていたら Forgotten を選びます。',
  )
  await expect(review.locator('xpath=following-sibling::p[2]')).toHaveText('Skip で次の問題へ進みます。')
  const style = await review.evaluate(el => ({
    border: getComputedStyle(el).borderTopWidth,
    background: getComputedStyle(el).backgroundColor,
    before: getComputedStyle(el, '::before').content,
    after: getComputedStyle(el, '::after').content,
  }))
  expect(style).toEqual({ border: '0px', background: 'rgba(0, 0, 0, 0)', before: 'none', after: 'none' })
  await expect(review.locator('orbit-prompt')).toHaveCount(9)
  await page.goto('/qni-tutorial-webgpu/qpu/')
  expect(await page.locator('orbit-reviewarea').evaluate(el => getComputedStyle(el, '::after').content))
    .not.toContain('Orbit の画面は英語のみ')
})

for (const width of [390, 639, 640, 767, 768, 1280, 1920]) {
  test(`Orbit review matches the prose column at ${width}px`, async ({ page }) => {
    const proseLeft = width >= 768
      ? 256 + Math.max(0, (width - 256 - 1120) / 2) + 24
      : width <= 640 ? 16 : 24
    // The host owns the column width, even when the third-party embed is offline.
    await page.route('https://js.withorbit.com/**', route => route.abort())
    await page.setViewportSize({ width, height: 900 })
    for (const slug of ['h_gate', 'superposition', 'cpu_vs_qpu_operations']) {
      await page.goto(`/qni-tutorial-webgpu/${slug}/`)
      const prose = await page.locator('.content-with-margin > p').last().boundingBox()
      const review = await page.locator('orbit-reviewarea').boundingBox()
      expect(prose, slug).not.toBeNull()
      expect(review, slug).not.toBeNull()
      expect(prose!.width, slug).toBeGreaterThan(0)
      expect(review!.x, slug).toBeCloseTo(prose!.x, 1)
      expect(review!.width, slug).toBeCloseTo(prose!.width, 1)
      expect(prose!.x, slug).toBe(proseLeft)
    }
    // Keep the independently sized figures left-aligned with that same column.
    await page.goto('/qni-tutorial-webgpu/h_gate/')
    const figure = await page.locator('.content-with-margin > figure').first().boundingBox()
    expect(figure).not.toBeNull()
    expect(figure!.x).toBe(proseLeft)
  })
}
