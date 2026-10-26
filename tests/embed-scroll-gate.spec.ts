import { expect, test } from '@playwright/test'

// Real pinned bundle: its canvas listeners cancel wheel events, so the host
// must keep them away until the reader activates the embed.
test('wheel over an inactive embed scrolls the page; a click hands it to the embed', async ({ page }) => {
  await page.route('https://js.withorbit.com/**', route => route.abort())
  await page.goto('/qni-tutorial-webgpu/')
  const adapter = await page.evaluate(async () => {
    const gpu = (navigator as Navigator & { gpu?: { requestAdapter(): Promise<unknown> } }).gpu
    return !!(gpu && await gpu.requestAdapter())
  })
  test.skip(!adapter, 'Headless Chromium cannot acquire a WebGPU adapter on this machine')

  const embed = page.locator('qni-webgpu-circuit')
  const canvas = embed.locator('canvas')
  const scrollY = () => page.evaluate(() => Math.round(window.scrollY))
  const bringEmbedToTop = () => embed.evaluate(element => {
    window.scrollTo(0, window.scrollY + element.getBoundingClientRect().top - 100)
  })
  const cols = () => embed.evaluate(element =>
    JSON.parse((element as HTMLElement & { runner: { circuitJSON(): string } }).runner.circuitJSON()).cols)
  await bringEmbedToTop()
  await expect(embed).toHaveAttribute('data-state', 'running', { timeout: 60_000 })
  let box = (await canvas.boundingBox())!

  // Over the state panel, where an active embed zooms instead of scrolling.
  const overPanel = () => page.mouse.move(box.x + box.width / 2, box.y + box.height * 0.75)
  await overPanel()
  const before = await scrollY()
  await page.mouse.wheel(0, 300)
  await expect.poll(scrollY).toBe(before + 300)
  await expect(embed).not.toHaveAttribute('data-active')
  await expect(embed.locator('.activation-hint')).toHaveClass(/visible/)

  await bringEmbedToTop()
  box = (await canvas.boundingBox())!
  await page.mouse.click(box.x + box.width - 40, box.y + 160) // Empty canvas area
  await expect(embed).toHaveAttribute('data-active', '')
  await expect(embed.locator('.activation-hint')).not.toHaveClass(/visible/)
  await overPanel()
  const active = await scrollY()
  await page.mouse.wheel(0, 300)
  await page.waitForTimeout(500)
  expect(await scrollY()).toBe(active)

  // The editor still works: drag the H gate onto the toolbar to delete it.
  expect(await cols()).toContainEqual(['H'])
  await page.mouse.move(box.x + 144, box.y + 274)
  await page.mouse.down()
  await page.mouse.move(box.x + 144, box.y + 15, { steps: 20 })
  await page.mouse.up()
  await expect.poll(cols).not.toContainEqual(['H'])

  // A click outside releases the embed and the wheel scrolls the page again.
  await page.mouse.click(box.x + box.width + 100, box.y + box.height + 100)
  await expect(embed).not.toHaveAttribute('data-active')
  await overPanel()
  const released = await scrollY()
  await page.mouse.wheel(0, 300)
  await expect.poll(scrollY).toBe(released + 300)
})

test('keyboard focus activates the embed and moving focus away releases it', async ({ page }) => {
  await page.route('**/qni-embed.mjs', route => route.fulfill({
    contentType: 'text/javascript',
    body: 'export async function startEmbed() { return { destroy() {}, circuitJSON() { return "{\\"cols\\":[]}" }, preferredHeight() { return 300 } } }',
  }))
  await page.route('https://js.withorbit.com/**', route => route.abort())
  await page.goto('/qni-tutorial-webgpu/')
  const embed = page.locator('qni-webgpu-circuit')
  await embed.locator('canvas').focus()
  await expect(embed).toHaveAttribute('data-active', '')
  await page.locator('a').first().focus()
  await expect(embed).not.toHaveAttribute('data-active')
})
