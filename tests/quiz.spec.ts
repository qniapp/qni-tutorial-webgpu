import { expect, test, type Page } from '@playwright/test'

// Every page that had Orbit prompts, and how many.
const pages: Record<string, number> = {
  '': 9, qpu: 4, what_qpu_do_faster: 12, p_bit: 10, superposition: 7, qubit: 6, phase: 3, circle_notation: 8,
  cpu_vs_qpu_operations: 8, write_operation: 4, x_gate: 9, h_gate: 7, phase_gate: 4, measurement_operation: 8,
  quantum_circuit: 6, gate_combination: 8,
}
// These only loaded the Orbit script.
const scriptOnly = ['bb84_circuit', 'multi_qubit_phase_gate', 'partial_measurement']
const image = '<svg xmlns="http://www.w3.org/2000/svg" width="320" height="180"><rect width="320" height="180" fill="#ccc"/></svg>'

async function open(page: Page, slug: string) {
  const orbit: string[] = []
  page.on('request', request => { if (request.url().includes('withorbit.com')) orbit.push(request.url()) })
  await page.route('https://qniapp.github.io/qni/images/**', route => route.fulfill({ contentType: 'image/svg+xml', body: image }))
  await page.goto(`/qni-tutorial-webgpu/${slug ? `${slug}/` : ''}`)
  if (await page.locator('#MathJax-script').count()) await page.locator('html[data-mathjax="ready"]').waitFor({ state: 'attached' })
  return orbit
}

for (const [slug, count] of Object.entries(pages)) {
  test(`${slug || 'index'} renders ${count} native quiz cards without Orbit`, async ({ page }) => {
    const orbit = await open(page, slug)
    await expect(page.locator('orbit-prompt > .orbit-quiz-card')).toHaveCount(count)
    await expect(page.locator('.orbit-quiz-card[data-state="unanswered"]')).toHaveCount(count)
    await expect(page.getByRole('button', { name: '答えを見る' })).toHaveCount(count)
    await expect(page.locator('.orbit-quiz-answer:visible, .orbit-quiz-blank-answer:visible')).toHaveCount(0)
    expect(await page.locator('main mjx-merror').count()).toBe(0)
    // Prompts render the original attribute text (Markdown/TeX markers aside).
    const mismatches = await page.locator('orbit-prompt').evaluateAll(prompts => prompts.flatMap(prompt => {
      const plain = (value: string | null) => (value ?? '').replace(/\$\$[\s\S]*?\$\$|\$[^$]*\$|\*|[{}]/g, '').replace(/\s+/g, '')
      const shown = (node: Element | null) => {
        const clone = node?.cloneNode(true) as Element | undefined
        clone?.querySelectorAll('mjx-container, .orbit-quiz-blank-placeholder, .orbit-quiz-attachments').forEach(e => e.remove())
        return (clone?.textContent ?? '').replace(/\s+/g, '')
      }
      const question = plain(prompt.getAttribute('cloze') ?? prompt.getAttribute('question'))
      const answer = plain(prompt.getAttribute('answer'))
      const ok = shown(prompt.querySelector('.orbit-quiz-question')) === question
        && (prompt.hasAttribute('cloze') || shown(prompt.querySelector('.orbit-quiz-answer')) === answer)
      return ok ? [] : [question]
    }))
    expect(mismatches).toEqual([])
    expect(orbit).toEqual([])
  })
}

for (const slug of scriptOnly) {
  test(`${slug} no longer requests the Orbit script`, async ({ page }) => {
    expect(await open(page, slug)).toEqual([])
    await expect(page.locator('script[src*="withorbit"]')).toHaveCount(0)
  })
}

