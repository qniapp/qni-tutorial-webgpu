import {expect,test} from '@playwright/test'
import os from 'node:os'
import path from 'node:path'
import approved from './fixtures/qpe-output-approved.json' with {type:'json'}
for(const width of [390,1440])for(const dpr of [1,2])test(`QPE output non-GPU content/layout ${width} DPR${dpr}`,async({browser})=>{
 const context=await browser.newContext({viewport:{width,height:1100},deviceScaleFactor:dpr}),page=await context.newPage(),errors:string[]=[]
 await page.addInitScript(()=>Object.defineProperty(navigator,'gpu',{configurable:true,value:undefined}))
 page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())})
 try{
 await page.goto('/qni-tutorial-webgpu/qpe_output/');await page.waitForFunction(()=>document.documentElement.dataset.mathjax==='ready');await page.evaluate(()=>document.fonts.ready)
 await expect(page.locator('.lede')).toHaveText(approved.description)
 const text=await page.locator('.content-with-margin').evaluate(root=>{const walk=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);let text='',node;while(node=walk.nextNode()){if(!node.parentElement!.closest('footer,script,style,mjx-container,qubit-circle,orbit-reviewarea'))text+=node.textContent}return text.replace(/\s+/g,'').normalize('NFC')})
 expect(text).toBe(approved.text)
 expect(await page.evaluate(()=>Array.from((window as any).MathJax.startup.document.math as Iterable<any>).filter(item=>document.querySelector('.content-with-margin')!.contains(item.typesetRoot)).map(item=>({tex:item.math.replace(/\s+/g,'').normalize('NFC'),display:item.display})))).toEqual(approved.math)
 expect(await page.locator('main qubit-circle').evaluateAll(es=>es.map(e=>({amplitude:e.getAttribute('data-amplitude'),ket:e.getAttribute('data-ket'),size:e.getAttribute('data-size')})))).toEqual(approved.amplitudes)
 await expect(page.locator('qni-webgpu-circuit')).toHaveCount(0);await expect(page.locator('main img')).toHaveCount(0)
 expect(await page.locator('main p phase-gate,main p h-gate').evaluateAll(es=>es.map(e=>(e as HTMLElement).dataset.glyph))).toEqual(['bold','bold'])
 await expect(page.locator('main p').getByRole('link',{name:'量子位相推定回路',exact:true})).toHaveAttribute('href','/qni-tutorial-webgpu/quantum_phase_estimation_circuit/')
 expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(width)
 expect(await page.locator('.content-with-margin').evaluate(root=>[document.body,root,...root.querySelectorAll('*')].filter(e=>{const s=getComputedStyle(e);return (['scroll','auto'].includes(s.overflowX)&&e.scrollWidth>e.clientWidth)||(['scroll','auto'].includes(s.overflowY)&&e.scrollHeight>e.clientHeight)}).length)).toBe(0)
 expect(errors).toEqual([])
 await page.screenshot({path:path.join(os.tmpdir(), `qtw-qpe-output-${width}-dpr${dpr}.png`),fullPage:true})
 }finally{await context.close()}
})
