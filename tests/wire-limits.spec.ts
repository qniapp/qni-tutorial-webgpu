import { expect, test } from '@playwright/test'
import limits from './fixtures/original-wire-limits.json' with { type: 'json' }

for (const [slug, values] of Object.entries(limits)) {
  test(`${slug} preserves original max-wire-count values`, async ({ page }) => {
    await page.goto(`/qni-tutorial-webgpu/${slug === 'index' ? '' : `${slug}/`}`)
    expect(await page.locator('main qni-webgpu-circuit').evaluateAll(elements => elements.map(element => element.getAttribute('max-wire-count')))).toEqual(values.map(String))
  })
}
