import { test, expect } from '@playwright/test'
import { readFileSync } from 'node:fs'

for (const width of [1280, 390]) {
  test(`measurement recipe uses pinned Qni components at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    await page.goto('/qni-tutorial-webgpu/measurement_basis/')
    const explorer = page.locator('measurement-recipe-explorer')
    const frame = explorer.frameLocator('iframe[data-qni-recipe]')
    await expect(frame.locator('body')).toHaveAttribute('data-qni-pin', readFileSync('qni-webgpu.ref', 'utf8').trim())
    for (const tag of ['s-dagger-gate', 'h-gate', 'measurement-gate']) {
      const gate = frame.locator(tag).first()
      await expect(gate).toBeVisible()
      expect(await gate.evaluate(el => !!el.shadowRoot)).toBe(true)
      const box = await gate.boundingBox()
      expect(box?.width).toBe(40)
      expect(box?.height).toBe(40)
    }
    await expect(frame.locator('h-gate .body')).toHaveCSS('background-color', 'rgb(58, 169, 159)')
    await expect(frame.locator('h-gate .body')).toHaveCSS('border-radius', '6px')
    await expect(frame.locator('circuit-dropzone .wire').first()).toHaveCSS('stroke', 'rgb(218, 216, 206)')
    await expect(frame.locator('circuit-dropzone .wire').first()).toHaveCSS('stroke-width', '2px')
    await explorer.locator('[data-step]').fill('2')
    await expect(frame.locator('.marker')).toHaveCSS('left', '168px')
    await expect(explorer.locator('output')).toContainText('最終変換後')
    await explorer.locator('[data-question]').fill('1')
    await expect(frame.locator('#first h-gate')).toBeVisible()
    await expect(frame.locator('#second')).toBeHidden()
    await expect(frame.locator('s-dagger-gate')).toHaveCount(0)
    await explorer.locator('[data-question]').fill('0')
    await expect(frame.locator('#first')).toBeHidden()
    await expect(frame.locator('#second')).toBeHidden()
    await expect(frame.locator('measurement-gate')).toBeVisible()
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width)
    // Other gate figures remain real Qni editors, not SVG reconstructions.
    for (const name of ['measurement_expectation', 'measurement_order']) {
      await page.goto(`/qni-tutorial-webgpu/${name}/`)
      await expect(page.locator('qni-webgpu-circuit').first()).toBeVisible()
      expect(await page.locator('rect.gate').count()).toBe(0)
    }
  })
}
