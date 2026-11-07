import { expect, test } from '@playwright/test'

for (const width of [390, 1280]) {
  test(`BB84 review prompts preserve the Orbit contract at ${width}px`, async ({ page }) => {
    // Check the host markup independently of third-party service availability.
    await page.route('https://js.withorbit.com/**', route => route.abort())
    await page.setViewportSize({ width, height: 900 })
    await page.goto('/qni-tutorial-webgpu/bb84_protocol/')

    const reviews = page.locator('orbit-reviewarea')
    await expect(reviews).toHaveCount(2)
    await expect(reviews.nth(0).locator('orbit-prompt')).toHaveCount(5)
    await expect(reviews.nth(1).locator('orbit-prompt')).toHaveCount(3)
    await expect(page.locator('script[src="https://js.withorbit.com/orbit-web-component.js"]')).toHaveCount(1)

    const prompts = await page.locator('orbit-prompt').evaluateAll(elements => elements.map(element => ({
      question: element.getAttribute('question'),
      answer: element.getAttribute('answer'),
      attributes: element.getAttributeNames().filter(name => !name.startsWith('data-astro-cid-')).sort(),
    })))
    expect(new Set(prompts.map(prompt => prompt.question)).size).toBe(8)
    for (const prompt of prompts) {
      expect(prompt.attributes).toEqual(['answer', 'question'])
      expect(prompt.question).toBeTruthy()
      expect(prompt.answer).toBeTruthy()
      expect(`${prompt.question}${prompt.answer}`).not.toMatch(/[\u2460-\u2473]/u)
    }
    expect(prompts[1].answer).toBe('50% です。')
    expect(prompts[6].question).toContain('得た状態をそのままボブに送り直す')
    expect(prompts[6].answer).toMatch(/^25%/)

    const prose = await page.locator('.content-with-margin > p').last().boundingBox()
    expect(prose).not.toBeNull()
    for (const review of await reviews.all()) {
      const box = await review.boundingBox()
      expect(box).not.toBeNull()
      expect(box!.x).toBeCloseTo(prose!.x, 1)
      expect(box!.width).toBeCloseTo(prose!.width, 1)
    }
  })
}
