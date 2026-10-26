import { expect, test } from '@playwright/test'

const base =
  process.env.QNI_TUTORIAL_MIGRATION === '1' ? '/qni/' : '/qni-tutorial-webgpu/'
const cols = [
  ['|0>', '|0>'],
  ['{量子もつれ'],
  ['H'],
  ['•', 'X'],
  ['}'],
  ['Measure'],
  [1, 'Measure'],
]

type CircuitElement = HTMLElement & {
  runner: {
    selectedStep(): number | null
    stepCount(): number
    circuitJSON(): string
  }
  readStateVector(): Promise<Float32Array>
}

for (const width of [1280, 390]) {
  test(`introduction starts after CNOT before measurement and permits step changes at ${width}px`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ width, height: 900 })
    await page.route('https://js.withorbit.com/**', (route) => route.abort())
    await page.goto(base)
    const embed = page.locator('qni-webgpu-circuit')
    await embed.scrollIntoViewIfNeeded()
    // No adapter skips or mocked runtime: startup and GPU readback must succeed.
    await expect(embed).toHaveAttribute('data-state', 'running', {
      timeout: 45_000,
    })
    const read = () =>
      embed.evaluate(async (element) => {
        const e = element as CircuitElement
        return {
          step: e.runner.selectedStep(),
          count: e.runner.stepCount(),
          json: e.runner.circuitJSON(),
          vector: Array.from(await e.readStateVector()),
        }
      })
    const initial = await read()
    await testInfo.attach('initial-state', {
      body: JSON.stringify(initial, null, 2),
      contentType: 'application/json',
    })
    const screenshot = testInfo.outputPath('initial-embed.png')
    await embed.screenshot({ path: screenshot })
    await testInfo.attach('initial-embed', {
      path: screenshot,
      contentType: 'image/png',
    })
    expect(initial.step).toBe(2)
    const bell = [Math.SQRT1_2, 0, 0, 0, 0, 0, Math.SQRT1_2, 0]
    expect(initial.vector).toHaveLength(bell.length)
    for (const [i, value] of bell.entries())
      expect(initial.vector[i], `initial component ${i}`).toBeCloseTo(value, 5)
    expect(initial.count).toBe(5) // Block markers are not simulation columns.
    expect(JSON.parse(initial.json)).toEqual({ cols })
    expect(JSON.parse((await embed.getAttribute('circuit'))!)).toEqual({ cols })
    const expectVector = async (step: number, vector: number[]) => {
      await expect(async () => {
        const state = await read()
        expect(state.step).toBe(step)
        expect(state.json).toBe(initial.json)
        expect(state.vector).toHaveLength(vector.length)
        for (const [i, value] of vector.entries())
          expect(state.vector[i], `component ${i}`).toBeCloseTo(value, 5)
      }).toPass({ timeout: 10_000 })
    }
    await expectVector(2, [Math.SQRT1_2, 0, 0, 0, 0, 0, Math.SQRT1_2, 0])

    // Click the actual step labels, rather than invoking selectStep in the test.
    const canvas = embed.locator('canvas')
    await canvas.click({ position: { x: 88, y: 295 } })
    await page.mouse.move(0, 0) // Remove transient hover previews.
    await expectVector(0, [1, 0, 0, 0, 0, 0, 0, 0])
    await canvas.click({ position: { x: 144, y: 295 } })
    await page.mouse.move(0, 0)
    await expectVector(1, [Math.SQRT1_2, 0, Math.SQRT1_2, 0, 0, 0, 0, 0])
    await canvas.click({ position: { x: 200, y: 295 } })
    await page.mouse.move(0, 0)
    await expectVector(2, [Math.SQRT1_2, 0, 0, 0, 0, 0, Math.SQRT1_2, 0])
  })
}
