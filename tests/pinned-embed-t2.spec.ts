import { expect, test, type Locator, type Page } from '@playwright/test'
import { readdirSync, readFileSync } from 'node:fs'

const pagesDirectory = new URL('../src/pages/', import.meta.url)
const pages = readdirSync(pagesDirectory).filter(file =>
  file.endsWith('.astro') && readFileSync(new URL(file, pagesDirectory), 'utf8').includes('<qni-webgpu-circuit'),
).flatMap(file => {
  const slug = file.slice(0, -'.astro'.length)
  if (slug === 'multi-[count]') return ['multi-1', 'multi-3', 'multi-7']
  return [slug === 'index' ? '' : slug]
})

const base = '/qni-tutorial-webgpu/'
const pin = readFileSync(new URL('../qni-embed.ref', import.meta.url), 'utf8').trim()
const release = `${base}qni-webgpu-prebuilt/embed-${pin}/`
const assets = ['qni-embed.mjs', 'qni-embed-error.mjs', 'qni-web.js', 'qni-web_bg.wasm']
const s = Math.SQRT1_2

type CircuitElement = HTMLElement & {
  runner: { circuitJSON(): string; selectedStep(): number | null; selectStep(n: number): void }
  readStateVector(): Promise<Float32Array>
}

const rounded = (vector: number[]) => vector.map(n => Math.round(n * 1e6) / 1e6)
const vector = (wires: number, amplitudes: [number, number, number][]) => {
  const result = Array<number>(2 ** (wires + 1)).fill(0)
  for (const [basis, real, imaginary] of amplitudes) {
    result[2 * basis] = real
    result[2 * basis + 1] = imaginary
  }
  return result
}

async function read(embed: Locator) {
  return embed.evaluate(async element => {
    const e = element as CircuitElement
    return {
      cols: JSON.parse(e.runner.circuitJSON()).cols,
      step: e.runner.selectedStep(),
      vector: Array.from(await e.readStateVector()),
    }
  })
}

async function expectVector(embed: Locator, expected: number[], step?: number) {
  // A missing adapter/readback is a failure, never a skip or a CPU mock.
  await expect(async () => {
    const state = await read(embed)
    if (step !== undefined) expect(state.step).toBe(step)
    expect(state.vector).toHaveLength(expected.length)
    for (const [i, value] of expected.entries()) expect(state.vector[i], `component ${i}`).toBeCloseTo(value, 5)
  }).toPass({ timeout: 10_000 })
}

async function running(page: Page, count?: number) {
  const embeds = page.locator('qni-webgpu-circuit')
  if (count !== undefined) await expect(embeds).toHaveCount(count)
  expect(await embeds.count()).toBeGreaterThan(0)
  // Scroll each canvas into view, but assert all runners remain live together.
  for (const embed of await embeds.all()) {
    await expect(embed).toHaveAttribute('data-state', 'running', { timeout: 45_000 })
    await embed.locator('canvas').scrollIntoViewIfNeeded()
  }
  await expect(page.locator('qni-webgpu-circuit:not([data-state="running"])')).toHaveCount(0)
  return embeds
}

for (const slug of pages) {
  test(`universal pinned runtime assets and real GPU startup: ${slug || 'index'}`, async ({ page }) => {
    test.setTimeout(120_000)
    const directory = release
    const requests: string[] = []
    const responses: string[] = []
    const failures: string[] = []
    const isRuntime = (url: URL) => assets.includes(url.pathname.split('/').at(-1)!)
    page.on('request', request => {
      const url = new URL(request.url())
      if (isRuntime(url)) requests.push(url.pathname + url.search)
    })
    page.on('response', response => {
      const url = new URL(response.url())
      if (isRuntime(url)) {
        responses.push(url.pathname + url.search)
        if (!response.ok()) failures.push(`${response.status()} ${response.url()}`)
      }
    })
    page.on('requestfailed', request => {
      if (isRuntime(new URL(request.url()))) failures.push(`${request.url()}: ${request.failure()?.errorText}`)
    })
    page.on('pageerror', error => failures.push(error.message))
    await page.goto(`${base}${slug ? `${slug}/` : ''}`)
    await expect(page.locator('html')).toHaveAttribute('data-qni-embed-base', release)
    const embeds = await running(page)
    for (const embed of await embeds.all()) {
      await expect(async () => {
        const state = await read(embed)
        expect(state.vector.length).toBeGreaterThanOrEqual(4)
        expect(state.vector.every(Number.isFinite)).toBe(true)
        const norm = state.vector.reduce((sum, value) => sum + value * value, 0)
        expect(norm).toBeCloseTo(1, 4)
      }).toPass({ timeout: 10_000 })
    }
    // Include the error module loaded during *successful* startup, not just on
    // an error path. Exact identity/count rejects mixed bundled/release loads.
    const expected = assets.map(asset => `${directory}${asset}`).sort()
    await expect.poll(() => [...responses].sort()).toEqual(expected)
    expect([...requests].sort()).toEqual(expected)
    expect(failures).toEqual([])
  })
}

