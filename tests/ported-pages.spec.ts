import { expect, test } from '@playwright/test'
import qpu from './fixtures/qpu-original.json' with { type: 'json' }
import faster from './fixtures/what_qpu_do_faster-original.json' with { type: 'json' }
import pbit from './fixtures/p_bit-original.json' with { type: 'json' }
import superposition from './fixtures/superposition-original.json' with { type: 'json' }
import qubit from './fixtures/qubit-original.json' with { type: 'json' }
import phase from './fixtures/phase-original.json' with { type: 'json' }
import notation from './fixtures/circle_notation-original.json' with { type: 'json' }
import cpu from './fixtures/cpu_vs_qpu_operations-original.json' with { type: 'json' }
import write from './fixtures/write_operation-original.json' with { type: 'json' }
import intro from './fixtures/index-original.json' with { type: 'json' }
import x from './fixtures/x_gate-original.json' with { type: 'json' }
import phaseGate from './fixtures/phase_gate-original.json' with { type: 'json' }
import measurement from './fixtures/measurement_operation-original.json' with { type: 'json' }
import noCloning from './fixtures/no_cloning_theorem-original.json' with { type: 'json' }
import combinations from './fixtures/gate_combination-original.json' with { type: 'json' }
const replaced = new Set(['rotation-by-pi-around-x-axis.png','matrix_multiplication.png','qpu_operations_matrix_and_state_vector.png','state_vector_norm1.png','reversible_matrix_multiplication.png','p_bit_graph.png','c_bit_and_p_bit.png','p0p1_graph.png','qbit_circular_state.png','bloch_sphere.png','amplitude_amplification_overview.png','argument_of_complex.png','logic_gates_and_not.png'])
for (const fixture of [qpu, faster, pbit, superposition, qubit, phase, notation, cpu, write, intro, x, phaseGate, measurement, noCloning, combinations]) for (const width of [1440, 390]) {
  test(`${fixture.slug} preserves original structure at ${width}px`, async ({ page }) => {
    await page.setViewportSize({width,height:1000})
    await page.goto(`/qni-tutorial-webgpu/${fixture.slug ? fixture.slug + '/' : ''}`)
    if (['what_qpu_do_faster','superposition','qubit','phase','circle_notation','write_operation','x_gate','phase_gate','measurement_operation','gate_combination'].includes(fixture.slug)) await page.waitForFunction(() => document.documentElement.dataset.mathjax === 'ready')
    await expect(page.locator('main h1')).toHaveText(fixture.title)
    await expect(page.locator('.lede')).toHaveText(fixture.description)
    await expect(page.locator('main .margin-note')).toHaveCount(fixture.sidenotes.length)
    for (const id of fixture.sidenotes) await expect(page.locator(`#margin-note-${id}`)).toHaveCount(1)
    const images = fixture.images.filter(image => !replaced.has(image.split('/').at(-1)!))
    await expect(page.locator('main img')).toHaveCount(images.length)
    for (const image of images) await expect(page.locator(`main img[src="/qni-tutorial-webgpu/${image}"]`)).toHaveCount(1)
    await expect(page.locator('main orbit-prompt')).toHaveCount(fixture.orbitPrompts)
    const prompts = await page.locator('main orbit-prompt').evaluateAll(es => es.map(e => Object.fromEntries([...e.attributes].filter(a => !a.name.startsWith('data-astro-')).map(a => [a.name, a.value.replace(/\s+/g, '')]))))
    expect(prompts).toEqual(fixture.orbit.map(p => Object.fromEntries(Object.entries(p).map(([k,v]) => [k,v.replace(/\s+/g, '')]))))
    await expect(page.locator('main qni-webgpu-circuit')).toHaveCount(fixture.slug==='write_operation' ? 2 : 'circuits' in fixture ? fixture.circuits.length : 0)
    if ('circuits' in fixture && fixture.slug!=='write_operation') expect(await page.locator('main qni-webgpu-circuit').evaluateAll(es => es.map(e => JSON.parse(e.getAttribute('circuit')!)))).toEqual(fixture.circuits)
    if ('amplitudes' in fixture) expect(await page.locator('main qubit-circle:not([data-original-image] qubit-circle)').evaluateAll(es => es.map(e => ({amplitude:e.getAttribute('data-amplitude'),ket:e.getAttribute('data-ket'),size:e.getAttribute('data-size')})))).toEqual(fixture.amplitudes)
    expect(await page.locator('main mjx-merror').count()).toBe(0)
    await expect(page.locator('.toc-static [aria-current="page"]')).toHaveAttribute('href', `/qni-tutorial-webgpu/${fixture.slug ? fixture.slug + '/' : ''}`)
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
