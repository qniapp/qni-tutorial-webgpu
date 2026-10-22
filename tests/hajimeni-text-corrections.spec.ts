import { expect, test } from '@playwright/test'
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

test('all source pages and navigation use the approved Grover spelling', () => {
  function check(directory: string) {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const path = join(directory, entry.name)
      if (entry.isDirectory()) check(path)
      else expect(readFileSync(path, 'utf8'), path).not.toMatch(/グローヴァー|グロヴァー/)
    }
  }
  check('src')
})

for (const width of [390, 1440]) {
  test(`introduction has corrected wording without Japanese sentence spaces at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    await page.goto('/qni-tutorial-webgpu/')
    const paragraphs = await page.locator('main p').allTextContents()
    const text = paragraphs.join('\n').replace(/\s+/g, ' ')
    for (const expected of [
      '量子コンピュータのアイデア',
      '電磁気学に基づいた基本素子',
      'あってもいいのではないでしょうか?',
      'ラブ・グローバー',
      '特定の数学問題 (長さ数百桁の数の因数分解など) を',
      '一問一答形式',
      'オープンソースの量子コンピュータシミュレータ',
      '。そのきっかけ',
      '計算の高速化です。量子の不思議な振舞い',
      'John Preskill,',
      'Quantum computing 40 years later',
      'Lov K. Grover,',
      'Quantum Computer',
      'Python や JavaScript',
    ]) expect(text).toContain(expected)
    expect(text).not.toMatch(/シミューレータ|基いた|アイディア|ロブ・グローバー|1 問 1 答形式|オープンソースな/)
    // A floated note is a separate passage: do not concatenate its final
    // sentence with the surrounding paragraph when checking sentence spacing.
    const passages = await page.locator('main p, main .margin-note').evaluateAll(elements => elements.map(element => {
      const copy = element.cloneNode(true) as HTMLElement
      copy.querySelectorAll('.margin-note').forEach(note => note.remove())
      return copy.textContent ?? ''
    }))
    for (const passage of passages) expect(passage).not.toMatch(/。[\t\n\r ]+[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]/u)
    await expect(page.locator('.sidebar summary').filter({ hasText: 'グローバー探索' })).toHaveCount(1)
  })
}
