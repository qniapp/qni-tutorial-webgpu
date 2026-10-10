import { expect, test } from '@playwright/test'
import original from './fixtures/original-navigation.json' with { type: 'json' }

const ported = new Set(['', 'h_gate', 'qpu', 'what_qpu_do_faster', 'quantum_circuit', 'qni_intro', 'p_bit', 'superposition', 'qubit', 'phase'])

test('sidebar has the original chapters and page order', async ({ page }) => {
  await page.goto('/qni-tutorial-webgpu/h_gate/')
  const nav = page.locator('.sidebar nav')
  await expect(nav).toHaveAttribute('aria-label', '目次')
  const actual = await nav.locator('details').evaluateAll(chapters => chapters.map(chapter => ({
    title: chapter.querySelector('summary')!.textContent!.trim(),
    pages: [...chapter.querySelectorAll('[data-slug]')].map(item => ({ title: item.getAttribute('data-original-title'), slug: item.getAttribute('data-slug') })),
  })))
  expect(actual).toEqual(original.chapters.map(chapter => ({ title: chapter.title, pages: chapter.pages.map(({ title, slug }) => ({ title, slug })) })))
  expect(actual).toHaveLength(15)
  expect(actual.flatMap(chapter => chapter.pages)).toHaveLength(68)
})

test('current page is highlighted and only its chapter is open', async ({ page }) => {
  await page.goto('/qni-tutorial-webgpu/h_gate/')
  const current = page.locator('.sidebar [aria-current="page"]')
  await expect(current).toHaveCount(1)
  await expect(current).toHaveText('H ゲート')
  await expect(current).toHaveAttribute('href', '/qni-tutorial-webgpu/h_gate/')
  expect(await page.locator('.sidebar details[open] > summary').allTextContents()).toEqual(['QPU 命令その 1'])
  expect(await current.evaluate(e => getComputedStyle(e).backgroundColor)).toBe('rgb(221, 231, 241)')
  // Original space-y-1 rhythm: 36px rows, 40px pitch.
  const rows = await page.locator('.sidebar details[open] .toc-item').evaluateAll(es => es.map(e => e.getBoundingClientRect()).map(r => ({ top: r.top, height: r.height })))
  expect(rows.every(r => r.height === 36)).toBe(true)
  expect(rows.slice(1).map((r, i) => r.top - rows[i].top)).toEqual(Array(rows.length - 1).fill(40))

  await page.goto('/qni-tutorial-webgpu/')
  await expect(page.locator('.sidebar [aria-current="page"]')).toHaveText('はじめに')
})

test('unported pages are greyed out, inert and marked 未移植', async ({ page }) => {
  await page.goto('/qni-tutorial-webgpu/h_gate/')
  const items = page.locator('.sidebar [data-slug]')
  const all = await items.evaluateAll(es => es.map(e => ({ slug: e.getAttribute('data-slug')!, link: e.localName === 'a', badge: e.querySelector('.toc-badge')?.textContent ?? null, color: getComputedStyle(e).color })))
  for (const item of all) {
    if (ported.has(item.slug)) expect(item).toMatchObject({ link: true, badge: null })
    else expect(item).toMatchObject({ link: false, badge: '未移植', color: 'rgb(183, 181, 172)' })
  }
  expect(all.filter(item => item.link)).toHaveLength(ported.size)
  // Not focusable: tabbing never lands on an unported entry.
  expect(await page.locator('.sidebar .toc-unported').evaluateAll(es => es.every(e => e.tabIndex < 0))).toBe(true)
  // MathJax titles use a plain label instead of raw TeX.
  await expect(page.locator('.sidebar [data-slug="shor_fx"] .toc-label')).toHaveText('aˣ mod(N) の計算')
})

test('narrow screens open and close the drawer without layout shift', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/qni-tutorial-webgpu/h_gate/')
  await expect(page.locator('.sidebar')).toBeHidden()
  const button = page.getByRole('button', { name: '目次を開く' })
  await expect(button).toHaveAttribute('aria-expanded', 'false')
  const before = await page.locator('main').boundingBox()

  await button.click()
  const drawer = page.getByRole('dialog', { name: '目次' })
  await expect(drawer).toBeVisible()
  await expect(button).toHaveAttribute('aria-expanded', 'true')
  await expect(drawer.locator('[aria-current="page"]')).toHaveText('H ゲート')
  await expect(drawer.getByRole('button', { name: '目次を閉じる' })).toBeFocused()
  expect(await page.locator('main').boundingBox()).toEqual(before)
  await page.keyboard.press('Escape')
  await expect(drawer).toBeHidden()
  await expect(button).toHaveAttribute('aria-expanded', 'false')
  await expect(button).toBeFocused()

  await button.click()
  await page.mouse.click(380, 400)
  await expect(drawer).toBeHidden()

  await button.click()
  await drawer.getByRole('button', { name: '目次を閉じる' }).click()
  await expect(drawer).toBeHidden()
})

test('wide screens show a sticky sidebar and no menu button', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/qni-tutorial-webgpu/h_gate/')
  await expect(page.getByRole('button', { name: '目次を開く' })).toBeHidden()
  const box = await page.locator('.sidebar').boundingBox()
  expect(box).toMatchObject({ x: 0, y: 0, width: 256, height: 900 })
  await page.mouse.wheel(0, 2000)
  await expect.poll(() => page.locator('.sidebar').evaluate(e => e.getBoundingClientRect().top)).toBe(0)
  await expect(page.locator('.site-header span')).toHaveText('実験版')
})
