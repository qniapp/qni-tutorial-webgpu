import {expect,test} from '@playwright/test'
import fixed from './fixtures/shor-r-approved.json' with {type:'json'}
for(const width of [390,1440])for(const dpr of [1,2])test(`Shor R approved source and peaks ${width} DPR${dpr}`,async({browser})=>{
 const context=await browser.newContext({viewport:{width,height:1100},deviceScaleFactor:dpr}),page=await context.newPage(),errors:string[]=[]
 await page.addInitScript(()=>Object.defineProperty(navigator,'gpu',{configurable:true,value:undefined}))
 page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())})
 try{
 await page.goto('/qni-tutorial-webgpu/shor_r/');await page.waitForFunction(()=>document.documentElement.dataset.mathjax==='ready');await page.evaluate(()=>document.fonts.ready)
 const text=await page.locator('.content-with-margin').evaluate(root=>{const walk=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);let text='',node;while(node=walk.nextNode()){if(!node.parentElement!.closest('footer,script,style,mjx-container,[data-original-image],orbit-reviewarea'))text+=node.textContent}return text.replace(/\s+/g,'').normalize('NFC')})
 expect(text).toBe(fixed.text)
 expect(await page.evaluate(()=>Array.from((window as any).MathJax.startup.document.math as Iterable<any>).filter(item=>document.querySelector('.content-with-margin')!.contains(item.typesetRoot)&&!item.typesetRoot.closest('footer,[data-original-image]')).map(item=>({tex:item.math.replace(/\s+/g,'').normalize('NFC'),display:item.display})))).toEqual(fixed.math)
 const graph=page.locator('[data-shor-qft-peaks]');await expect(graph).toHaveCount(1)
 expect(await graph.locator('[data-bin]').evaluateAll(es=>es.map(e=>Number((e as SVGElement).dataset.probability)))).toEqual(Array.from({length:16},(_,k)=>[0,4,8,12].includes(k)?.25:0))
 expect(await graph.locator('[data-x-tick]').allTextContents()).toEqual(Array.from({length:16},(_,k)=>String(k)))
 expect(await graph.locator('[data-y-tick]').allTextContents()).toEqual(Array.from({length:11},(_,k)=>k===0?'-0%':`${k*10}%`))
 expect(await graph.locator('[data-percent]').allTextContents()).toEqual(['25%','25%','25%','25%'])
 expect(await graph.locator('[data-bar]').evaluateAll(es=>es.map(e=>Number(e.getAttribute('height'))))).toEqual([219,219,219,219])
 await expect(page.locator('main img,qni-webgpu-circuit')).toHaveCount(0);await expect(page.locator('#margin-note-cfa')).toHaveCount(1)
 expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(width)
 expect(await page.locator('.content-with-margin').evaluate(root=>[document.body,root,...root.querySelectorAll('*')].filter(e=>{const s=getComputedStyle(e);return (['scroll','auto'].includes(s.overflowX)&&e.scrollWidth>e.clientWidth)||(['scroll','auto'].includes(s.overflowY)&&e.scrollHeight>e.clientHeight)}).length)).toBe(0)
 expect(errors).toEqual([])
 await page.screenshot({path:`/tmp/qtw-shor-r-${width}-dpr${dpr}.png`,fullPage:true})
 }finally{await context.close()}
})
