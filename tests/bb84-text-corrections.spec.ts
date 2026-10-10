import { expect, test } from '@playwright/test'
import corrections from './fixtures/bb84-text-corrections.json' with { type: 'json' }

declare global {
  interface Window {
    MathJax: { startup: { document: { math: Iterable<{ typesetRoot: Element; math: string; display: boolean }> } } }
  }
}

const normalize = (value: string) => value.replace(/\s+/g, '').normalize('NFC')
const prose = (value: string) => normalize(value.replace(/<[^>]+>/g, ''))

for (const fixture of corrections.pages) {
  for (const width of [390, 1440]) {
    test(`${fixture.slug}: whitelist-only text/TeX diff, errors 0 and no scrollbars at ${width}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 1000 })
      const errors: string[] = []
      page.on('pageerror', error => errors.push(error.message))
      page.on('console', message => { if (message.type() === 'error') errors.push(message.text()) })
      await page.goto(`/qni-tutorial-webgpu/${fixture.slug}/`)
      await page.waitForFunction(() => document.documentElement.dataset.mathjax === 'ready')
      await page.waitForFunction(() => [...document.querySelectorAll<HTMLElement>('qni-webgpu-circuit')].every(element => element.dataset.state === 'running'))
      const actual = await page.evaluate(() => {
        const root = document.querySelector('.content-with-margin')!
        const walk = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
        let text = '', node: Node | null
        while ((node = walk.nextNode())) {
          if (!node.parentElement!.closest('footer,script,style,mjx-container,orbit-reviewarea,quantum-simulator,quantum-circuit,qni-webgpu-circuit,[data-original-image]')) {
            if (!(node.parentElement!.closest('a') && node.textContent!.replace(/\s+/g, '') === 'Qniで開く')) text += node.textContent
          }
        }
        const normalize = (value: string) => value.replace(/\s+/g, '').normalize('NFC')
        const math = [...window.MathJax.startup.document.math].filter(item => root.contains(item.typesetRoot) && !item.typesetRoot.closest('[data-original-image]')).map(item => ({ tex: normalize(item.math), display: item.display }))
        const scrollbars: string[] = []
        const inspect = (parent: Element | ShadowRoot) => {
          for (const element of parent.children) {
            const style = getComputedStyle(element), rect = element.getBoundingClientRect()
            if (rect.width && rect.height && element.clientWidth && element.clientHeight && style.visibility !== 'hidden' && style.display !== 'none') {
              if ((element.scrollWidth > element.clientWidth && ['auto', 'scroll'].includes(style.overflowX)) || (element.scrollHeight > element.clientHeight && ['auto', 'scroll'].includes(style.overflowY))) scrollbars.push(element.localName)
            }
            inspect(element)
            if (element.shadowRoot) inspect(element.shadowRoot)
          }
        }
        inspect(root)
        return { text: normalize(text), math, scrollbars, documentOverflow: document.documentElement.scrollWidth > innerWidth }
      })
      let expected = fixture.baselineText
      for (const edit of fixture.edits) {
        expect(expected.split(prose(edit.before))).toHaveLength(2)
        expected = expected.replace(prose(edit.before), prose(edit.after))
      }
      expect(actual.text).toBe(expected)
      expect(actual.math).toEqual([...fixture.baselineMath, ...fixture.addedMath])
      expect(actual.scrollbars).toEqual([])
      expect(actual.documentOverflow).toBe(false)
      expect(errors).toEqual([])
    })
  }
}
