import {expect,test} from '@playwright/test'
import os from 'node:os'
import path from 'node:path'
import fixed from './fixtures/shor_qft-fixed.json' with {type:'json'}
for(const width of [390,1440])for(const dpr of [1,2])test(`Shor QFT only Q1/Q2 ${width} DPR${dpr}`,async({browser})=>{
 const context=await browser.newContext({viewport:{width,height:1100},deviceScaleFactor:dpr}),page=await context.newPage(),errors:string[]=[]
 await page.addInitScript(()=>Object.defineProperty(navigator,'gpu',{configurable:true,value:undefined}))
 page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())})
 try{
 await page.goto('/qni-tutorial-webgpu/shor_qft/');await page.waitForFunction(()=>document.documentElement.dataset.mathjax==='ready');await page.evaluate(()=>document.fonts.ready)
 const text=await page.locator('.content-with-margin').evaluate(root=>{const walk=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);let text='',node;while(node=walk.nextNode()){if(!node.parentElement!.closest('footer,script,style,mjx-container,[data-original-image],qubit-circle,qni-webgpu-circuit,orbit-reviewarea'))text+=node.textContent}return text.replace(/\s+/g,'').normalize('NFC')})
 expect(text).toBe(fixed.text)
 expect(await page.evaluate(()=>Array.from((window as any).MathJax.startup.document.math as Iterable<any>).filter(item=>document.querySelector('.content-with-margin')!.contains(item.typesetRoot)&&!item.typesetRoot.closest('footer,[data-original-image],qni-webgpu-circuit')).map(item=>({tex:item.math.replace(/\s+/g,'').normalize('NFC'),display:item.display})))).toEqual(fixed.math)
 const embed=page.locator('qni-webgpu-circuit');expect(await embed.evaluateAll(es=>es.map(e=>JSON.parse(e.getAttribute('circuit')!)))).toEqual(fixed.circuits)
 expect(await embed.evaluateAll(es=>es.map(e=>({maxWireCount:Number(e.getAttribute('max-wire-count')),palette:JSON.parse(e.getAttribute('palette')!),runButton:e.hasAttribute('run-button')})))).toEqual(fixed.embeds)
 expect(await embed.evaluate(e=>{let p:Element|null=e;const zoom=[];while(p){zoom.push(getComputedStyle(p).zoom);p=p.parentElement}return {fit:e.closest('fit-content')!==null,zoom}})).toEqual({fit:false,zoom:await embed.evaluate(e=>{let p:Element|null=e;const a=[];while(p){a.push('1');p=p.parentElement}return a})})
 expect(await page.locator('[data-shor-matrix] qubit-circle').evaluateAll(es=>es.map(e=>({amplitude:e.getAttribute('data-amplitude'),ket:Number(e.getAttribute('data-ket'))})))).toEqual(fixed.cells)
 const matrix=page.locator('[data-shor-matrix="shift2"]');await expect(matrix).toHaveCount(1);await expect(matrix.locator('qubit-circle')).toHaveCount(256)
 for(const axis of ['f','x'])expect(await matrix.locator(`[data-${axis}]`).allTextContents()).toEqual(Array.from({length:16},(_,i)=>String(i)))
 for(const ket of [242,248]){
 await page.mouse.move(0,0);await matrix.locator('qubit-circle').nth(ket).focus();await expect(page.locator('#qubit-circle-tooltip')).toContainText(ket===242?'0.0000%':'6.2500%');await page.keyboard.press('Escape');await expect(page.locator('#qubit-circle-tooltip')).toBeHidden()
 }
 await matrix.locator('qubit-circle').nth(1).click();await expect(page.locator('#qubit-circle-tooltip')).toContainText('6.2500%');await page.keyboard.press('Escape')
 expect((await matrix.locator('qubit-circle').first().boundingBox())!.width).toBeGreaterThanOrEqual(16)
 await expect(page.locator('main img,[data-original-image]')).toHaveCount(0)
 expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(width)
 expect(await page.locator('.content-with-margin').evaluate(root=>{const es=[document.body,root,...root.querySelectorAll('*')];for(const e of root.querySelectorAll('qni-webgpu-circuit'))if(e.shadowRoot)es.push(...e.shadowRoot.querySelectorAll('*'));return es.filter(e=>{const s=getComputedStyle(e);return (['scroll','auto'].includes(s.overflowX)&&e.scrollWidth>e.clientWidth)||(['scroll','auto'].includes(s.overflowY)&&e.scrollHeight>e.clientHeight)}).length})).toBe(0)
 expect(errors).toEqual([]);await page.screenshot({path:path.join(os.tmpdir(), `qtw-shor-qft-${width}-dpr${dpr}.png`),fullPage:true})
 }finally{await context.close()}
})
