import { expect, test } from '@playwright/test'

const pages = ['h_gate', 'addition_circuit', 'qni_intro', 'disentangle', 'write_operation', 'multi-7']

for (const width of [1440, 700, 390]) for (const slug of pages) {
  test(`${slug}: Qni embeds follow the text column at ${width}px`, async ({ page }) => {
    await page.addInitScript(() => Object.defineProperty(navigator, 'gpu', { configurable: true, value: undefined }))
    await page.setViewportSize({ width, height: 900 })
    await page.goto(`/qni-tutorial-webgpu/${slug}/`)
    await page.evaluate(() => customElements.whenDefined('qni-webgpu-circuit'))

    const geometry = await page.locator('.content-with-margin').evaluate(root => {
      const column = root.querySelector(':scope > p')?.getBoundingClientRect()
      return {
        column: column && { left: column.left, width: column.width },
        embeds: [...root.querySelectorAll('qni-webgpu-circuit')].map(element => {
          const host = element.getBoundingClientRect()
          return {
            left: host.left,
            width: host.width,
            right: host.right,
            height: host.height,
            explicitHeight: element.getAttribute('height'),
          }
        }),
      }
    })

    expect(geometry.column).not.toBeNull()
    expect(geometry.embeds).not.toHaveLength(0)
    for (const embed of geometry.embeds) {
      expect(Math.abs(embed.left - geometry.column!.left)).toBeLessThanOrEqual(1)
      expect(Math.abs(embed.width - geometry.column!.width)).toBeLessThanOrEqual(1)
      expect(embed.right).toBeLessThanOrEqual(width)
      if (slug === 'multi-7') {
        expect(embed.height).toBe(480)
        expect(embed.explicitHeight).toBe('480')
      }
    }
  })
}