test('inside_the_qft: all eleven readbacks, selections and edits are runner-local', async ({ page }) => {
  test.setTimeout(180_000)
  await page.goto(`${base}inside_the_qft/`)
  const embeds = await running(page, 11)
  const snapshot = async () => {
    const states = []
    for (const embed of await embeds.all()) {
      const state = await read(embed)
      states.push({ ...state, vector: rounded(state.vector) })
    }
    return states
  }
  // Record the authored states before changing any runner, not a shared global
  // diagnostic which can accidentally return the most recently rendered canvas.
  await expect(async () => {
    for (const state of await snapshot()) {
      expect(state.vector).toHaveLength(32)
      expect(state.vector.reduce((sum, n) => sum + n * n, 0)).toBeCloseTo(1, 4)
    }
  }).toPass({ timeout: 10_000 })
  let previous = await snapshot()
  for (let i = 0; i < 11; i++) {
    const embed = embeds.nth(i)
    // Labels are not semantic steps: column zero is preparation for all eleven.
    const step = 0
    await embed.evaluate((element, n) => (element as CircuitElement).runner.selectStep(n), step)
    await expectVector(embed, vector(4, [[i < 6 ? 0 : 4, 1, 0]]), step)
    let current = await snapshot()
    for (let j = 0; j < 11; j++) if (j !== i) expect(current[j], `selection ${i} changed runner ${j}`).toEqual(previous[j])
    previous = current

    // Give every edited runner a distinct signed imaginary result, so a shared
    // buffer cannot hide behind previously edited identical states. Keep four wires.
    const cols = [['|0>', '|0>', '|0>', '|0>'], [`Ry(π/${i + 2})`], ['Y']]
    await embed.evaluate((element, cols) => {
      element.setAttribute('circuit', JSON.stringify({ cols }))
      element.setAttribute('selected-step', '2')
    }, cols)
    await expect(embed).toHaveAttribute('data-state', 'running')
    await expectVector(embed, vector(4, [[0, 0, -Math.sin(Math.PI / (2 * (i + 2)))], [1, 0, Math.cos(Math.PI / (2 * (i + 2)))]]), 2)
    expect((await read(embed)).cols).toEqual(cols)
    current = await snapshot()
    for (let j = 0; j < 11; j++) if (j !== i) expect(current[j], `edit ${i} changed runner ${j}`).toEqual(previous[j])
    previous = current
  }
  await expect(page.locator('qni-webgpu-circuit[data-state="running"]')).toHaveCount(11)
})

test('multi-7: seven simultaneous runners return their own signed vectors', async ({ page }) => {
  test.setTimeout(120_000)
  await page.goto(`${base}multi-7/`)
  const embeds = await running(page, 7)
  const expected = [
    vector(2, [[0, s, 0], [1, s, 0]]),
    vector(2, [[1, 1, 0]]),
    vector(2, [[0, s, 0], [3, s, 0]]),
    vector(3, [[1, 0, 1]]),
    vector(2, [[0, s, 0], [1, -s, 0]]),
    vector(3, [[0, s, 0], [1, 0, s]]),
    vector(2, [[0, s, 0], [1, 0.5, 0.5]]),
  ]
  for (const [i, state] of expected.entries()) {
    // Without an authored selected-step, the editor initially selects column 0.
    const finalStep = [0, 0, 1, 0, 1, 1, 1][i]
    await embeds.nth(i).evaluate((e, step) => (e as CircuitElement).runner.selectStep(step), finalStep)
    await expectVector(embeds.nth(i), state, finalStep)
  }
  await expect(page.locator('qni-webgpu-circuit[data-state="running"]')).toHaveCount(7)
})

