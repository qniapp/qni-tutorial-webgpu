import {expect,test} from '@playwright/test'
import qpe from './fixtures/quantum_phase_estimation_circuit-fixed.json' with {type:'json'}
const slug='quantum_phase_estimation_circuit',fixed=qpe
for(const width of [390,1440])for(const dpr of [1,2])test(`${slug} non-GPU content/layout ${width} DPR${dpr}`,async({browser})=>{
 const context=await browser.newContext({viewport:{width,height:1100},deviceScaleFactor:dpr});const page=await context.newPage()
 await page.addInitScript(()=>Object.defineProperty(navigator,'gpu',{configurable:true,value:undefined}))
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())})
 try{
 await page.goto(`/qni-tutorial-webgpu/${slug}/`);await page.waitForFunction(()=>document.documentElement.dataset.mathjax==='ready');await page.evaluate(()=>document.fonts.ready)
 const text=await page.locator('.content-with-margin').evaluate(root=>{const walk=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);let text='',node;while(node=walk.nextNode()){if(!node.parentElement!.closest('footer,script,style,mjx-container,orbit-reviewarea,qni-webgpu-circuit'))text+=node.textContent}return text.replace(/\s+/g,'').normalize('NFC')})
 expect(text).toBe(fixed.text)
 expect(await page.evaluate(()=>Array.from((window as any).MathJax.startup.document.math as Iterable<any>).filter(item=>document.querySelector('.content-with-margin')!.contains(item.typesetRoot)).map(item=>({tex:item.math.replace(/\s+/g,'').normalize('NFC'),display:item.display})))).toEqual(fixed.math)
 const embeds=page.locator('qni-webgpu-circuit');await expect(embeds).toHaveCount(fixed.circuits.length)
 for(let i=0;i<fixed.circuits.length;i++){const e=embeds.nth(i);await expect(e).toHaveAttribute('palette','[]');await expect(e).toHaveAttribute('max-wire-count',String(fixed.embeds[i].maxWireCount));expect(await e.getAttribute('run-button')!==null).toBe(fixed.embeds[i].runButton);expect(JSON.parse((await e.getAttribute('circuit'))!)).toEqual(fixed.circuits[i]);await expect(e).toHaveAttribute('data-state','unsupported')}
 expect(await page.locator('main qubit-circle').evaluateAll(es=>es.map(e=>({amplitude:e.getAttribute('data-amplitude'),ket:e.getAttribute('data-ket'),size:e.getAttribute('data-size')})))).toEqual(fixed.amplitudes)
 await expect(page.locator('main img')).toHaveCount(0)
 const glyphs=await page.locator('main p h-gate,main p control-gate,main p phase-gate').evaluateAll(es=>es.map(e=>(e as HTMLElement).dataset.glyph));expect(glyphs.length).toBeGreaterThan(0);expect(glyphs.every(v=>v==='bold')).toBe(true)
 for(const e of await page.locator('main .relative h-gate').all())await expect(e).toHaveAttribute('data-glyph','regular')
 expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(width)
 expect(await page.locator('.content-with-margin').evaluate(root=>{const roots:Element[]=[document.body,root,...root.querySelectorAll('*')];for(const e of root.querySelectorAll('qni-webgpu-circuit'))roots.push(...e.shadowRoot!.querySelectorAll('*'));return roots.filter(e=>{const s=getComputedStyle(e);return (['scroll','auto'].includes(s.overflowX)&&e.scrollWidth>e.clientWidth)||(['scroll','auto'].includes(s.overflowY)&&e.scrollHeight>e.clientHeight)}).length})).toBe(0)
 expect(errors).toEqual([])
 await page.screenshot({path:`/tmp/qtw-${slug}-${width}-dpr${dpr}.png`,fullPage:true})
 }finally{await context.close()}
})
