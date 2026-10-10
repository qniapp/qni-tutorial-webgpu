import { expect, test } from '@playwright/test'
import original from './fixtures/h-gate-original.json' with { type: 'json' }

for (const width of [1440, 390]) {
  test(`H original sentences, headings, authorized image credit removal and restored Orbit at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1100 })
    await page.goto('/qni-tutorial-webgpu/h_gate/')
    await page.waitForFunction(() => document.documentElement.dataset.mathjax === 'ready')
    expect(await page.locator('.content-with-margin').evaluate(e => Array.from(e.children).filter(n => ['p','h2','figure'].includes(n.localName)).map(n => ({ tag: n.localName, text: [...n.querySelectorAll<HTMLElement>('[data-original-image]')].reduce((text, diagram) => text.replace(diagram.innerText, ''), (n as HTMLElement).innerText).replace(/\s+/g, '') })))).toEqual(original[width === 1440 ? '1440' : '390'].map(item => ({ ...item, text: item.text.replace('(画像クレジット:physics.stackexchange.com)', '') })))
    await expect(page.locator('main details, noscript, .qc-figure p, .qc-figure[aria-label]')).toHaveCount(0)
    await expect(page.locator('orbit-reviewarea[color="blue"]')).toHaveCount(1)
    await expect(page.locator('orbit-prompt')).toHaveCount(7)
    await expect(page.locator('qni-webgpu-circuit').getByRole('link', { name: 'Qniで開く', exact: true })).toHaveCount(1)
    expect(await page.locator('qni-webgpu-circuit .open-link').evaluate(e => ({ color:getComputedStyle(e).color, weight:getComputedStyle(e).fontWeight, size:getComputedStyle(e).fontSize }))).toEqual({color:'rgb(255, 255, 255)',weight:'500',size:'16px'})
    expect(await page.locator('qni-webgpu-circuit .open-tab').evaluate(e => ({ color:getComputedStyle(e).backgroundColor, padding:getComputedStyle(e).padding, radius:getComputedStyle(e).borderRadius }))).toEqual({color:'rgb(14, 165, 233)',padding:'8px 16px',radius:'0px 0px 6px 6px'})
    expect(await page.locator('qni-webgpu-circuit .frame').evaluate(e => ({ color:getComputedStyle(e).borderColor, border:getComputedStyle(e).borderWidth, padding:getComputedStyle(e).padding, radius:getComputedStyle(e).borderRadius }))).toEqual({color:'rgb(14, 165, 233)',border:'2px',padding:'0px',radius:'6px 6px 6px 0px'})
  })
}
for (const path of ['', 'h_gate/', 'multi-3/']) {
  test(`no old product branding on ${path || 'index'}`, async ({ page }) => {
    await page.goto(`/qni-tutorial-webgpu/${path}`)
    expect(await page.evaluate(() => document.body.innerText.includes('Qni WebGPU'))).toBe(false)
    expect(await page.title()).not.toContain('WebGPU')
  })
}
