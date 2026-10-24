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
      '電磁気学に基づいたトランジスタなどの電子回路',
      '原子や電子、光子の量子的な状態をビットとして使います',
      '1,000 回ほどの検索で見つかります',
      '桁違いに速く',
      '十分な規模の誤り耐性量子コンピュータが実現すれば、現在広く使われている公開鍵暗号は破られてしまいます',
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
    expect(text).not.toMatch(/シミューレータ|基いた|アイディア|ロブ・グローバー|1 問 1 答形式|オープンソースな|株価の下落|指数関数的に速く|約 1,000 回|暗号解読者を阻止できません/)
    const feynmanNote = page.locator('#margin-note-feynman + .margin-note')
    await expect(feynmanNote).toContainText('International Journal of Theoretical Physics 21, 467–488 (1982), p. 486（意訳）')
    await expect(feynmanNote.locator('a')).toHaveAttribute('href', 'https://doi.org/10.1007/BF02650179')
    await expect(page.locator('img[src$="bit_capacitor_vs_quantum.svg"]')).toHaveAttribute('alt', /ビットの実装例であるコンデンサ/)
    await expect(page.locator('img[src$="quantum_search_vs_linear.svg"]')).toHaveAttribute('alt', /1,000 回ほどの検索/)
    await expect(page.locator('.page-title-block .lede')).toHaveText('実践で学ぶ量子コンピュータプログラミング')
    await expect(page.locator('main h2')).toHaveText([
      '量子コンピュータとは',
      'なぜ難しいと思われているか',
      'このチュートリアルの特長',
      'フィードバックを歓迎します',
    ])
    await expect(page.locator('main h3')).toHaveText([
      '複雑な数学なしで学べる', 'Qni で実験できる', 'クイズで定着する',
    ])
    const lead = page.locator('.content-with-margin > p').first()
    await expect(lead).toHaveText('複雑な数学なしで、量子コンピュータプログラミングを学びましょう。Qni で実験しながら動きを確かめ、クイズで学んだことを定着させます。')
    expect(await lead.evaluate(element => {
      const heading = element.parentElement?.querySelector('h2')
      return !!heading && !!(element.compareDocumentPosition(heading) & Node.DOCUMENT_POSITION_FOLLOWING)
    })).toBe(true)
    expect(text).toContain('電卓がわりにも使えます')
    expect(text).not.toContain('電卓がわりとしてちょっとした計算にも役立ちます')
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
