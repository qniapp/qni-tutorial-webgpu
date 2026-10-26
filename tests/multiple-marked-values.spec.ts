import {expect,test} from '@playwright/test'
import source from './fixtures/multiple_marked_values-original.json' with {type:'json'}
import original from './fixtures/multiple-marked-text.json' with {type:'json'}
for(const width of [390,1440])test(`multiple marked values preserves original text, TeX and both circuits at ${width}`,async({page})=>{
 await page.setViewportSize({width,height:1100});await page.goto('/qni-tutorial-webgpu/multiple_marked_values/')
 await page.waitForFunction(()=>document.documentElement.dataset.mathjax==='ready')
 const text=await page.locator('.content-with-margin').evaluate(root=>{const walk=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);let text='',node;while(node=walk.nextNode()){if(!node.parentElement!.closest('footer,script,style,mjx-container,orbit-reviewarea,qni-webgpu-circuit,[data-original-image]')&&!(node.parentElement!.closest('a')&&node.textContent!.replace(/\s+/g,'')==='Qniで開く'))text+=node.textContent}return text.replace(/\s+/g,'').normalize('NFC')})
 expect(text).toBe(original.text.replaceAll('グローヴァー', 'グローバー').replaceAll('グロヴァー', 'グローバー'))
 expect(await page.evaluate(()=>Array.from((window as any).MathJax.startup.document.math as Iterable<any>).map(item=>({tex:item.math.replace(/\s+/g,'').normalize('NFC'),display:item.display})))).toEqual(original.math)
 expect(await page.locator('qni-webgpu-circuit').evaluateAll(es=>es.map(e=>JSON.parse(e.getAttribute('circuit')!)))).toEqual(source.circuits)
 for(const e of await page.locator('qni-webgpu-circuit').all()){await expect(e).toHaveAttribute('palette','[]');await expect(e).toHaveAttribute('max-wire-count','1')}
 await page.evaluate(()=>document.fonts.ready);await expect.poll(()=>page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(width)
})
