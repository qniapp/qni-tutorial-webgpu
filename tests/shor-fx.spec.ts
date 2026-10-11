import {expect,test} from '@playwright/test'
import fixed from './fixtures/shor_fx-fixed.json' with {type:'json'}
for(const width of [390,1440])for(const dpr of [1,2])test(`Shor FX non-GPU only A ${width} DPR${dpr}`,async({browser})=>{
 const context=await browser.newContext({viewport:{width,height:1100},deviceScaleFactor:dpr}),page=await context.newPage(),errors:string[]=[]
 await page.addInitScript(()=>Object.defineProperty(navigator,'gpu',{configurable:true,value:undefined}))
 page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())})
 try{
 await page.goto('/qni-tutorial-webgpu/shor_fx/');await page.waitForFunction(()=>document.documentElement.dataset.mathjax==='ready');await page.evaluate(()=>document.fonts.ready)
 const text=await page.locator('.content-with-margin').evaluate(root=>{const walk=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);let text='',node;while(node=walk.nextNode()){if(!node.parentElement!.closest('footer,script,style,mjx-container,[data-original-image],qni-webgpu-circuit,orbit-reviewarea'))text+=node.textContent}return text.replace(/\s+/g,'').normalize('NFC')})
 expect(text).toBe(fixed.text)
 expect(await page.evaluate(()=>Array.from((window as any).MathJax.startup.document.math as Iterable<any>).filter(item=>document.querySelector('.content-with-margin')!.contains(item.typesetRoot)&&!item.typesetRoot.closest('footer,[data-original-image],qni-webgpu-circuit')).map(item=>({tex:item.math.replace(/\s+/g,'').normalize('NFC'),display:item.display})))).toEqual(fixed.math)
 expect(await page.locator('qni-webgpu-circuit').evaluateAll(es=>es.map(e=>JSON.parse(e.getAttribute('circuit')!)))).toEqual(fixed.circuits)
 expect(await page.locator('qni-webgpu-circuit').evaluateAll(es=>es.map(e=>({maxWireCount:Number(e.getAttribute('max-wire-count')),palette:JSON.parse(e.getAttribute('palette')!),runButton:e.hasAttribute('run-button')})))).toEqual(fixed.embeds)
 await expect(page.locator('main img')).toHaveCount(0);await expect(page.locator('[data-original-image]')).toHaveCount(4)
 for(const variant of ['repeated','controlled','qft']){
 const diagram=page.locator(`[data-shor-power="${variant}"]`)
 await expect(diagram.locator('[data-wire]')).toHaveCount(8);await expect(diagram.locator('[data-h]')).toHaveCount(4);await expect(diagram.locator('[data-u]')).toHaveCount(variant==='repeated'?9:15)
 if(variant!=='repeated')expect(await diagram.locator('[data-u]').evaluateAll(es=>[0,1,2,3].map(w=>es.filter(e=>Number((e as SVGElement).dataset.controlWire)===w).length))).toEqual([1,2,4,8])
 await expect(diagram.locator('[data-qft]')).toHaveCount(variant==='qft'?1:0)
 }
 await expect(page.locator('main p h-gate')).toHaveAttribute('data-glyph','bold')
 await expect(page.locator('#margin-note-qiskit_shor')).toHaveCount(1)
 expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(width)
 expect(await page.locator('.content-with-margin').evaluate(root=>{const es=[document.body,root,...root.querySelectorAll('*')];for(const e of root.querySelectorAll('qni-webgpu-circuit'))if(e.shadowRoot)es.push(...e.shadowRoot.querySelectorAll('*'));return es.filter(e=>{const s=getComputedStyle(e);return (['scroll','auto'].includes(s.overflowX)&&e.scrollWidth>e.clientWidth)||(['scroll','auto'].includes(s.overflowY)&&e.scrollHeight>e.clientHeight)}).length})).toBe(0)
 expect(errors).toEqual([])
 await page.screenshot({path:`/tmp/qtw-shor-fx-${width}-dpr${dpr}.png`,fullPage:true})
 }finally{await context.close()}
})
