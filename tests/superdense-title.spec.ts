import { expect, test } from '@playwright/test'
import original from './fixtures/superdense_coding_circuit-original.json' with { type: 'json' }

for (const width of [390, 1440]) {
  test(`native superdense current-circuit link retains original title at ${width}`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1100 })
    await page.goto('/qni-tutorial-webgpu/superdense_coding_circuit/')
    const embed = page.locator('qni-webgpu-circuit')
    await expect(embed).toHaveAttribute('data-state', 'running')
    const link = embed.locator('.open-link')
    await link.dispatchEvent('pointerdown')
    const href = await link.getAttribute('href')
    const circuit = JSON.parse(decodeURIComponent(new URL(href!, page.url()).hash.slice(1)))
    expect(circuit.title).toBe(original.circuits[0].title)
  })
}
