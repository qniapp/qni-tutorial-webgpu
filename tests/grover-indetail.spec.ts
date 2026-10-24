import {expect,test} from '@playwright/test'
import os from 'node:os'
import path from 'node:path'
import original from './fixtures/grover-indetail-text.json' with {type:'json'}
for(const width of [390,1440])test(`reflection explanation keeps original prose and TeX at ${width}`,async({page})=>{
 await page.setViewportSize({width,height:1100});await page.goto('/qni-tutorial-webgpu/grover_iam_indetail/')
 await page.waitForFunction(()=>document.documentElement.dataset.mathjax==='ready')
 const text=await page.locator('.content-with-margin').evaluate(root=>{const walk=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);let text='',node;while(node=walk.nextNode()){if(!node.parentElement!.closest('footer,script,style,mjx-container,[data-original-image]'))text+=node.textContent}return text.replace(/\s+/g,'').normalize('NFC')})
 expect(text).toBe(original.text.replaceAll('グローヴァー', 'グローバー').replaceAll('グロヴァー', 'グローバー'))
 expect(await page.evaluate(()=>Array.from((window as any).MathJax.startup.document.math as Iterable<any>).filter(item=>!item.typesetRoot.closest('[data-original-image]')).map(item=>({tex:item.math.replace(/\s+/g,'').normalize('NFC'),display:item.display})))).toEqual(original.math)
 await expect(page.locator('main img,main qni-webgpu-circuit')).toHaveCount(0)
 expect(text).not.toContain('全体位相')
})
for(const width of [390,1440])for(const dpr of [1,2])test(`five exact reflection figures are interactive at ${width}/DPR${dpr}`,async({browser})=>{
 const context=await browser.newContext({viewport:{width,height:1100},deviceScaleFactor:dpr})
 const page=await context.newPage(),errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())})
 try{
 await page.goto('/qni-tutorial-webgpu/grover_iam_indetail/');await page.waitForFunction(()=>document.documentElement.dataset.mathjax==='ready');await page.evaluate(()=>document.fonts.ready)
 const figures=page.locator('[data-grover-reflection]');await expect(figures).toHaveCount(5)
 const values=()=>figures.evaluateAll(es=>es.map(e=>({stage:Number((e as HTMLElement).dataset.stage),marked:(e as HTMLElement).dataset.marked,states:[...e.querySelectorAll<SVGGElement>('[data-state]')].map(s=>({initial:Number(s.dataset.initial),mean:Number(s.dataset.average),reflected:Number(s.dataset.reflected),amplitude:Number(s.dataset.amplitude),disc:Number(s.querySelector('[data-disc]')!.getAttribute('r')),phase:Number(s.querySelector('[data-phase]')!.getAttribute('y2')),origin:s.querySelector('[data-origin]')?.getAttribute('cy'),meanY:s.querySelector('[data-mean]')?.getAttribute('cy'),result:s.querySelector('[data-result]')?.getAttribute('cy')}))})))
 const before=await values()
 for(const f of before){expect(f.marked).toBe('3');for(const [i,s]of f.states.entries()){const initial=i===3?-.5:.5,reflected=i===3?1:0,cy=f.stage<2?132:72,amp=f.stage<3?initial:reflected;expect(s.initial).toBe(initial);expect(s.mean).toBe(.25);expect(s.reflected).toBe(reflected);expect(s.amplitude).toBe(amp);expect(s.disc).toBe(56*Math.abs(amp));expect(s.phase).toBe(cy-56*amp);if(s.origin!==undefined)expect(Number(s.origin)).toBe(cy-56*initial);if(s.meanY!==undefined)expect(Number(s.meanY)).toBe(cy-14);if(s.result!==undefined)expect(Number(s.result)).toBe(cy-56*reflected)}}
 const state=figures.nth(0).locator('[data-state="3"]');await state.click();await expect(figures.nth(2).locator('output')).toContainText('元の座標 [0, -0.5] / 平均 [0, 0.25] / 反射後 [0, 1]');await expect(figures.nth(4).locator('output')).toContainText('振幅 1 / 確率 100%')
 await state.focus();await page.keyboard.press('ArrowLeft');await expect(figures.nth(4)).toHaveAttribute('data-selected','2');await expect(figures.nth(4).locator('output')).toContainText('振幅 0 / 確率 0%');await page.keyboard.press('Escape');await expect(figures.nth(4).locator('output')).toBeHidden()
 expect(await values()).toEqual(before)
 expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(width)
 expect(await page.locator('.content-with-margin').evaluate(e=>[e,...e.querySelectorAll('*')].filter(e=>{const s=getComputedStyle(e);return ['scroll','auto'].includes(s.overflowX)&&e.scrollWidth>e.clientWidth+1}).length)).toBe(0)
 for(let i=0;i<5;i++)await figures.nth(i).screenshot({path:path.join(os.tmpdir(), `qtw-grover-indetail-figure-${width}-dpr${dpr}-${i}.png`)})
 expect(errors).toEqual([])
 }finally{await context.close()}
})
