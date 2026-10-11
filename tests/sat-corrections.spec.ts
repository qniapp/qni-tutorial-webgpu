import {expect,test} from '@playwright/test'
import original from './fixtures/sat-circuit-original.json' with {type:'json'}
import fixed from './fixtures/sat-circuit-fixed.json' with {type:'json'}
import approved from './fixtures/sat-approved-text.json' with {type:'json'}
for (const width of [390,1440]) test(`SAT approved ten-column diff and state display at ${width}`,async({page})=>{
  expect(fixed.cols).toHaveLength(125)
  const indices=[38,39,40,41,42,103,104,105,106,107]
  expect(original.cols.flatMap((col,i)=>JSON.stringify(col)===JSON.stringify(fixed.cols[i])?[]:[i])).toEqual(indices)
  const expected=structuredClone(original)
  for(const i of indices){const col=expected.cols[i];if(col.length===3)col.push(1);[col[2],col[3]]=[col[3],col[2]]}
  expect(fixed).toEqual(expected)
  await page.setViewportSize({width,height:1000})
  await page.goto('/qni-tutorial-webgpu/sat/')
  expect(await page.locator('qni-webgpu-circuit').getAttribute('circuit')).not.toBeNull()
  expect(JSON.parse((await page.locator('qni-webgpu-circuit').getAttribute('circuit'))!)).toEqual(fixed)
  await expect(page.locator('qni-webgpu-circuit')).toHaveAttribute('palette','[]')
  await expect(page.locator('qni-webgpu-circuit')).toHaveAttribute('max-wire-count','1')
  const text=await page.locator('.content-with-margin').evaluate(root=>{const walk=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);let text='',node;while(node=walk.nextNode()){if(!node.parentElement!.closest('footer,script,style,mjx-container,orbit-reviewarea,qni-webgpu-circuit,[data-original-image]')&&!(node.parentElement!.closest('a')&&node.textContent!.replace(/\s+/g,'')==='Qniで開く'))text+=node.textContent}return text.replace(/\s+/g,'').normalize('NFC')})
  expect(text).toBe(approved.text)
  const panel=page.locator('[data-sat-states]')
  await expect(panel.locator('qubit-circle')).toHaveCount(32)
  await expect(panel.locator('qubit-circle').nth(8)).toHaveAttribute('data-amplitude','-0.25')
  await expect(panel.locator('qubit-circle').nth(8)).toHaveAttribute('data-qubit-count','14')
  await panel.locator('input').focus();await panel.locator('input').press('End')
  await expect(panel.locator('qubit-circle').last()).toHaveAttribute('data-ket','16383')
  await expect(panel.locator('qubit-circle').last()).toHaveAttribute('data-amplitude','0')
  await page.evaluate(()=>document.fonts.ready)
  await expect.poll(()=>page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(width)
})