// Same authored-step contract as embed-fixes.spec.ts, extended with signed GPU
// readback. An intermediate selection must change the vector as well as metadata:
// testing only probabilities or the final state would hide the root regression.
for (const { slug, states } of [
  { slug: 'global_relative_phase', states: [{ step: 2, expected: [0.5, 0.5, 0.5, -0.5], before: 1, intermediate: [s, 0, 0, s] }] },
  { slug: 'basis_inner_product', states: [{ step: 2, expected: [(Math.sqrt(3) + 1) / (2 * Math.sqrt(2)), 0, (Math.sqrt(3) - 1) / (2 * Math.sqrt(2)), 0], before: 1, intermediate: [Math.sqrt(3) / 2, 0, 0.5, 0] }] },
  { slug: 'amplitude_probability', states: [{ step: 1, expected: [Math.sqrt(3) / 2, 0, 0.5, 0], before: 0, intermediate: [1, 0, 0, 0] }] },
  { slug: 'unitary_observable', states: [
    { step: 1, expected: [Math.sqrt(3) / 2, 0, 0.5, 0], before: 0, intermediate: [1, 0, 0, 0] },
    { step: 2, expected: [(Math.sqrt(3) + 1) / (2 * Math.sqrt(2)), 0, (Math.sqrt(3) - 1) / (2 * Math.sqrt(2)), 0], before: 1, intermediate: [Math.sqrt(3) / 2, 0, 0.5, 0] },
  ] },
  { slug: 'matrix_adjoint', states: [{ step: 4, expected: [1, 0, 0, 0], before: 2, intermediate: [s, 0, 0, s] }] },
  { slug: 'tensor_product_state', states: [{ step: 0, expected: [Math.sqrt(3 / 8), 0, Math.sqrt(1 / 8), 0, Math.sqrt(3 / 8), 0, Math.sqrt(1 / 8), 0], before: 1, intermediate: [Math.sqrt(3 / 8), 0, Math.sqrt(1 / 8), 0, Math.sqrt(3 / 8), 0, Math.sqrt(1 / 8), 0] }] },
  { slug: 'entangled_state', states: [{ step: 2, expected: [s, 0, 0, 0, 0, 0, s, 0], before: 1, intermediate: [s, 0, s, 0, 0, 0, 0, 0] }] },
]) {
  test(`${slug}: authored selection and signed selected-state readback`, async ({ page }) => {
    await page.goto(`${base}${slug}/`)
    const embeds = await running(page, states.length)
    for (const [i, state] of states.entries()) {
      const embed = embeds.nth(i)
      await expect(embed).toHaveAttribute('selected-step', String(state.step))
      await expectVector(embed, state.expected, state.step)
      await embed.evaluate((e, step) => e.setAttribute('selected-step', String(step)), state.before)
      await expectVector(embed, state.intermediate, state.before)
      await embed.evaluate((e, step) => e.setAttribute('selected-step', String(step)), state.step)
      await expectVector(embed, state.expected, state.step)
    }
  })
}

async function restart(page: Page, embed: Locator, action: 'click' | 'Enter' | 'Space') {
  if (action !== 'click') {
    // Reset egui's widget focus after editing via the real pointer restart.
    // The separately observed restart below must still be keyboard-activated.
    await restart(page, embed, 'click')
  }
  await embed.evaluate(element => {
    element.setAttribute('data-restart-observed', 'false')
    const observer = new MutationObserver(records => {
      if (records.some(record => record.oldValue === 'running')) {
        element.setAttribute('data-restart-observed', 'true')
        observer.disconnect()
      }
    })
    observer.observe(element, { attributes: true, attributeFilter: ['data-state'], attributeOldValue: true })
  })
  // Follow restart.spec.ts: `running` can precede egui accepting input.
  await expect(async () => {
    const canvas = embed.locator('canvas')
    await canvas.scrollIntoViewIfNeeded()
    if (action === 'click') {
      const box = (await canvas.boundingBox())!
      // State panel header: centered panel, 24px side margins on narrow canvases.
      const panelWidth = Math.min(560, box.width - 48)
      await page.mouse.click(box.x + box.width / 2 + panelWidth / 2 - 32, box.y + box.height - 64 - 8 - 160 - 16)
    } else {
      await canvas.focus()
      await page.keyboard.press('Shift+Tab')
      await page.waitForTimeout(100)
      await page.keyboard.press(action)
    }
    await expect(embed).toHaveAttribute('data-restart-observed', 'true', { timeout: 3_000 })
    await expect(embed).toHaveAttribute('data-state', 'running', { timeout: 3_000 })
  }).toPass({ timeout: 30_000 })
}

