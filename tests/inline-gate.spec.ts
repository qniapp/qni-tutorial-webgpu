import { expect, test } from '@playwright/test'

test('bare H tags use the pinned vector and shared registration', async ({ page }) => {
  await page.goto('/qni-tutorial-webgpu/h_gate/')
  const icon = page.getByRole('img', { name: 'H ゲート', exact: true }).first()
  expect(await icon.evaluate(e => ({ tag: e.localName, pin: e.getAttribute('data-source-sha'), title: e.getAttribute('title'), svg: e.querySelectorAll('svg path').length, hiddenSvg: e.querySelector('svg')!.getAttribute('aria-hidden'), registered: !!customElements.get('h-gate') }))).toEqual({ tag: 'h-gate', pin: expect.stringMatching(/^[a-f0-9]{40}$/), title: 'H ゲート', svg: 1, hiddenSvg: 'true', registered: true })
  await page.evaluate(() => { const e = document.createElement('h-gate'); e.id = 'bare-h-test'; document.body.append(e) })
  await expect(page.locator('#bare-h-test svg')).toHaveCount(1)
})

test('figure context and non-prose sizes keep paper while bare prose becomes white', async ({ page }) => {
  await page.goto('/qni-tutorial-webgpu/h_gate/')
  await page.evaluate(() => {
    const fixture = document.createElement('div')
    fixture.id = 'h-colors-test'
    fixture.innerHTML = '<p><h-gate></h-gate><span class="qc-operation" style="font-size:24px"><h-gate></h-gate></span></p><h-gate style="font-size:32px"></h-gate>'
    document.body.append(fixture)
  })
  expect(await page.locator('#h-colors-test h-gate').evaluateAll(es => es.map(e => ({ color: getComputedStyle(e).color, size: e.getBoundingClientRect().width })))).toEqual([
    { color: 'rgb(255, 255, 255)', size: 16 },
    { color: 'rgb(255, 252, 240)', size: 24 },
    { color: 'rgb(255, 252, 240)', size: 32 },
  ])
})

test('H prose icon stays within its text line and follows the font size', async ({ page }) => {
  await page.goto('/qni-tutorial-webgpu/h_gate/')
  const icon = page.getByRole('img', { name: 'H ゲート', exact: true }).first()
  expect(await icon.evaluate(e => {
    const rect = e.getBoundingClientRect(), style = getComputedStyle(e), parent = getComputedStyle(e.parentElement!)
    return { square: rect.width === rect.height, emSized: Math.abs(rect.width - parseFloat(parent.fontSize)) < 0.1, insideLine: rect.height <= parseFloat(parent.lineHeight), alignment: style.verticalAlign, fill: style.backgroundColor, label: style.color }
  })).toEqual({ square: true, emSized: true, insideLine: true, alignment: '-2px', fill: 'rgb(58, 169, 159)', label: 'rgb(255, 255, 255)' })
})
