import { expect, test } from '@playwright/test'

const base = '/qni-tutorial-webgpu/'

async function footerLinks(page: import('@playwright/test').Page, path: string) {
  await page.goto(`${base}${path}`)
  const footer = page.locator('.content-with-margin > footer')
  await expect(footer).toHaveCount(1)
  await expect(page.locator('footer')).toHaveCount(1)
  await expect(footer).not.toContainText('ページ一覧')
  await expect(footer).not.toContainText('WebGPU 対応ブラウザ')
  return footer.locator('a')
}

test('index links only to the next page', async ({ page }) => {
  const links = await footerLinks(page, '')
  await expect(links).toHaveCount(1)
  await expect(links).toHaveText('QPU とは')
  await expect(links).toHaveAttribute('href', `${base}qpu/`)
  await expect(links).toHaveClass(/page-footer-next/)
})

test('qpu links to previous and next pages', async ({ page }) => {
  const links = await footerLinks(page, 'qpu/')
  await expect(links).toHaveCount(2)
  await expect(links.nth(0)).toHaveText('はじめに')
  await expect(links.nth(0)).toHaveAttribute('href', base)
  await expect(links.nth(1)).toHaveText('QPU は何が得意?')
  await expect(links.nth(1)).toHaveAttribute('href', `${base}what_qpu_do_faster/`)
  await links.nth(1).click()
  await expect(page).toHaveURL(new RegExp(`${base}what_qpu_do_faster/$`))
})

test('last page links only to the previous page', async ({ page }) => {
  const links = await footerLinks(page, 'no_cloning_theorem_proof/')
  await expect(links).toHaveCount(1)
  await expect(links).toHaveText('周期パターンの読み出し')
  await expect(links).toHaveAttribute('href', `${base}shor_qft/`)
  await expect(links).not.toHaveClass(/page-footer-next/)
})

test('footer reproduces the original Tailwind styles', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 })
  const links = await footerLinks(page, 'qpu/')
  const footer = page.locator('.content-with-margin > footer')
  const style = await footer.evaluate(footer => {
    const div = footer.querySelector('div')!, [prev, next] = footer.querySelectorAll('a')
    const css = (e: Element) => getComputedStyle(e)
    const content = footer.parentElement!.getBoundingClientRect().width
    return {
      footer: [css(footer).marginTop, css(footer).fontSize, css(footer).lineHeight, Math.round(footer.getBoundingClientRect().width / content * 1000)],
      div: [css(div).marginBottom, css(div).display, css(div).alignItems, css(div).fontWeight, css(div).color],
      link: [css(prev).display, css(prev).color, css(prev).textDecorationLine, css(next).marginLeft !== '0px'],
      chevron: [prev.querySelector('svg')!.getAttribute('viewBox'), css(prev.querySelector('svg')!).marginRight, css(next.querySelector('svg')!).marginLeft, css(prev.querySelector('svg')!).height, css(prev.querySelector('svg')!).color, css(prev.querySelector('svg')!).overflow],
      nextRight: Math.round(footer.getBoundingClientRect().right - next.getBoundingClientRect().right),
    }
  })
  expect(style).toEqual({
    footer: ['48px', '14px', '24px', 583],
    div: ['40px', 'flex', 'center', '600', 'rgb(51, 65, 85)'],
    link: ['flex', 'rgb(51, 65, 85)', 'none', true],
    chevron: ['0 0 15 15', '12px', '12px', '16px', 'rgb(148, 163, 184)', 'visible'],
    nextRight: 0,
  })
  await links.nth(1).hover()
  await expect(links.nth(1)).toHaveCSS('color', 'rgb(15, 23, 42)')
  await expect(links.nth(1).locator('svg')).toHaveCSS('color', 'rgb(71, 85, 105)')
})

test('MathJax titles render in the footer', async ({ page }) => {
  const links = await footerLinks(page, 'shor_r/')
  await page.waitForFunction(() => document.documentElement.dataset.mathjax === 'ready')
  await expect(links.nth(0)).toHaveAttribute('href', `${base}shor_fx/`)
  await expect(links.nth(1)).toHaveAttribute('href', `${base}shor_u/`)
  for (const link of await links.all()) {
    await expect(link.locator('mjx-container')).toHaveCount(1)
    await expect(link).not.toContainText('\\(')
  }
  expect(await page.locator('footer mjx-merror').count()).toBe(0)
})
