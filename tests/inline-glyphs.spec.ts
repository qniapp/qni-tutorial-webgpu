import { expect, test } from '@playwright/test'
import palettes from './fixtures/original-palettes.json' with { type: 'json' }
const tags = ['h-gate','x-gate','y-gate','z-gate','s-gate','s-dagger-gate','t-gate','t-dagger-gate','phase-gate','rnot-gate','rx-gate','ry-gate','rz-gate','qft-gate','qft-dagger-gate','write-gate','measurement-gate','control-gate','swap-gate']
for (const dpr of [1,2]) for (const width of [1440,390]) {
  test.describe(`${width}px DPR${dpr}`, () => {
    test.use({ deviceScaleFactor: dpr })
    test('all current and future original-tag prose glyphs bold, diagrams regular', async ({ page }) => {
      await page.setViewportSize({ width, height: 1000 })
      await page.goto('/qni-tutorial-webgpu/quantum_circuit/')
      await page.waitForFunction(() => customElements.get('write-gate'))
      await page.evaluate(tags => {
        const prose = document.createElement('p'); prose.id = 'glyph-prose'
        const figure = document.createElement('figure'); figure.id = 'glyph-figure'
        for (const tag of tags) {
          const gate = document.createElement(tag); prose.append(gate)
          const regular = document.createElement(tag); regular.style.fontSize = '32px'; figure.append(regular)
        }
        document.querySelector('main')!.append(prose, figure)
      }, tags)
      expect(await page.locator('#glyph-prose > *').evaluateAll(es => es.map(e => (e as HTMLElement).dataset.glyph))).toEqual(tags.map(() => 'bold'))
      expect(await page.locator('#glyph-figure > *').evaluateAll(es => es.map(e => (e as HTMLElement).dataset.glyph))).toEqual(tags.map(() => 'regular'))
      for (const tag of tags) {
        const gate = page.locator(`#glyph-prose ${tag}`)
        expect(await gate.evaluate(e => e.querySelector('svg') !== null)).toBe(true)
        if (!['measurement-gate','control-gate','swap-gate'].includes(tag)) expect(await gate.locator('svg[data-font-weight="700"]').count()).toBe(1)
        // A 3px non-scaling stroke closes the Phi counter at 16px.
        if (tag === 'phase-gate') await expect(gate.locator('path')).toHaveAttribute('stroke-width', '2.25')
        await gate.evaluate(e => document.querySelector('#glyph-figure')!.append(e))
        await expect(gate).toHaveCount(0)
        expect(await page.locator(`#glyph-figure ${tag}`).last().getAttribute('data-glyph')).toBe('regular')
      }
    })
  })
}
for (const [slug, expected] of Object.entries(palettes)) {
  test(`${slug} original palette per embed`, async ({ page }) => {
    await page.goto(`/qni-tutorial-webgpu/${slug === 'index' ? '' : slug + '/'}`)
    expect(await page.locator('qni-webgpu-circuit').evaluateAll(es => es.map(e => JSON.parse(e.getAttribute('palette')!)))).toEqual(expected)
  })
}

test('replaced illustrations no longer cite old images, retained images keep references', async ({ page }) => {
  for (const slug of ['h_gate','x_gate']) {
    await page.goto(`/qni-tutorial-webgpu/${slug}/`)
    expect(await page.locator('main').innerText()).not.toContain('画像クレジット')
  }
  await page.goto('/qni-tutorial-webgpu/quantum_circuit/')
  await expect(page.locator('main img')).toHaveCount(2)
  expect(await page.locator('main').innerText()).toContain('Feynman')
})