for (const action of ['click', 'Enter', 'Space'] as const) {
  test(`measurement: native edit and ${action} restart preserve the edited sampled circuit`, async ({ page }) => {
    test.setTimeout(120_000)
    await page.goto(`${base}measurement_operation/`)
    const embeds = await running(page, 1)
    const embed = embeds.first()
    expect((await read(embed)).cols).toEqual([['|0>'], ['H'], ['Measure']])
    await embed.evaluate(e => e.setAttribute('run-button', ''))
    await expect(embed).toHaveAttribute('data-state', 'running')
    const canvas = embed.locator('canvas')
    await canvas.scrollIntoViewIfNeeded()
    const box = (await canvas.boundingBox())!
    // Same native drag as embed-fixes: delete H, retaining preparation + Measure.
    await page.mouse.move(box.x + 144, box.y + 138)
    await page.mouse.down()
    await page.mouse.move(box.x + 144, box.y + 15, { steps: 20 })
    await page.mouse.up()
    await page.mouse.move(box.x + box.width - 10, box.y + box.height - 40)
    await expect.poll(async () => (await read(embed)).cols).toEqual([['|0>'], ['Measure']])
    await expectVector(embed, [1, 0, 0, 0])
    await restart(page, embed, action)
    await expectVector(embed, [1, 0, 0, 0])
    expect(JSON.parse((await embed.getAttribute('circuit'))!).cols).toEqual([['|0>'], ['Measure']])
    expect((await read(embed)).cols).toEqual([['|0>'], ['Measure']])
    expect(await embed.evaluate(e => e.shadowRoot!.querySelectorAll('button').length)).toBe(0)

    // Deterministic one must also be sampled as one, not stale zero readback.
    await embed.evaluate(e => e.setAttribute('circuit', '{"cols":[["|1>"],["Measure"]]}'))
    await expect(embed).toHaveAttribute('data-state', 'running')
    await expectVector(embed, [0, 0, 1, 0])
    await restart(page, embed, action)
    await expectVector(embed, [0, 0, 1, 0])
    expect((await read(embed)).cols).toEqual([['|1>'], ['Measure']])
  })
}

test('measurement: genuine stochastic samples include both outcomes across restarts', async ({ page }) => {
  test.setTimeout(240_000)
  await page.goto(`${base}measurement_operation/`)
  const embed = (await running(page, 1)).first()
  await embed.evaluate(e => e.setAttribute('run-button', ''))
  await expect(embed).toHaveAttribute('data-state', 'running')
  const outcomes = new Set<number>()
  // No RNG stubbing: 32 independent fair shots have < 5e-10 probability of
  // missing one outcome. Each shot must be a collapsed basis state, not merely
  // a normalized superposition or a probability-only surrogate.
  for (let shot = 0; shot < 32 && outcomes.size < 2; shot++) {
    // Prove the GPU has moved beyond preparation before accepting a zero
    // sample; otherwise an initial |0> readback could masquerade as a sample.
    await embed.evaluate(e => (e as CircuitElement).runner.selectStep(1))
    await expectVector(embed, [s, 0, s, 0], 1)
    await embed.evaluate(e => (e as CircuitElement).runner.selectStep(2))
    let outcome = -1
    await expect(async () => {
      const state = (await read(embed)).vector
      const zero = state.length === 4 && state.every((n, i) => Math.abs(n - [1, 0, 0, 0][i]) < 1e-5)
      const one = state.length === 4 && state.every((n, i) => Math.abs(n - [0, 0, 1, 0][i]) < 1e-5)
      expect(zero || one, `sample ${shot}: ${JSON.stringify(state)}`).toBe(true)
      outcome = zero ? 0 : 1
    }).toPass({ timeout: 10_000 })
    outcomes.add(outcome)
    if (outcomes.size < 2) await restart(page, embed, 'Enter')
  }
  expect([...outcomes].sort()).toEqual([0, 1])
  expect((await read(embed)).cols).toEqual([['|0>'], ['H'], ['Measure']])
})
