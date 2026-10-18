import { expect, test } from '@playwright/test'

for (const { width, dpr } of [{ width: 1440, dpr: 1 }, { width: 390, dpr: 2 }]) {
  test.describe(`${width}px / DPR${dpr}`, () => {
    test.use({ viewport: { width, height: 1000 }, deviceScaleFactor: dpr, isMobile: width === 390 })

    test('phase embed has adjacent Amps1 and Probability instructions', async ({ page }) => {
      await page.goto('/qni-tutorial-webgpu/global_relative_phase/')
      const embed = page.locator('qni-webgpu-circuit')
      expect(JSON.parse((await embed.getAttribute('circuit'))!).cols).toEqual([
        ['H'], ['P(π/2)'], ['H'], ['Amps1'], ['Probability'],
      ])
      await expect(page.locator('main')).not.toContainText('空の列を挟んであります')
    })

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