test('reveal, self-grade, retry and reload reset on h_gate', async ({ page }) => {
  await open(page, 'h_gate')
  const card = page.locator('orbit-prompt').nth(3).locator('.orbit-quiz-card')
  const reveal = card.locator('.orbit-quiz-reveal')
  await expect(reveal).toHaveAccessibleName('答えを見る')
  await expect(card.getByRole('group')).toHaveCount(0)
  await expect(page.getByRole('group', { name: 'H ゲートを適用するとどうなる?' })).toHaveCount(2)
  await expect(card.locator('.orbit-quiz-question img')).toBeVisible()
  await expect(card.locator('.orbit-quiz-answer')).toBeHidden()
  await expect(reveal).toHaveAttribute('aria-expanded', 'false')

  await reveal.click()
  await expect(card).toHaveAttribute('data-state', 'revealed')
  await expect(card.locator('.orbit-quiz-answer')).toBeVisible()
  await expect(card.locator('.orbit-quiz-answer')).toBeFocused()
  await expect(card.locator('.orbit-quiz-answer img')).toBeVisible()
  await expect(reveal).toBeHidden()
  await expect(reveal).toHaveAttribute('aria-expanded', 'true')
  await expect(card.getByRole('status')).toHaveText('')

  await card.getByRole('button', { name: '正解', exact: true }).click()
  await expect(card).toHaveAttribute('data-state', 'correct')
  await expect(card.getByRole('status')).toHaveText('正解')
  await expect(card.locator('.orbit-quiz-status svg')).toHaveCount(1)
  await expect(card.locator('.orbit-quiz-answer')).toBeVisible()
  await expect(card.getByRole('button', { name: 'やり直す' })).toBeFocused()
  await expect(card.getByRole('button', { name: /^(正解|不正解)$/ })).toHaveCount(0)

  await card.getByRole('button', { name: 'やり直す' }).click()
  await expect(card).toHaveAttribute('data-state', 'unanswered')
  await expect(card.getByRole('status')).toHaveText('')
  await expect(card.locator('.orbit-quiz-answer')).toBeHidden()
  await expect(reveal).toBeFocused()

  await reveal.click()
  await card.getByRole('button', { name: '不正解' }).click()
  await expect(card).toHaveAttribute('data-state', 'incorrect')
  await expect(card.getByRole('status')).toHaveText('不正解')
  // Other cards are independent.
  await expect(page.locator('.orbit-quiz-card[data-state="unanswered"]')).toHaveCount(6)

  await page.reload()
  await expect(page.locator('.orbit-quiz-card[data-state="unanswered"]')).toHaveCount(7)
})

test('keyboard only: Enter reveals, Tab reaches the grades, Space grades', async ({ page }) => {
  await open(page, 'h_gate')
  const card = page.locator('orbit-prompt').first().locator('.orbit-quiz-card')
  const reveal = card.getByRole('button', { name: '答えを見る' })
  await reveal.focus()
  await page.keyboard.press('Enter')
  await expect(card.locator('.orbit-quiz-answer')).toBeFocused()
  await page.keyboard.press('Tab')
  const correct = card.getByRole('button', { name: '正解', exact: true })
  await expect(correct).toBeFocused()
  expect(await correct.evaluate(e => { const s = getComputedStyle(e); return [s.outlineStyle, s.outlineWidth, s.outlineColor] })).toEqual(['solid', '2px', 'rgb(32, 94, 166)'])
  await page.keyboard.press('Tab')
  await expect(card.getByRole('button', { name: '不正解' })).toBeFocused()
  await page.keyboard.press('Shift+Tab')
  await page.keyboard.press('Space')
  await expect(card.getByRole('status')).toHaveText('正解')
  await page.keyboard.press('Enter')
  await expect(card).toHaveAttribute('data-state', 'unanswered')
  await expect(reveal).toBeFocused()
})

