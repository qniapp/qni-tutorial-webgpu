import {expect,test} from '@playwright/test'
import os from 'node:os'
import path from 'node:path'
import approved from './fixtures/shor-hsp-approved.json' with {type:'json'}
for(const width of [390,1440])for(const dpr of [1,2])test(`Shor HSP non-GPU approved source and SVG ${width} DPR${dpr}`,async({browser})=>{
 const context=await browser.newContext({viewport:{width,height:1100},deviceScaleFactor:dpr}),page=await context.newPage(),errors:string[]=[]
 await page.addInitScript(()=>Object.defineProperty(navigator,'gpu',{configurable:true,value:undefined}))
 page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())})
 try{
 await page.goto('/qni-tutorial-webgpu/shor_hsp/');await page.waitForFunction(()=>document.documentElement.dataset.mathjax==='ready');await page.evaluate(()=>document.fonts.ready)
 const text=await page.locator('.content-with-margin').evaluate(root=>{const walk=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);let text='',node;while(node=walk.nextNode()){if(!node.parentElement!.closest('footer,script,style,mjx-container,[data-original-image],orbit-reviewarea'))text+=node.textContent}return text.replace(/\s+/g,'').normalize('NFC')})
 expect(text).toBe(approved.text);expect(await page.locator('.lede').evaluate(e=>e.textContent!.replace(/\s+/g,''))).toBe(approved.description)
 expect(await page.evaluate(()=>Array.from((window as any).MathJax.startup.document.math as Iterable<any>).filter(item=>document.querySelector('.content-with-margin')!.contains(item.typesetRoot)&&!item.typesetRoot.closest('footer,[data-original-image]')).map(item=>({tex:item.math.replace(/\s+/g,'').normalize('NFC'),display:item.display})))).toEqual(approved.math)
 await expect(page.locator('qni-webgpu-circuit,main img')).toHaveCount(0)
 const graphs=page.locator('[data-shor-mod15]');await expect(graphs).toHaveCount(2)
 for(let i=0;i<2;i++){
 const graph=graphs.nth(i)
 expect(await graph.locator('[data-plot-point]').evaluateAll(es=>es.map(e=>Number((e as SVGElement).dataset.y)))).toEqual(approved.points)
 expect(await graph.locator('[data-plot-point]').evaluateAll(es=>es.map(e=>({x:Number((e as SVGElement).dataset.x),cx:Number(e.getAttribute('cx')),cy:Number(e.getAttribute('cy'))})))).toEqual(approved.points.map((y,x)=>({x,cx:205+x*(1619-205)/15,cy:960-y*(960-83)/12})))
 expect((await graph.locator('text').allTextContents()).slice(-2)).toEqual(['X','f(x)'])
 expect(await graph.locator('[data-x-tick]').allTextContents()).toEqual(Array.from({length:16},(_,n)=>String(n)))
 expect(await graph.locator('[data-y-tick]').allTextContents()).toEqual(Array.from({length:13},(_,n)=>String(n)))
 expect(await graph.locator('[data-period-ring]').evaluateAll(es=>es.map(e=>Number((e as SVGElement).dataset.x)))).toEqual(i===0?[]:[0,4])
 await expect(graph.locator('output')).toBeHidden()
 }
 expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(width)
 expect(await page.locator('.content-with-margin').evaluate(root=>[document.body,root,...root.querySelectorAll('*')].filter(e=>{const s=getComputedStyle(e);return (['scroll','auto'].includes(s.overflowX)&&e.scrollWidth>e.clientWidth)||(['scroll','auto'].includes(s.overflowY)&&e.scrollHeight>e.clientHeight)}).length)).toBe(0)
 await page.screenshot({path:path.join(os.tmpdir(), `qtw-shor-hsp-${width}-dpr${dpr}.png`),fullPage:true})
 const first=graphs.nth(0),second=graphs.nth(1)
 await first.locator('svg').focus();await page.keyboard.press('Home');await page.keyboard.press('ArrowRight');await expect(first.locator('output')).toHaveText('x=1, f(x)=2');await expect(second.locator('output')).toBeHidden()
 await first.locator('[data-plot-point][data-x="4"]').click({force:true});await expect(first.locator('output')).toHaveText('x=4, f(x)=1')
 await page.keyboard.press('End');await expect(first.locator('output')).toHaveText('x=15, f(x)=8');await page.keyboard.press('Escape');await expect(first.locator('output')).toBeHidden()
 await second.locator('svg').focus();await page.keyboard.press('Home');await expect(second.locator('output')).toHaveText('x=0, f(x)=1');await expect(first.locator('output')).toBeHidden()
 await expect(second.locator('[data-period-ring]')).toHaveCount(2)
 expect(errors).toEqual([])
 }finally{await context.close()}
})
