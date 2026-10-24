import { test } from 'node:test'
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { mkdir, mkdtemp, readFile, rm } from 'node:fs/promises'
import { createServer } from 'node:http'
import { chromium } from '@playwright/test'
import { join } from 'node:path'

// Public build-output boundary. Real pinned public assets must be generated first.
test('opt-in introduction uses the retained tutorial URLs and assets', async () => {
  await mkdir('.astro', { recursive: true })
  const output = await mkdtemp(join(process.cwd(), '.astro/migration-'))
  try {
    execFileSync('pnpm', ['run', 'build', '--outDir', output], {
      env: { ...process.env, QNI_TUTORIAL_MIGRATION: '1', QNI_H_GATE_PREBUILT: '0' },
      stdio: 'pipe',
    })
    const html = await readFile(join(output, 'index.html'), 'utf8')
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
      env: { ...process.env, QNI_TUTORIAL_MIGRATION: '0', QNI_H_GATE_PREBUILT: '0' }, stdio: 'pipe',
    })
    const ordinary = await readFile(join(output, 'index.html'), 'utf8')
    assert.match(ordinary, /href="\/qni-tutorial-webgpu\/qpu\/"/)
    assert.match(ordinary, /href="\/qni-tutorial-webgpu\/amplitude_probability\/"/)
    assert.match(ordinary, /src="\/qni-tutorial-webgpu\/_astro\//)
    assert.doesNotMatch(ordinary, /href="\/qni\//)
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
    const mime = { html: 'text/html', js: 'text/javascript', mjs: 'text/javascript', wasm: 'application/wasm', css: 'text/css', svg: 'image/svg+xml', png: 'image/png' }
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
    // Expected here: Astro alone does not contain the old tutorial.
    assert.deepEqual([...new Set(missing)], [`${origin}/qni/qpu.html`])
  } finally {
    await browser.close()
    await new Promise(resolve => server.close(resolve))
  }
}
