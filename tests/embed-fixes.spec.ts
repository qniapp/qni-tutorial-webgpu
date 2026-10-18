import { expect, test } from '@playwright/test'

for (const { width, dpr } of [{ width: 1440, dpr: 1 }, { width: 390, dpr: 2 }]) {
  test.describe(`${width}px / DPR${dpr}`, () => {
    test.use({ viewport: { width, height: 1000 }, deviceScaleFactor: dpr, isMobile: width === 390 })

    for (const { slug, embeds } of [
      { slug: 'global_relative_phase', embeds: [
        { cols: [['H'], ['P(π/2)'], ['H'], ['Amps1'], ['Probability']] },
      ] },
      { slug: 'basis_inner_product', embeds: [
        { cols: [['|0>'], ['Ry(π/3)'], ['H'], ['Amps1'], ['Probability']], step: '2' },
      ] },
      { slug: 'amplitude_probability', embeds: [
        { cols: [['|0>'], ['Ry(π/3)'], ['Amps1'], ['Probability']], step: '1' },
      ] },
      { slug: 'unitary_observable', embeds: [
        { cols: [['|0>'], ['Ry(π/3)'], ['Amps1'], ['Probability']], step: '1' },
        { cols: [['|0>'], ['Ry(π/3)'], ['H'], ['Amps1'], ['Probability']], step: '2' },
      ] },
      { slug: 'matrix_adjoint', embeds: [
        { cols: [['|0>'], ['H'], ['S'], ['S†'], ['H'], ['Amps1'], ['Probability']], step: '4' },
      ] },
      { slug: 'tensor_product_state', embeds: [
        { cols: [['Ry(π/3)', 'Ry(π/2)'], ['Amps2'], ['Probability2']], step: '0' },
      ] },
      { slug: 'entangled_state', embeds: [
        { cols: [['|0>', '|0>'], ['H'], ['•', 'X'], ['Amps2'], ['Probability', 'Probability'], ['Bloch', 'Bloch'], ['Density', 'Density']], step: '2' },
      ] },
    ]) {
      test(`${slug} embeds have adjacent Amps and Probability instructions`, async ({ page }) => {
        await page.goto(`/qni-tutorial-webgpu/${slug}/`)
        const circuits = page.locator('qni-webgpu-circuit')
        await expect(circuits).toHaveCount(embeds.length)
        for (const [index, expected] of embeds.entries()) {
          const embed = circuits.nth(index)
          expect(JSON.parse((await embed.getAttribute('circuit'))!).cols).toEqual(expected.cols)
          if ('step' in expected) await expect(embed).toHaveAttribute('selected-step', expected.step!)
        }
        for (const embed of await circuits.all()) {
          const cols: (string | number)[][] = JSON.parse((await embed.getAttribute('circuit'))!).cols
          for (const [index, col] of cols.entries()) {
            if (col.length === 1 && typeof col[0] === 'string' && /^Amps\d+$/.test(col[0])) {
              expect(cols[index + 1]).not.toEqual([1])
            }
          }
        }
        await expect(page.locator('main')).not.toContainText('1 列空け')
        await expect(page.locator('main')).not.toContainText('空の列を挟んであります')
      })
    }

    test('native scale and final state survive editing, Undo and Redo', async ({ page }) => {
      await page.goto('/qni-tutorial-webgpu/write_operation/')
      const embed = page.locator('qni-webgpu-circuit').first()
      const canvas = embed.locator('canvas')
      await canvas.scrollIntoViewIfNeeded()
      // An unavailable adapter is a failure here, not a passing mock or skipped regression.
      await expect(embed).toHaveAttribute('data-state', 'running')
      const read = () => embed.evaluate(async element => {
        const circuit = element as HTMLElement & {
          runner: { circuitJSON(): string; selectedStep(): number }
          readStateVector(): Promise<Float32Array>
        }
        return {
          cols: JSON.parse(circuit.runner.circuitJSON()).cols,
          step: circuit.runner.selectedStep(),
          vector: Array.from(await circuit.readStateVector()),
        }
      })
      await expect.poll(async () => (await read()).vector).toEqual([1, 0, 0, 0])

      // Read actual rendered pixels in CSS coordinates. A DPR2 backing buffer is
      // correct, but a toolbar drawn at 2x CSS size (upstream #96) is not.
      const png = await canvas.screenshot({ scale: 'css' })
      const colors = await page.evaluate(async base64 => {
        const image = new Image()
        image.src = `data:image/png;base64,${base64}`
        await image.decode()
        const copy = document.createElement('canvas')
        copy.width = image.width
        copy.height = image.height
        const ctx = copy.getContext('2d')!
        ctx.drawImage(image, 0, 0)
        return [20, 60, 100].map(y => Array.from(ctx.getImageData(10, y, 1, 1).data).slice(0, 3))
      }, png.toString('base64'))
      const difference = (a: number[], b: number[]) => Math.max(...a.map((n, i) => Math.abs(n - b[i])))
      expect(difference(colors[1], colors[2]), 'canvas background starts below the normal-height toolbar').toBeLessThanOrEqual(3)
      expect(difference(colors[0], colors[1]), 'toolbar remains distinct from the canvas background').toBeGreaterThan(8)

      const box = (await canvas.boundingBox())!
      // Remove H through the native UI, leaving |0> then Y, whose final state is i|1>.
      await page.mouse.move(box.x + 144, box.y + 138)
      await page.mouse.down()
      await page.mouse.move(box.x + 144, box.y + 15, { steps: 20 })
      await page.mouse.up()
      await page.mouse.move(box.x + box.width - 10, box.y + box.height - 10)
      await expect.poll(read).toEqual({ cols: [['|0>'], ['Y']], step: 1, vector: [0, 0, 0, 1] })

      await page.mouse.click(box.x + 28, box.y + 22) // Undo
      await expect.poll(async () => {
        const state = await read()
        return { ...state, vector: state.vector.map(n => Math.round(n * 1e6) / 1e6) }
      }).toEqual({ cols: [['|0>'], ['H'], ['Y']], step: 2, vector: [0, -0.707107, 0, 0.707107] })

      await page.mouse.click(box.x + 68, box.y + 22) // Redo
      await expect.poll(read).toEqual({ cols: [['|0>'], ['Y']], step: 1, vector: [0, 0, 0, 1] })
    })
  })
}
