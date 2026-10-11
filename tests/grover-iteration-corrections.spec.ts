import {expect,test} from '@playwright/test'
import source from './fixtures/grover_iteration-original.json' with {type:'json'}
import approved from './fixtures/grover-iteration-approved-text.json' with {type:'json'}
for(const width of [390,1440])test(`Grover iteration preserves all source content except two approved probabilities at ${width}`,async({page})=>{
 await page.setViewportSize({width,height:1100});await page.goto('/qni-tutorial-webgpu/grover_iteration/')
 await page.waitForFunction(()=>document.documentElement.dataset.mathjax==='ready')
 const text=await page.locator('.content-with-margin').evaluate(root=>{const walk=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);let text='',node;while(node=walk.nextNode()){if(!node.parentElement!.closest('footer,script,style,mjx-container,orbit-reviewarea,qni-webgpu-circuit,[data-original-image]')&&!(node.parentElement!.closest('a')&&node.textContent!.replace(/\s+/g,'')==='Qniで開く'))text+=node.textContent}return text.replace(/\s+/g,'').normalize('NFC')})
 expect(text).toBe(approved.text)
 const math=await page.evaluate(()=>Array.from((window as any).MathJax.startup.document.math as Iterable<any>).map(item=>({tex:item.math.replace(/\s+/g,'').normalize('NFC'),display:item.display})))
 expect(math).toEqual(approved.math)
 expect(text).toContain('約90.8%');expect(text).toContain('9回目で99.2%');expect(math.some(item=>item.tex.includes('5,000'))).toBe(true)
 expect(await page.locator('qni-webgpu-circuit').evaluateAll(es=>es.map(e=>JSON.parse(e.getAttribute('circuit')!)))).toEqual(source.circuits)
 expect(source.circuits.map(c=>c.cols.length)).toEqual([17,29,53])
 for(const e of await page.locator('qni-webgpu-circuit').all()){await expect(e).toHaveAttribute('palette','[]');await expect(e).toHaveAttribute('max-wire-count','1');expect(await e.getAttribute('run-button')).toBeNull()}
 await page.evaluate(()=>document.fonts.ready);await expect.poll(()=>page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(width)
})