test('cloze blanks hide every deletion until revealed', async ({ page }) => {
  await open(page, 'h_gate')
  const card = page.locator('orbit-prompt[cloze]').locator('.orbit-quiz-card')
  await expect(card.locator('.orbit-quiz-blank')).toHaveCount(2)
  await expect(card.locator('.orbit-quiz-answer')).toHaveCount(0)
  const question = card.locator('.orbit-quiz-question')
  expect(await question.innerText()).not.toContain('逆演算')
  // Screen readers get a hidden label per blank; it disappears once revealed.
  await expect(question).toContainText('空欄')
  await expect(card.getByText('それ自身を打ち消す')).toBeHidden()
  await card.getByRole('button', { name: '答えを見る' }).click()
  await expect(question).toBeFocused()
  expect((await question.innerText()).replace(/\s+/g, '')).toBe('Hゲートはそれ自身を打ち消す効果を持っていることから、Hゲートはそれ自身の逆演算であると言う')
  expect(await card.locator('.orbit-quiz-blank').first().evaluate(e => getComputedStyle(e).fontWeight)).toBe('700')
  await card.getByRole('button', { name: '不正解' }).click()
  await expect(card.getByRole('status')).toHaveText('不正解')
})

test('TeX and Markdown in prompts', async ({ page }) => {
  await open(page, 'superposition')
  const cloze = page.locator('orbit-prompt').nth(1).locator('.orbit-quiz-card')
  await expect(cloze.locator('.orbit-quiz-blank mjx-container')).toHaveCount(1)
  await expect(cloze.locator('.orbit-quiz-blank mjx-container')).toBeHidden()
  await cloze.getByRole('button', { name: '答えを見る' }).click()
  await expect(cloze.locator('.orbit-quiz-blank mjx-container')).toBeVisible()
  await expect(page.locator('orbit-prompt').last().locator('.orbit-quiz-answer mjx-container')).toHaveCount(2)
  await open(page, 'what_qpu_do_faster')
  await expect(page.locator('orbit-prompt').nth(4).locator('.orbit-quiz-question mjx-container[display="true"]')).toHaveCount(1)
  await open(page, '')
  await expect(page.locator('orbit-prompt').first().locator('.orbit-quiz-question strong')).toHaveText('量子コンピュータ')
  await expect(page.locator('orbit-prompt').last().locator('.orbit-quiz-question em')).toHaveText('Qni')
})

for (const width of [1440, 390]) {
  test(`quiz layout at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 })
    await open(page, 'h_gate')
    const area = page.locator('orbit-reviewarea')
    const paragraph = await page.locator('.content-with-margin > p').first().boundingBox()
    const box = await area.boundingBox()
    expect(Math.round(box!.width)).toBe(Math.round(paragraph!.width))
    expect(await area.evaluate(e => ({ background: getComputedStyle(e).backgroundColor, padding: getComputedStyle(e).padding, radius: getComputedStyle(e).borderRadius })))
      .toEqual({ background: 'rgb(225, 236, 235)', padding: width === 390 ? '12px' : '16px', radius: '12px' })
    const card = page.locator('orbit-prompt').first().locator('.orbit-quiz-card')
    expect(await card.evaluate(e => { const s = getComputedStyle(e); return [s.padding, s.borderColor, s.borderRadius, s.backgroundColor, s.fontSize, s.lineHeight] }))
      .toEqual([width === 390 ? '12px 16px' : '16px 20px', 'rgb(218, 216, 206)', '8px', 'rgb(255, 252, 240)', '16px', '28px'])
    const reveal = card.getByRole('button', { name: '答えを見る' })
    expect(await reveal.evaluate(e => { const s = getComputedStyle(e); return [s.backgroundColor, s.color, s.fontSize, s.fontWeight, s.borderRadius] }))
      .toEqual(['rgb(32, 94, 166)', 'rgb(255, 252, 240)', '14px', '600', '6px'])
    expect((await reveal.boundingBox())!.height).toBe(width === 390 ? 44 : 40)
    await reveal.click()
    const correct = await card.getByRole('button', { name: '正解', exact: true }).boundingBox()
    const incorrect = await card.getByRole('button', { name: '不正解' }).boundingBox()
    expect(correct!.y).toBe(incorrect!.y)
    if (width === 390) expect(Math.abs(correct!.width - incorrect!.width)).toBeLessThan(1)
    await page.locator('.orbit-quiz-reveal:visible').evaluateAll(es => es.forEach(e => (e as HTMLElement).click()))
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width)
    for (const image of await area.locator('img').all()) expect((await image.boundingBox())!.width).toBeLessThanOrEqual(box!.width)
  })
}
