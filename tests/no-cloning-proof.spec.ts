import {expect,test} from '@playwright/test'
import os from 'node:os'
import path from 'node:path'
import fixed from './fixtures/no_cloning_theorem_proof-fixed.json' with {type:'json'}
for(const width of [390,1440])for(const dpr of [1,2])test(`No-cloning B1-B3 MathJax/emoji ${width} DPR${dpr}`,async({browser})=>{
 const context=await browser.newContext({viewport:{width,height:1100},deviceScaleFactor:dpr}),page=await context.newPage(),errors:string[]=[]
 await page.addInitScript(()=>Object.defineProperty(navigator,'gpu',{configurable:true,value:undefined}))
 page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())})
 try{
 await page.goto('/qni-tutorial-webgpu/no_cloning_theorem_proof/');await page.waitForFunction(()=>document.documentElement.dataset.mathjax==='ready');await page.evaluate(()=>document.fonts.ready)
 const root=page.locator('.content-with-margin')
 expect(await root.evaluate(root=>{const walk=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);let text='',node;while(node=walk.nextNode()){if(!node.parentElement!.closest('footer,script,style,mjx-container'))text+=node.textContent}return text.replace(/\s+/g,'').normalize('NFC')})).toBe(fixed.text)
 expect(await page.evaluate(()=>Array.from((window as any).MathJax.startup.document.math as Iterable<any>).filter(item=>document.querySelector('.content-with-margin')!.contains(item.typesetRoot)&&!item.typesetRoot.closest('footer')).map(item=>({tex:item.math.replace(/\s+/g,'').normalize('NFC'),display:item.display})))).toEqual(fixed.math)
 await expect(root.locator('mjx-container')).toHaveCount(12);await expect(root.locator('mjx-container[display="true"]')).toHaveCount(3);await expect(root.locator('mjx-merror,[data-mjx-error]')).toHaveCount(0)
 for(const emoji of ['🍎','👶']){
 const glyphs=root.locator('mjx-utext').filter({hasText:emoji});expect(await glyphs.count()).toBeGreaterThan(0)
 for(const g of await glyphs.all()){
  await expect(g).toBeVisible();const box=(await g.boundingBox())!;expect(box.width).toBeGreaterThan(0);expect(box.height).toBeGreaterThan(0)
 }
 }
 await expect(root.locator('fit-content')).toHaveCount(3)
 await expect(root.locator('img,qni-webgpu-circuit,quantum-circuit,qubit-circle')).toHaveCount(0)
 expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(width)
 expect(await root.evaluate(root=>[document.body,root,...root.querySelectorAll('*')].filter(e=>{const s=getComputedStyle(e);return (['scroll','auto'].includes(s.overflowX)&&e.scrollWidth>e.clientWidth)||(['scroll','auto'].includes(s.overflowY)&&e.scrollHeight>e.clientHeight)}).length)).toBe(0)
 expect(await root.locator('mjx-container').evaluateAll(es=>es.every(e=>{const r=e.getBoundingClientRect();return r.left>=0&&r.right<=document.documentElement.clientWidth+.5&&r.height>0}))).toBe(true)
 expect(errors).toEqual([]);await page.screenshot({path:path.join(os.tmpdir(), `qtw-no-cloning-proof-${width}-dpr${dpr}.png`),fullPage:true})
 }finally{await context.close()}
})
