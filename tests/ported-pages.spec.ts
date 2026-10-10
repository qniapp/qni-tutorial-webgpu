import { expect, test } from '@playwright/test'
import qpu from './fixtures/qpu-original.json' with { type: 'json' }
import faster from './fixtures/what_qpu_do_faster-original.json' with { type: 'json' }
import pbit from './fixtures/p_bit-original.json' with { type: 'json' }
import superposition from './fixtures/superposition-original.json' with { type: 'json' }
import qubit from './fixtures/qubit-original.json' with { type: 'json' }
import phase from './fixtures/phase-original.json' with { type: 'json' }
for (const fixture of [qpu, faster, pbit, superposition, qubit, phase]) for (const width of [1440, 390]) {
  test(`${fixture.slug} preserves original structure at ${width}px`, async ({ page }) => {
    await page.setViewportSize({width,height:1000})
    await page.goto(`/qni-tutorial-webgpu/${fixture.slug}/`)
    if (['what_qpu_do_faster','superposition','qubit','phase','circle_notation'].includes(fixture.slug)) await page.waitForFunction(() => document.documentElement.dataset.mathjax === 'ready')
    await expect(page.locator('main h1')).toHaveText(fixture.title)
    await expect(page.locator('.lede')).toHaveText(fixture.description)
    await expect(page.locator('main .margin-note')).toHaveCount(fixture.sidenotes.length)
    for (const id of fixture.sidenotes) await expect(page.locator(`#margin-note-${id}`)).toHaveCount(1)
    await expect(page.locator('main img')).toHaveCount(fixture.images.length)
    for (const image of fixture.images) await expect(page.locator(`main img[src="/qni-tutorial-webgpu/${image}"]`)).toHaveCount(1)
    await expect(page.locator('main orbit-prompt')).toHaveCount(fixture.orbitPrompts)
    const prompts = await page.locator('main orbit-prompt').evaluateAll(es => es.map(e => Object.fromEntries([...e.attributes].filter(a => !a.name.startsWith('data-astro-')).map(a => [a.name, a.value.replace(/\s+/g, '')]))))
    expect(prompts).toEqual(fixture.orbit.map(p => Object.fromEntries(Object.entries(p).map(([k,v]) => [k,v.replace(/\s+/g, '')]))))
    await expect(page.locator('main qni-webgpu-circuit')).toHaveCount('circuits' in fixture ? fixture.circuits.length : 0)
    if ('circuits' in fixture) expect(await page.locator('main qni-webgpu-circuit').evaluateAll(es => es.map(e => JSON.parse(e.getAttribute('circuit')!)))).toEqual(fixture.circuits)
    if ('amplitudes' in fixture) expect(await page.locator('main qubit-circle').evaluateAll(es => es.map(e => ({amplitude:e.getAttribute('data-amplitude'),ket:e.getAttribute('data-ket'),size:e.getAttribute('data-size')})))).toEqual(fixture.amplitudes)
    expect(await page.locator('main mjx-merror').count()).toBe(0)
    await expect(page.locator('.toc-static [aria-current="page"]')).toHaveAttribute('href', `/qni-tutorial-webgpu/${fixture.slug}/`)
    expect(await page.locator('main').textContent()).not.toMatch(/\{%|endnmargin_note/)
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width)
    await expect(page.locator('.site-header span')).toHaveText('実験版')
    await expect(page.locator('footer p')).toContainText('WebGPU 対応ブラウザ')
    if (fixture.slug === 'what_qpu_do_faster') {
      expect(await page.locator('main mjx-container').count()).toBeGreaterThan(10)
      expect(await page.locator('main mjx-merror').count()).toBe(0)
      expect(await page.locator('main img').evaluateAll(es => es.every(e => (e as HTMLImageElement).complete && (e as HTMLImageElement).naturalWidth > 0))).toBe(true)
    }
  })
}
