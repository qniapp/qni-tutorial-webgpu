import {expect,test} from '@playwright/test'
import os from 'node:os'
import path from 'node:path'
import approved from './fixtures/eigenphases-approved-text.json' with {type:'json'}
import original from './fixtures/eigenphases-original.json' with {type:'json'}
// Deliberately disable WebGPU: these are content/layout checks, not native execution evidence.
for(const width of [390,1440])for(const dpr of [1,2])test(`eigenphases non-GPU content/layout ${width} DPR${dpr}`,async({browser})=>{
 const context=await browser.newContext({viewport:{width,height:1100},deviceScaleFactor:dpr});const page=await context.newPage()
 await page.addInitScript(()=>Object.defineProperty(navigator,'gpu',{configurable:true,value:undefined}))
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())})
 try{
 await page.goto('/qni-tutorial-webgpu/eigenphases/');await page.waitForFunction(()=>document.documentElement.dataset.mathjax==='ready');await page.evaluate(()=>document.fonts.ready)
 const text=await page.locator('.content-with-margin').evaluate(root=>{const walk=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);let text='',node;while(node=walk.nextNode()){if(!node.parentElement!.closest('footer,script,style,mjx-container,orbit-reviewarea,qni-webgpu-circuit,[data-original-image]'))text+=node.textContent}return text.replace(/\s+/g,'').normalize('NFC')})
 expect(text).toBe(approved.text)
 expect(await page.evaluate(()=>Array.from((window as any).MathJax.startup.document.math as Iterable<any>).filter(item=>document.querySelector('.content-with-margin')!.contains(item.typesetRoot)).map(item=>({tex:item.math.replace(/\s+/g,'').normalize('NFC'),display:item.display})))).toEqual(approved.math)
 const embeds=page.locator('qni-webgpu-circuit');await expect(embeds).toHaveCount(2)
 for(let i=0;i<2;i++){const e=embeds.nth(i);await expect(e).toHaveAttribute('palette','[]');await expect(e).toHaveAttribute('max-wire-count','2');expect(await e.getAttribute('run-button')).toBeNull();expect(JSON.parse((await e.getAttribute('circuit'))!)).toEqual(original.circuits[i]);await expect(e).toHaveAttribute('data-state','unsupported')}
 expect(await page.locator('main qubit-circle').evaluateAll(es=>es.map(e=>({amplitude:e.getAttribute('data-amplitude'),ket:e.getAttribute('data-ket'),size:e.getAttribute('data-size')})))).toEqual(original.amplitudes)
 await expect(page.locator('main img')).toHaveCount(0)
 expect(await page.locator('main p h-gate,main p x-gate,main p y-gate,main p z-gate,main p phase-gate').evaluateAll(es=>es.map(e=>(e as HTMLElement).dataset.glyph))).toEqual(Array(10).fill('bold'))
 expect(await page.locator('main .relative h-gate,main table h-gate,main table x-gate,main table y-gate,main table z-gate,main table phase-gate').evaluateAll(es=>es.map(e=>(e as HTMLElement).dataset.glyph))).toEqual(Array(8).fill('regular'))
 expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(width)
 expect(await page.locator('.content-with-margin').evaluate(root=>[document.body,root,...root.querySelectorAll('*')].filter(e=>{const s=getComputedStyle(e);return (['scroll','auto'].includes(s.overflowX)&&e.scrollWidth>e.clientWidth+1)||(['scroll','auto'].includes(s.overflowY)&&e.scrollHeight>e.clientHeight+1)}).length)).toBe(0)
 expect(errors).toEqual([])
 await page.screenshot({path:path.join(os.tmpdir(), `qtw-eigenphases-${width}-dpr${dpr}.png`),fullPage:true})
 }finally{await context.close()}
})
