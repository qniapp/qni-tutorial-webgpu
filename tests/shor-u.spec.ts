import {expect,test} from '@playwright/test'
import os from 'node:os'
import path from 'node:path'
import fixed from './fixtures/shor_u-fixed.json' with {type:'json'}
for(const width of [390,1440])for(const dpr of [1,2])test(`Shor U approved edits and owned figures ${width} DPR${dpr}`,async({browser})=>{
 const context=await browser.newContext({viewport:{width,height:1100},deviceScaleFactor:dpr}),page=await context.newPage(),errors:string[]=[]
 await page.addInitScript(()=>Object.defineProperty(navigator,'gpu',{configurable:true,value:undefined}))
 page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())})
 try{
 await page.goto('/qni-tutorial-webgpu/shor_u/');await page.waitForFunction(()=>document.documentElement.dataset.mathjax==='ready');await page.evaluate(()=>document.fonts.ready)
 const text=await page.locator('.content-with-margin').evaluate(root=>{const walk=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);let text='',node;while(node=walk.nextNode()){if(!node.parentElement!.closest('footer,script,style,mjx-container,[data-original-image],qubit-circle,qni-webgpu-circuit,orbit-reviewarea'))text+=node.textContent}return text.replace(/\s+/g,'').normalize('NFC')})
 expect(text).toBe(fixed.text)
 expect(await page.evaluate(()=>Array.from((window as any).MathJax.startup.document.math as Iterable<any>).filter(item=>document.querySelector('.content-with-margin')!.contains(item.typesetRoot)&&!item.typesetRoot.closest('footer,[data-original-image],qni-webgpu-circuit')).map(item=>({tex:item.math.replace(/\s+/g,'').normalize('NFC'),display:item.display})))).toEqual(fixed.math)
 expect(await page.locator('qni-webgpu-circuit').evaluateAll(es=>es.map(e=>JSON.parse(e.getAttribute('circuit')!)))).toEqual(fixed.circuits)
 expect(await page.locator('qni-webgpu-circuit').evaluateAll(es=>es.map(e=>({maxWireCount:Number(e.getAttribute('max-wire-count')),palette:JSON.parse(e.getAttribute('palette')!),runButton:e.hasAttribute('run-button')})))).toEqual(fixed.embeds)
 expect(await page.locator('[data-shor-matrix] qubit-circle').evaluateAll(es=>es.map(e=>({amplitude:e.getAttribute('data-amplitude'),ket:Number(e.getAttribute('data-ket'))})))).toEqual(fixed.cells)
 for(const stage of ['initial','shift1','shift2']){
 const matrix=page.locator(`[data-shor-matrix="${stage}"]`);await expect(matrix.locator('qubit-circle')).toHaveCount(256)
 expect(await matrix.locator('[data-f]').allTextContents()).toEqual(Array.from({length:16},(_,i)=>String(i)))
 expect(await matrix.locator('[data-x]').allTextContents()).toEqual(Array.from({length:16},(_,i)=>String(i)))
 const c=matrix.locator('qubit-circle').nth(242);await page.mouse.move(0,0);await c.focus();await expect(page.locator('#qubit-circle-tooltip')).toBeVisible();await expect(page.locator('#qubit-circle-tooltip')).toContainText(stage==='shift1'?'6.2500%':'0.0000%');await page.keyboard.press('Escape');await expect(page.locator('#qubit-circle-tooltip')).toBeHidden()
 await matrix.locator('qubit-circle').nth(1).click();await expect(page.locator('#qubit-circle-tooltip')).toBeVisible();await page.keyboard.press('Escape')
 const box=await matrix.locator('qubit-circle').first().boundingBox();expect(box!.width).toBeGreaterThanOrEqual(16)
 }
 await expect(page.locator('main img')).toHaveCount(1);await expect(page.locator('main img')).toHaveAttribute('src',/\/images\/axmodN\.png$/);await expect(page.locator('[data-original-image]')).toHaveCount(3)
 await expect(page.locator('[data-vedral="modexp"]')).toHaveCount(0)
 const note=page.locator('main figure:has(img) + p');await expect(note).toContainText('注: 図中の出力ラベル');await expect(note.locator('mjx-container')).toHaveCount(2)
 await expect(page.locator('#margin-note-vedral + .margin-note a')).toHaveAttribute('href','https://arxiv.org/abs/quant-ph/9511018')
 const ctrl=page.locator('[data-vedral="ctrl-mult-mod"]');await expect(ctrl.locator('[data-adder]')).toHaveCount(3);await expect(ctrl.locator('[data-control-pair]')).toHaveCount(6);await expect(ctrl.locator('[data-equivalence]')).toHaveText('≡')
 expect(await page.locator('[data-vedral] text').evaluateAll(es=>es.map(e=>getComputedStyle(e).fontWeight))).toEqual(Array(await page.locator('[data-vedral] text').count()).fill('400'))
 await expect(page.locator('main p h-gate')).toHaveCount(2);await expect(page.locator('main p swap-gate')).toHaveCount(3);for(const e of await page.locator('main p h-gate,main p swap-gate').all())await expect(e).toHaveAttribute('data-glyph','bold')
 expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(width)
 expect(await page.locator('.content-with-margin').evaluate(root=>{const es=[document.body,root,...root.querySelectorAll('*')];for(const e of root.querySelectorAll('qni-webgpu-circuit'))if(e.shadowRoot)es.push(...e.shadowRoot.querySelectorAll('*'));return es.filter(e=>{const s=getComputedStyle(e);return (['scroll','auto'].includes(s.overflowX)&&e.scrollWidth>e.clientWidth)||(['scroll','auto'].includes(s.overflowY)&&e.scrollHeight>e.clientHeight)}).length})).toBe(0)
 expect(errors).toEqual([]);await page.screenshot({path:path.join(os.tmpdir(), `qtw-shor-u-${width}-dpr${dpr}.png`),fullPage:true})
 }finally{await context.close()}
})
