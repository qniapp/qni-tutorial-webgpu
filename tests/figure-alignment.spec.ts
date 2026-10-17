import { expect, test } from '@playwright/test'

const explorers = {
  amplitude_probability: 'figure[data-complex-plane], amplitude-radius-explorer, ry-explorer',
  global_relative_phase: 'phase-comparison-explorer',
  basis_inner_product: 'figure[data-basis-projection], figure[data-inner-product]',
  matrix_adjoint: 'matrix-vector-explorer, adjoint-builder',
  unitary_observable: 'unitary-matrix-tester, observable-expectation-explorer',
  tensor_product_state: 'tensor-product-explorer, tensor-factors-explorer',
  entangled_state: 'entangled-state-explorer',
}

for (const width of [1280, 390, 700]) {
  test(`phase circle figures are centered in the prose column at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    await page.goto('/qni-tutorial-webgpu/phase/')
    await page.evaluate(async () => {
      await customElements.whenDefined('qubit-circle')
      await document.fonts.ready
    })
    const groups = page.locator('.circle-figure')
    await expect(groups).toHaveCount(2)
    for (let i = 0; i < 2; i++) {
      const gaps = await groups.nth(i).evaluate(group => {
        const prose = document.querySelector('.content-with-margin > p')!.getBoundingClientRect()
        const circles = [...group.querySelectorAll('qubit-circle')].map(circle => circle.getBoundingClientRect())
        return {
          count: circles.length,
          left: Math.min(...circles.map(r => r.left)) - prose.left,
          right: prose.right - Math.max(...circles.map(r => r.right)),
        }
      })
      expect(gaps.count).toBe(i === 0 ? 2 : 4)
      expect(gaps.left).toBeGreaterThan(0)
      expect(Math.abs(gaps.left - gaps.right)).toBeLessThanOrEqual(1)
    }
  })

  test(`phase logic static diagrams are centered and fit the prose at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    await page.goto('/qni-tutorial-webgpu/phase_logic/')
    await page.evaluate(async () => {
      await customElements.whenDefined('qubit-circle')
      await customElements.whenDefined('fit-content')
      await document.fonts.ready
    })
    const diagrams = page.locator('fit-content [data-fit-content]')
    await expect(diagrams).toHaveCount(28)
    await expect.poll(async () => diagrams.evaluateAll(elements => {
      const prose = document.querySelector('.content-with-margin > p')!.getBoundingClientRect()
      return elements.every(element => {
        const rect = element.getBoundingClientRect()
        return rect.left >= prose.left - 1 && rect.right <= prose.right + 1
          && Math.abs((rect.left + rect.right) - (prose.left + prose.right)) <= 2
      })
    })).toBe(true)
  })
}

for (const width of [1280, 390]) {
  test(`math explorers retain prose-left alignment at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    for (const [slug, selector] of Object.entries(explorers)) {
      await page.goto(`/qni-tutorial-webgpu/${slug}/`)
      const figures = page.locator(selector)
      expect(await figures.count(), slug).toBeGreaterThan(0)
      for (const figure of await figures.all()) {
        const position = await figure.evaluate(element => ({
          left: element.getBoundingClientRect().left,
          proseLeft: document.querySelector('.content-with-margin > p')!.getBoundingClientRect().left,
        }))
        expect(Math.abs(position.left - position.proseLeft), slug).toBeLessThanOrEqual(1)
        expect(position.left, slug).toBe(width === 1280 ? 280 : 16)
      }
    }
  })
}
