import { expect, test } from '@playwright/test'

for (const width of [1440, 390]) {
  test(`original H positions and unboxed figures at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 })
    await page.goto('/qni-tutorial-webgpu/h_gate/')
    await expect(page.locator('qw-h-gate')).toHaveCount(19)
    await expect(page.locator('p qw-h-gate')).toHaveCount(12)
    await expect(page.locator('.qc-operation qw-h-gate')).toHaveCount(7)
    expect(await page.locator('.qc-operation qw-h-gate').evaluateAll(es => es.every(e => e.getBoundingClientRect().width === 24))).toBe(true)
    expect(await page.locator('.qc-transition').first().evaluate(e => getComputedStyle(e).justifyContent)).toBe('center')
    await expect(page.locator('qw-qubit-circle')).toHaveCount(24)
    await expect(page.locator('.static-diagram')).toHaveCount(0)
    await expect(page.locator('body')).not.toContainText('H|0⟩ =')
    await expect(page.locator('body')).not.toContainText('H|1⟩ =')
    expect(await page.locator('.qc-figure').first().evaluate(e => ({
      background: getComputedStyle(e).backgroundColor,
      border: getComputedStyle(e).borderWidth,
      overflow: document.documentElement.scrollWidth > innerWidth,
    }))).toEqual({ background: 'rgba(0, 0, 0, 0)', border: '0px', overflow: false })
  })
}

test('SVG outside the outline is transparent while a zero circle retains paper inside', async ({ page }) => {
  await page.goto('/qni-tutorial-webgpu/stress-qubit-circle/?n=200')
  await page.waitForFunction(() => document.documentElement.dataset.qcReady === '200')
  const result = await page.locator('qw-qubit-circle').first().evaluate(async e => {
    const svg = e.querySelector('svg')!, clone = svg.cloneNode(true) as SVGElement
    clone.setAttribute('width', '34'); clone.setAttribute('height', '34')
    Array.from(clone.children).forEach((child, i) => {
      const style = getComputedStyle(svg.children[i]!)
      child.setAttribute('fill', style.fill); child.setAttribute('stroke', style.stroke)
      child.setAttribute('style', `display:${style.display}`)
    })
    const image = new Image(), url = URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(clone)], { type: 'image/svg+xml' }))
    try {
      image.src = url; await image.decode()
      const canvas = document.createElement('canvas'); canvas.width = canvas.height = 34
      const ctx = canvas.getContext('2d')!; ctx.drawImage(image, 0, 0)
      return { corner: Array.from(ctx.getImageData(0, 0, 1, 1).data), center: Array.from(ctx.getImageData(17, 17, 1, 1).data), background: getComputedStyle(svg).backgroundColor }
    } finally { URL.revokeObjectURL(url) }
  })
  expect(result).toEqual({ corner: [0, 0, 0, 0], center: [255, 252, 240, 255], background: 'rgba(0, 0, 0, 0)' })
})
