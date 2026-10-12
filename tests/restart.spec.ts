import { expect, test } from '@playwright/test'

for (const key of ['Enter', 'Space']) {
  test(`real status-bar ${key} action restarts the tutorial runner`, async ({ page }) => {
    await page.goto('/qni-tutorial-webgpu/h_gate/')
    const adapter = await page.evaluate(async () => {
      const gpu = (navigator as Navigator & { gpu?: { requestAdapter(): Promise<unknown> } }).gpu
      return !!(gpu && await gpu.requestAdapter())
    })
    test.skip(!adapter, 'WebGPU adapter is unavailable')
    const embed = page.locator('qni-webgpu-circuit')
    await embed.evaluate(e => e.setAttribute('run-button', ''))
    await page.waitForFunction(() => document.querySelector<HTMLElement>('qni-webgpu-circuit')?.dataset.state === 'running')
    await embed.evaluate(e => {
      e.setAttribute('data-restart-observed', 'false')
      const observer = new MutationObserver(records => {
        if (records.some(record => record.oldValue === 'running')) {
          e.setAttribute('data-restart-observed', 'true')
          observer.disconnect()
        }
      })
      observer.observe(e, { attributes: true, attributeFilter: ['data-state'], attributeOldValue: true })
    })
    // Right after `running` the runner may not handle keys yet; the Orbit
    // script's load used to hide this race, so retry until the restart shows.
    await expect(async () => {
      await embed.locator('canvas').focus()
      // The restart action is the last focusable egui widget.
      await page.keyboard.press('Shift+Tab')
      await page.waitForTimeout(100)
      await page.keyboard.press(key)
      await page.waitForFunction(() => {
        const e = document.querySelector<HTMLElement>('qni-webgpu-circuit')!
        return e.dataset.restartObserved === 'true' && e.dataset.state === 'running'
      }, null, { timeout: 3_000 })
    }).toPass({ timeout: 30_000 })
    expect(await embed.evaluate(e => ({
      circuit: e.getAttribute('circuit'),
      externalButtons: e.shadowRoot!.querySelectorAll('button').length,
    }))).toEqual({ circuit: '{"cols":[["|0>"]]}', externalButtons: 0 })
  })
}
