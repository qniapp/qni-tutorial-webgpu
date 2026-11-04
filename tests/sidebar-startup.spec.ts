import { expect, test } from '@playwright/test'

for (const drawerOpen of [false, true]) {
  test(`real H-gate startup preserves page geometry with drawer ${drawerOpen ? 'open' : 'closed'}`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    // Hold only network delivery, not the runtime implementation. This puts
    // real GPU startup across the same boundary that raced in hosted CI.
    let release!: () => void
    const held = new Promise<void>(resolve => { release = resolve })
    await page.route('**/qni-embed.mjs', async route => {
      await held
      await route.continue()
    })
    try {
      await page.goto('/qni-tutorial-webgpu/h_gate/', { waitUntil: 'domcontentloaded' })
      const adapter = await page.evaluate(async () => {
        const gpu = (navigator as Navigator & { gpu?: { requestAdapter(): Promise<unknown> } }).gpu
        return !!(gpu && await gpu.requestAdapter())
      })
      test.skip(!adapter, 'Real GPU startup geometry requires a WebGPU adapter')
      await page.waitForFunction(() => document.documentElement.dataset.mathjax === 'ready')
      const circuit = page.locator('qni-webgpu-circuit')
      await expect(circuit).toHaveAttribute('data-state', 'loading')
      const geometry = () => page.locator('main').evaluate(main => {
        const rect = main.getBoundingClientRect()
        return { x: rect.x + scrollX, y: rect.y + scrollY, width: rect.width, height: rect.height,
          circuitHeight: main.querySelector('qni-webgpu-circuit')!.getBoundingClientRect().height }
      })
      const before = await geometry()
      const button = page.getByRole('button', { name: '目次を開く' })
      const drawer = page.getByRole('dialog', { name: '目次' })
      if (drawerOpen) {
        await button.click()
        await expect(drawer).toBeVisible()
        await expect(drawer.getByRole('button', { name: '目次を閉じる' })).toBeFocused()
        expect(await geometry()).toEqual(before)
      }
      release()
      await expect(circuit).toHaveAttribute('data-state', 'running')
      expect(await geometry()).toEqual(before)
      if (drawerOpen) {
        await page.keyboard.press('Escape')
        await expect(drawer).toBeHidden()
        await expect(button).toBeFocused()
        expect(await geometry()).toEqual(before)
      }
    } finally {
      release()
    }
  })
}
