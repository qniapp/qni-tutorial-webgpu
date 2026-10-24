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
const title = (link: import('@playwright/test').Locator) => link.locator('.page-footer-title')

test('index links only to the next page', async ({ page }) => {
  const links = await footerLinks(page, '')
  await expect(links).toHaveCount(1)
  await expect(title(links)).toHaveText('QPU とは')
  await expect(links.locator('.page-footer-label')).toHaveText('次へ')
  await expect(links).toHaveAttribute('rel', 'next')
  await expect(links).toHaveAttribute('href', `${base}qpu/`)
  await expect(links).toHaveClass(/page-footer-next/)
})

test('qpu links to previous and next pages', async ({ page }) => {
  const links = await footerLinks(page, 'qpu/')
  await expect(links).toHaveCount(2)
  await expect(title(links.nth(0))).toHaveText('はじめに')
  await expect(links.nth(0).locator('.page-footer-label')).toHaveText('前へ')
  await expect(links.nth(0)).toHaveAttribute('href', base)
  await expect(title(links.nth(1))).toHaveText('QPU は何が得意?')
  await expect(links.nth(1)).toHaveAttribute('href', `${base}what_qpu_do_faster/`)
  await links.nth(1).click()
  await expect(page).toHaveURL(new RegExp(`${base}what_qpu_do_faster/$`))
})

test('last page links only to the previous page', async ({ page }) => {
  const links = await footerLinks(page, 'no_cloning_theorem_proof/')
  await expect(links).toHaveCount(1)
  await expect(title(links)).toHaveText('周期パターンの読み出し')
  await expect(links).toHaveAttribute('href', `${base}shor_qft/`)
  await expect(links).not.toHaveClass(/page-footer-next/)
})

for (const width of [390, 1280]) {
  test(`footer shows previous/next cards in the prose column at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    const links = await footerLinks(page, 'qpu/')
    const layout = await page.locator('.content-with-margin > footer').evaluate(footer => {
      const [prev, next] = [...footer.querySelectorAll('a')].map(a => a.getBoundingClientRect())
      const prose = footer.parentElement!.querySelector(':scope > p')!.getBoundingClientRect()
      const box = footer.getBoundingClientRect()
      return { left: box.left - prose.left, width: box.width - prose.width, sideBySide: prev.top === next.top, nextRight: Math.round(box.right - next.right) }
    })
    expect(layout).toEqual({ left: 0, width: 0, sideBySide: width > 480, nextRight: 0 })
    for (const link of await links.all()) {
      await expect(link).toHaveCSS('border-radius', '12px')
      await expect(link).toHaveCSS('background-color', 'rgb(242, 240, 229)')
      expect((await link.boundingBox())!.height).toBeGreaterThanOrEqual(72)
    }
    await expect(title(links.nth(1))).toHaveCSS('font-size', '18px')
    await links.nth(1).hover()
    await expect(links.nth(1)).toHaveCSS('border-color', 'rgb(32, 94, 166)')
  })
}

test('the index next card stays on the right on its own', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 })
  const links = await footerLinks(page, '')
  const [footer, next] = await Promise.all([page.locator('.content-with-margin > footer').boundingBox(), links.boundingBox()])
  expect(Math.round(footer!.x + footer!.width - next!.x - next!.width)).toBe(0)
  expect(next!.x).toBeGreaterThan(footer!.x + footer!.width / 2)
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
