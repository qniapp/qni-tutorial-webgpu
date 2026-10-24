import { test } from 'node:test'
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { mkdir, mkdtemp, readFile, rm } from 'node:fs/promises'
import { createServer } from 'node:http'
import { chromium } from '@playwright/test'
import { join } from 'node:path'
import { createHash } from 'node:crypto'

// Exact legacy apps/www/public/favicon.ico, also matching the tutorial's Qni mark.
const legacyIconDigest = 'f2c4bad949b0ec8860fd84b540c014d8745479889f42f67ecdd8e09b4c114ef9'

// Public build-output boundary. Real pinned public assets must be generated first.
test('opt-in introduction uses the retained tutorial URLs and assets', async () => {
  await mkdir('.astro', { recursive: true })
  const output = await mkdtemp(join(process.cwd(), '.astro/migration-'))
  try {
    execFileSync('pnpm', ['run', 'build', '--outDir', output], {
      env: { ...process.env, QNI_TUTORIAL_MIGRATION: '1', QNI_EMBED_PREBUILT: '0', QNI_H_GATE_PREBUILT: '0' },
      stdio: 'pipe',
    })
    const html = await readFile(join(output, 'index.html'), 'utf8')
    assert.match(html, /rel="icon" href="\/qni\/qni-favicon\.ico" type="image\/x-icon"/)
    assert.equal(createHash('sha256').update(await readFile(join(output, 'qni-favicon.ico'))).digest('hex'), legacyIconDigest)
    const header = html.match(/<header\b[^>]*>([\s\S]*?)<\/header>/)?.[1] ?? ''
    assert.match(header, /aria-label="Qni Tutorial ホーム"/)
    assert.match(header, /href="https:\/\/github.com\/qniapp\/qni" aria-label="GitHub で Qni を見る"/)
    assert.doesNotMatch(header, /実験版/)
    assert.match(html, /href="\/qni\/qpu\.html"/)
    assert.match(html, /class="page-footer-link page-footer-next" href="\/qni\/qpu\.html"/)
    assert.match(html, /href="\/qni\/" aria-current="page"/)
    assert.match(html, /src="\/qni\/_astro\//)
    assert.doesNotMatch(html, /\/qni-tutorial-webgpu\//)
    const unavailable = [...html.matchAll(/class="toc-item toc-unported"[^>]*data-slug="([^"]+)"/g)].map(match => match[1])
    assert.deepEqual([...new Set(unavailable)].sort(), [
      'amplitude_probability', 'basis_inner_product', 'entangled_state',
      'global_relative_phase', 'matrix_adjoint', 'tensor_product_state', 'unitary_observable',
    ])
    assert.equal(unavailable.length, 14) // Desktop sidebar and mobile drawer.
    for (const match of html.matchAll(/(?:src|href)="(\/qni\/[^"#]+)"/g)) {
      if (match[1].endsWith('.html')) continue // Parent integration supplies legacy pages.
      await readFile(join(output, match[1].slice('/qni/'.length)))
    }
    for (const file of ['qni-embed.mjs', 'qni-embed-error.mjs', 'qni-web.js', 'qni-web_bg.wasm']) {
      assert.ok((await readFile(join(output, 'qni-webgpu', file))).length > 0, file)
    }
    await checkBrowser(output)
    execFileSync('pnpm', ['run', 'build', '--outDir', output], {
      env: { ...process.env, QNI_TUTORIAL_MIGRATION: '0', QNI_EMBED_PREBUILT: '0', QNI_H_GATE_PREBUILT: '0' }, stdio: 'pipe',
    })
    const ordinary = await readFile(join(output, 'index.html'), 'utf8')
    assert.match(ordinary, /href="\/qni-tutorial-webgpu\/qpu\/"/)
    assert.match(ordinary, /href="\/qni-tutorial-webgpu\/amplitude_probability\/"/)
    assert.match(ordinary, /src="\/qni-tutorial-webgpu\/_astro\//)
    assert.doesNotMatch(ordinary, /href="\/qni\//)
    assert.match(ordinary, /rel="icon" href="\/qni-tutorial-webgpu\/favicon\.svg" type="image\/svg\+xml"/)
    assert.equal(createHash('sha256').update(await readFile(join(output, 'favicon.svg'))).digest('hex'), '16a45d2804b59caac4728c8d2cd78661bbbb25f2c39bd83a2a2962fec876fc9e')
    const ordinaryHeader = ordinary.match(/<header\b[^>]*>([\s\S]*?)<\/header>/)?.[1] ?? ''
    assert.match(ordinaryHeader, />Qni Tutorial<\/a>/)
    assert.match(ordinaryHeader, />実験版<\/span>/)
    assert.doesNotMatch(ordinaryHeader, /GitHub で Qni を見る|brand-logo/)
    assert.doesNotMatch(ordinary, /class="migration-page"|class="site-header site-header-migration"/)
  } finally {
    await rm(output, { recursive: true, force: true })
  }
})

async function checkBrowser(output) {
  // The parent integration supplies the real legacy page and tests its backlink.
  const server = createServer(async (request, response) => {
    const pathname = new URL(request.url, 'http://localhost').pathname
    if (!pathname.startsWith('/qni/') || pathname.includes('..')) {
      response.writeHead(404).end()
      return
    }
    const file = pathname.slice('/qni/'.length) || 'index.html'
    const mime = { html: 'text/html', js: 'text/javascript', mjs: 'text/javascript', wasm: 'application/wasm', css: 'text/css', svg: 'image/svg+xml', png: 'image/png', ico: 'image/x-icon' }
    try {
      const body = await readFile(join(output, file))
      response.setHeader('Content-Type', mime[file.split('.').pop()] ?? 'application/octet-stream')
      response.end(body)
    } catch { response.writeHead(404).end() }
  })
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
  const browser = await chromium.launch({ args: ['--no-sandbox', '--disable-gpu'] })
  try {
    const page = await browser.newPage()
    const origin = `http://127.0.0.1:${server.address().port}`
    const missing = []
    page.on('response', response => {
      if (response.url().startsWith(origin) && response.status() === 404) missing.push(response.url())
    })
    await mkdir('test-results/migration', { recursive: true })
    for (const width of [1280, 390]) {
      await page.setViewportSize({ width, height: 900 })
      for (const entry of ['/qni/', '/qni/index.html']) {
        await page.goto(origin + entry)
        assert.equal(await page.locator('h1').textContent(), 'はじめに')
        assert.equal(await page.locator('.page-footer-next').getAttribute('href'), '/qni/qpu.html')
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true)
      }
      const home = page.getByRole('link', { name: 'Qni Tutorial ホーム', exact: true })
      const github = page.getByRole('link', { name: 'GitHub で Qni を見る', exact: true })
      assert.equal(await home.getAttribute('href'), '/qni/')
      assert.equal(await github.getAttribute('href'), 'https://github.com/qniapp/qni')
      assert.equal(await home.locator('img').count(), 0)
      assert.equal(await home.locator('.brand-qni').textContent(), 'Qni')
      assert.equal(await home.locator('.brand-tutorial').textContent(), 'Tutorial')
      assert.equal(await home.locator('.brand-qni').evaluate(el => getComputedStyle(el).color), 'rgb(24, 24, 27)')
      assert.equal(await home.locator('.brand-tutorial').evaluate(el => getComputedStyle(el).color), 'rgb(56, 189, 248)')
      for (const link of [home, github]) {
        await link.focus()
        assert.equal(await link.evaluate(el => getComputedStyle(el).outlineStyle), 'solid')
      }
      assert.equal(await home.evaluate(el => {
        const range = document.createRange()
        range.selectNodeContents(el)
        const selection = getSelection()
        selection.removeAllRanges()
        selection.addRange(range)
        const text = selection.toString()
        selection.removeAllRanges()
        return text.includes('Qni') && text.toLowerCase().includes('tutorial')
      }), true)
      await github.evaluate(el => el.blur())
      await page.screenshot({ path: `test-results/migration/header-${width}.png` })
      await page.evaluate(() => scrollTo(0, 1200))
      const header = page.locator('.site-header')
      const headerBox = await header.boundingBox()
      assert.ok(headerBox && headerBox.y >= 0 && headerBox.y + headerBox.height < 900)
      assert.ok(await page.evaluate(() => scrollY) >= 1000)
      for (const link of [home, github]) {
        assert.equal(await link.evaluate(el => {
          const box = el.getBoundingClientRect()
          return el.contains(document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2))
        }), true)
      }
      await page.screenshot({ path: `test-results/migration/scrolled-header-${width}.png` })
      if (width === 390) {
        await page.getByRole('button', { name: '目次を開く', exact: true }).click()
        assert.equal(await page.getByRole('dialog', { name: '目次', exact: true }).isVisible(), true)
        await page.screenshot({ path: 'test-results/migration/scrolled-drawer-390.png' })
        await page.getByRole('button', { name: '目次を閉じる', exact: true }).click()
        assert.equal(await page.getByRole('dialog', { name: '目次', exact: true }).isVisible(), false)
      }
      // Browser scrolling to a prose target must leave it below the sticky bar.
      const paragraph = page.locator('main .content-with-margin > p').nth(5)
      await paragraph.evaluate(el => el.scrollIntoView({ block: 'start' }))
      const paragraphBox = await paragraph.boundingBox()
      assert.ok(paragraphBox && paragraphBox.y >= headerBox.y + headerBox.height)
      await home.click()
      assert.equal(new URL(page.url()).pathname, '/qni/')
      assert.equal(await page.evaluate(() => scrollY), 0)
      const titleBox = await page.locator('h1').boundingBox()
      assert.ok(titleBox && titleBox.y > headerBox.y + headerBox.height)
      if (width === 390) await page.getByRole('button', { name: '目次を開く', exact: true }).click()
      const nav = page.locator(width === 390 ? '.toc-drawer nav' : '.sidebar nav')
      await nav.locator('details').nth(1).locator('summary').click()
      assert.equal(await nav.locator('.toc-unported').count(), 7)
      assert.equal(await nav.locator('a[data-slug="amplitude_probability"]').count(), 0)
      await page.screenshot({ path: `test-results/migration/sidebar-${width}.png` })
      if (width === 390) await page.getByRole('button', { name: '目次を閉じる', exact: true }).click()
      await page.locator('.page-footer-next').click()
      assert.equal(page.url(), `${origin}/qni/qpu.html`)
      await page.goBack()
      assert.equal(await page.locator('h1').textContent(), 'はじめに')
    }
    const iconHref = await page.locator('link[rel="icon"]').getAttribute('href')
    assert.equal(iconHref, '/qni/qni-favicon.ico')
    const iconResponse = await page.request.get(origin + iconHref)
    assert.equal(iconResponse.status(), 200)
    assert.equal(iconResponse.headers()['content-type'], 'image/x-icon')
    assert.equal(createHash('sha256').update(await iconResponse.body()).digest('hex'), legacyIconDigest)
    // Headless page screenshots exclude tab chrome; record the browser-rendered
    // exact icon response instead of claiming to have photographed a tab.
    await page.goto(origin + iconHref)
    await page.locator('img').screenshot({ path: 'test-results/migration/qni-favicon.png' })
    // Expected here: Astro alone does not contain the old tutorial.
    assert.deepEqual([...new Set(missing)], [`${origin}/qni/qpu.html`])
  } finally {
    await browser.close()
    await new Promise(resolve => server.close(resolve))
  }
}
