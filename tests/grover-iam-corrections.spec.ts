import {expect,test} from '@playwright/test'
import original from './fixtures/grover-iam-circuits-original.json' with {type:'json'}
import fixed from './fixtures/grover-iam-circuits-fixed.json' with {type:'json'}
import satOriginal from './fixtures/sat-circuit-original.json' with {type:'json'}
import satFixed from './fixtures/sat-circuit-fixed.json' with {type:'json'}
import approved from './fixtures/grover-iam-approved-text.json' with {type:'json'}
import raw from './fixtures/grover-iam-source-prefix.json' with {type:'json'}
for(const width of [390,1440]) test(`Grover inversion applies exactly the approved third-circuit diff at ${width}`,async({page})=>{
  expect(raw.grover.slice(0,raw.grover.indexOf(',[1],["{折り返し変換"]'))+']}').toBe(raw.sat)
  expect(original[2].cols).toHaveLength(134)
  expect(original[2].cols.slice(0,125)).toEqual(satOriginal.cols)
  expect(fixed[2].cols.slice(0,125)).toEqual(satFixed.cols)
  expect(fixed[0]).toEqual(original[0]);expect(fixed[1]).toEqual(original[1])
  const indices=[38,39,40,41,42,103,104,105,106,107]
  expect(original[2].cols.flatMap((col,i)=>JSON.stringify(col)===JSON.stringify(fixed[2].cols[i])?[]:[i])).toEqual(indices)
  expect(fixed[2].cols.slice(125)).toEqual(original[2].cols.slice(125))
  const expected=structuredClone(original)
  for(const i of indices){const col=expected[2].cols[i];if(col.length===3)col.push(1);[col[2],col[3]]=[col[3],col[2]]}
  expect(fixed).toEqual(expected)
  await page.setViewportSize({width,height:1100});await page.goto('/qni-tutorial-webgpu/grover_iam/')
  expect(await page.locator('qni-webgpu-circuit').evaluateAll(es=>es.map(e=>JSON.parse(e.getAttribute('circuit')!)))).toEqual(fixed)
  for(const e of await page.locator('qni-webgpu-circuit').all()){await expect(e).toHaveAttribute('palette','[]');await expect(e).toHaveAttribute('max-wire-count','1')}
  await page.waitForFunction(()=>document.documentElement.dataset.mathjax==='ready')
  const text=await page.locator('.content-with-margin').evaluate(root=>{const walk=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);let text='',node;while(node=walk.nextNode()){if(!node.parentElement!.closest('footer,script,style,mjx-container,orbit-reviewarea,qni-webgpu-circuit,[data-original-image]')&&!(node.parentElement!.closest('a')&&node.textContent!.replace(/\s+/g,'')==='Qniで開く'))text+=node.textContent}return text.replace(/\s+/g,'').normalize('NFC')})
  expect(text).toBe(approved.text)
  await page.evaluate(()=>customElements.whenDefined('qubit-circle'))
  const diagram=page.locator('[data-amplification-diagram]');await expect(diagram.locator('qubit-circle')).toHaveCount(32)
  const marked=diagram.locator('qubit-circle').first();await marked.focus();await marked.press('Enter')
  await expect(marked).toHaveAttribute('data-amplitude','-0.25');await expect(marked).toHaveAttribute('aria-label',/0000/)
  await page.evaluate(()=>document.fonts.ready);await expect.poll(()=>page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(width)
})
