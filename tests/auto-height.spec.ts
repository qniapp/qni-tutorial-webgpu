import { expect, test } from '@playwright/test'
import pages from './fixtures/auto-height-pages.json' with { type: 'json' }
import { estimateEmbedHeight } from '../src/components/qni-embed-height'

// All 68 tutorial pages; the two stress routes are deliberately excluded.

for (const width of [390, 1440]) for (const slug of pages) {
  test(`${slug}: automatic embed geometry at ${width}px before GPU startup`, async ({ page }) => {
    await page.addInitScript(() => Object.defineProperty(navigator, 'gpu', { configurable: true, value: undefined }))
    await page.setViewportSize({ width, height: 1000 })
    await page.goto(`/qni-tutorial-webgpu/${slug === 'index' ? '' : `${slug}/`}`)
    const failures = await page.locator('qni-webgpu-circuit').evaluateAll(elements => elements.flatMap(element => {
      const host = element.getBoundingClientRect()
      const frame = element.shadowRoot!.querySelector('.frame')!.getBoundingClientRect()
      const tab = element.shadowRoot!.querySelector('.open-tab')!.getBoundingClientRect()
      const auto = parseFloat((element as HTMLElement).style.getPropertyValue('--_qni-auto-height'))
      const failure = !Number.isFinite(auto) || Math.abs(host.height - auto) > 1
        || Math.abs(frame.height + 44 - host.height) > 1
        || frame.width > host.width + 1 || tab.bottom > host.bottom + 1
        || host.right > innerWidth + 1 || host.left < -1
        // Last wire, toolbar and optional state viewport; no arbitrary 640px floor.
        || auto < 180 || auto > 1800
      return failure ? [{ circuit: element.getAttribute('circuit'), height: host.height, auto }] : []
    }))
    expect(failures).toEqual([])
  })
}

for (const [token, expected] of [['QFT†3', 580], ['Probability3', 580]] as const) {
  test(`startup estimate recognizes ${token}`, () => {
    expect(estimateEmbedHeight(JSON.stringify({ cols: [[token]] }), '[]', 1, true, 390)).toBe(expected)
  })
}

test('startup estimate tracks wrapped palette width', () => {
  const palette = JSON.stringify(['H', 'X', 'Y', 'Z', 'S', 'T', 'Measure', 'Bloch'])
  expect(estimateEmbedHeight('{"cols":[["H"]]}', palette, 1, true, 300)
    - estimateEmbedHeight('{"cols":[["H"]]}', palette, 1, true, 1000)).toBe(48)
})
