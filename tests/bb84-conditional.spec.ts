import { expect, test } from '@playwright/test'
import { readFileSync } from 'node:fs'

const pin = readFileSync(new URL('../qni-embed.ref', import.meta.url), 'utf8').trim()
const embedPath = `/qni-tutorial-webgpu/qni-webgpu-prebuilt/embed-${pin}/qni-embed.mjs`

type Runner = { readStateVector(): Promise<Float32Array>; selectStep(step: number): void }
declare global { interface Window { __conditionalRunner: Runner } }
import original from './fixtures/bb84_circuit-original.json' with { type: 'json' }

for (const width of [390, 1440]) {
  test(`BB84 conditional embed starts at step0 and preserves flags at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1100 })
    const errors: string[] = []
    page.on('pageerror', error => errors.push(error.message))
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()) })
    await page.goto('/qni-tutorial-webgpu/bb84_circuit/')
    const embed = page.locator('qni-webgpu-circuit')
    await expect(embed).toHaveAttribute('data-state', 'running', { timeout: 20_000 })
    expect(JSON.parse((await embed.getAttribute('circuit'))!)).toEqual(original.circuits[0])
    await expect(embed).toHaveAttribute('palette', '[]')
    await expect.poll(() => embed.evaluate(async element => {
      const reader = element as HTMLElement & { readStateVector(): Promise<Float32Array> }
      try { return Array.from(await reader.readStateVector()) } catch { return [] }
    })).toEqual([1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0])
    const link = embed.locator('a.open-link')
    await link.dispatchEvent('pointerdown')
    const exported = JSON.parse(decodeURIComponent(new URL((await link.getAttribute('href'))!, page.url()).hash.slice(1)))
    expect(exported.cols.flat().filter((token: unknown) => typeof token === 'string' && /^(Measure>|[HX]<)/.test(token))).toEqual(original.circuits[0].cols.flat().filter(token => typeof token === 'string' && /^(Measure>|[HX]<)/.test(token)))
    expect(errors).toEqual([])
  })
}

for (const [name, input, expected] of [
  ['applied', { cols: [['|1>', '|0>'], ['Measure>a'], [1, 'X<a']] }, [0, 0, 0, 0, 0, 0, 1, 0]],
  ['skipped', { cols: [['|0>', '|0>'], ['Measure>a'], [1, 'X<a']] }, [1, 0, 0, 0, 0, 0, 0, 0]],
  ['unset', { cols: [['|0>', '|0>'], [1, 'X<b']] }, [1, 0, 0, 0, 0, 0, 0, 0]],
] as const) {
  test(`real GPU conditional gate is ${name}`, async ({ page }) => {
    // Isolate the real pinned runner from tutorial-owned canvases and preloads.
    await page.route('**/qni-tutorial-webgpu/conditional-runner/', route => route.fulfill({
      contentType: 'text/html',
      body: '<!doctype html><canvas width="1000" height="700" style="width:1000px;height:700px"></canvas>',
    }))
    await page.goto('/qni-tutorial-webgpu/conditional-runner/')
    await page.evaluate(async ({ embedPath, circuit }) => {
      const module = await import(embedPath) as {
        startEmbed(canvas: HTMLCanvasElement, circuit: string, settings: { showStatePanel: boolean }): Promise<Runner>
      }
      const runner = await module.startEmbed(document.querySelector('canvas')!, circuit, { showStatePanel: true })
      window.__conditionalRunner = runner
      runner.selectStep(JSON.parse(circuit).cols.length - 1)
    }, { embedPath, circuit: JSON.stringify(input) })
    await expect.poll(() => page.evaluate(async () => {
      try {
        return Array.from(await window.__conditionalRunner.readStateVector()).map(value => Math.round(value * 1e5) / 1e5)
      } catch { return [] }
    }), { timeout: 20_000 }).toEqual(expected)
  })
}
