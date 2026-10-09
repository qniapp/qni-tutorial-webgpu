import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.goto('/qni-tutorial-webgpu/stress-qubit-circle/?n=200')
  await page.waitForFunction(() => document.documentElement.dataset.qcReady === '200')
})

test('small light DOM circles use Rust geometry and one shared tooltip', async ({ page }) => {
  const circle = page.locator('qw-qubit-circle').nth(1)
  await circle.evaluate(e => { e.removeAttribute('data-amplitude-real'); e.removeAttribute('data-amplitude-imag'); e.setAttribute('data-amplitude', '0.6+0.8i') })
  const shape = await circle.evaluate(e => ({
    shadow: !!e.shadowRoot, nodes: e.querySelectorAll('svg, svg > *').length,
    radius: e.querySelector('[data-part=disc]')!.getAttribute('r'), outline: e.querySelector('[data-part=outline]')!.getAttribute('r'),
    phaseX: Number(e.querySelector('[data-part=phase]')!.getAttribute('x2')), phaseY: Number(e.querySelector('[data-part=phase]')!.getAttribute('y2')),
    label: e.getAttribute('aria-label'), role: e.getAttribute('role'),
  }))
  expect(shape).toMatchObject({ shadow: false, nodes: 5, radius: '15', outline: '16', role: 'img' })
  expect(shape.phaseX).toBeCloseTo(5)
  expect(shape.phaseY).toBeCloseTo(8)
  expect(shape.label).toContain('振幅 +0.60000 +0.80000i')
  await circle.hover()
  await expect(page.getByRole('tooltip')).toHaveText('振幅: +0.60000 +0.80000i\n確率: +100.0000%\n位相: +53.13°')
  await page.locator('qw-qubit-circle').nth(2).hover()
  expect(await page.locator('#qw-qubit-circle-tooltip').count()).toBe(1)
})

test('legacy complex strings, exponent notation, split inputs and malformed inputs react', async ({ page }) => {
  const circle = page.locator('qw-qubit-circle').first()
  for (const [amplitude, expected] of [['1e-1-2e-1i', '+0.10000 -0.20000i'], ['i', '+0.00000 +1.00000i'], ['1-i', '+1.00000 -1.00000i'], ['-0.7071067811865476', '-0.70711 +0.00000i']]) {
    await circle.evaluate((e, value) => { e.removeAttribute('data-amplitude-real'); e.removeAttribute('data-amplitude-imag'); e.setAttribute('data-amplitude', value!) }, amplitude)
    await expect(circle).toHaveAttribute('aria-label', new RegExp(expected!.replace(/[+.*]/g, '\\$&')))
  }
  await circle.evaluate(e => { e.setAttribute('data-amplitude-real', '0'); e.setAttribute('data-amplitude-imag', '-1') })
  await expect(circle).toHaveAttribute('aria-label', /-90.00°/)
  await circle.evaluate(e => e.setAttribute('data-amplitude-imag', 'NaN'))
  await expect(circle).toHaveAttribute('data-invalid', '')
  await expect(circle).toHaveAttribute('aria-label', '振幅が不正です')
  await circle.evaluate(e => e.setAttribute('data-amplitude-imag', '0'))
  await expect(circle).not.toHaveAttribute('data-invalid', '')
  await expect(circle.locator('[data-part=phase]')).toBeHidden()
})

test('keyboard focus, row flags, mutation and Escape work with the shared popup', async ({ page }) => {
  const circle = page.locator('qw-qubit-circle').nth(1)
  await circle.evaluate(e => e.setAttribute('data-show-popup-phase', ''))
  await circle.focus()
  await expect(page.getByRole('tooltip')).toHaveText(/位相:/)
  await expect(page.getByRole('tooltip')).not.toContainText('振幅:')
  await circle.evaluate(e => { e.setAttribute('data-amplitude-real', '-1'); e.setAttribute('data-amplitude-imag', '0') })
  await expect(page.getByRole('tooltip')).toHaveText('位相: +180.00°')
  await page.evaluate(() => window.scrollTo(0, 50))
  await expect(page.getByRole('tooltip')).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('tooltip')).toBeHidden()
})

test('H prose faithfully restores all 24 original amplitude values', async ({ page }) => {
  await page.goto('/qni-tutorial-webgpu/h_gate/')
  await expect(page.locator('qw-qubit-circle')).toHaveCount(24)
  const values = await page.locator('qw-qubit-circle').evaluateAll(es => es.map(e => e.getAttribute('data-amplitude')))
  expect(values.slice(0, 8)).toEqual(['1','0',String(Math.SQRT1_2),String(Math.SQRT1_2),'0','1',String(Math.SQRT1_2),String(-Math.SQRT1_2)])
  expect(values.slice(-4)).toEqual(['-0.38268','0.7855 - 0.48636i','0.28483 - 0.34391i','-0.82603 + 0.34391i'])
})
