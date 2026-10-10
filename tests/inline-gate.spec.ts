import { expect, test } from '@playwright/test'

test('H prose icon is accessible, pinned and vector-only with no legacy registration', async ({ page }) => {
  await page.goto('/qni-tutorial-webgpu/h_gate/')
  const icon = page.getByRole('img', { name: 'H ゲート', exact: true }).first()
  expect(await icon.evaluate(e => ({
    tag: e.localName, pin: e.getAttribute('data-source-sha'),
    title: e.getAttribute('title'), svg: e.querySelectorAll('svg path').length,
    hiddenSvg: e.querySelector('svg')!.getAttribute('aria-hidden'),
    registered: !!customElements.get('qw-h-gate'), legacy: document.querySelectorAll('h-gate').length,
  }))).toEqual({ tag: 'qw-h-gate', pin: expect.stringMatching(/^[a-f0-9]{40}$/), title: 'H ゲート', svg: 1, hiddenSvg: 'true', registered: false, legacy: 0 })
})

test('H prose icon stays within its text line and follows the font size', async ({ page }) => {
  await page.goto('/qni-tutorial-webgpu/h_gate/')
  const icon = page.getByRole('img', { name: 'H ゲート', exact: true }).first()
  expect(await icon.evaluate(e => {
    const rect = e.getBoundingClientRect(), style = getComputedStyle(e), parent = getComputedStyle(e.parentElement!)
    return { square: rect.width === rect.height, emSized: Math.abs(rect.width - parseFloat(parent.fontSize)) < 0.1,
      insideLine: rect.height <= parseFloat(parent.lineHeight), alignment: style.verticalAlign,
      fill: style.backgroundColor, label: style.color }
  })).toEqual({ square: true, emSized: true, insideLine: true, alignment: '-2px', fill: 'rgb(58, 169, 159)', label: 'rgb(255, 252, 240)' })
})
