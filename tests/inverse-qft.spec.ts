import {expect,test} from '@playwright/test'
import approved from './fixtures/inverse-qft-text.json' with {type:'json'}
import original from './fixtures/inverse_qft-original.json' with {type:'json'}
for(const width of [390,1440])test(`inverse QFT preserves original text and values at ${width}`,async({page})=>{
 await page.setViewportSize({width,height:1100});const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())})
 await page.goto('/qni-tutorial-webgpu/inverse_qft/');await page.waitForFunction(()=>document.documentElement.dataset.mathjax==='ready');await page.waitForFunction(()=>document.querySelector<HTMLElement>('qni-webgpu-circuit')?.dataset.state==='running');await page.evaluate(()=>document.fonts.ready)
 const text=await page.locator('.content-with-margin').evaluate(root=>{const walk=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);let text='',node;while(node=walk.nextNode()){if(!node.parentElement!.closest('footer,script,style,mjx-container,orbit-reviewarea,qni-webgpu-circuit,[data-original-image]')&&!(node.parentElement!.closest('a')&&node.textContent!.replace(/\s+/g,'')==='Qniで開く'))text+=node.textContent}return text.replace(/\s+/g,'').normalize('NFC')})
 expect(text).toBe(approved.text)
 expect(await page.evaluate(()=>Array.from((window as any).MathJax.startup.document.math as Iterable<any>).filter(item=>document.querySelector('.content-with-margin')!.contains(item.typesetRoot)&&!item.typesetRoot.closest('[data-original-image]')).map(item=>({tex:item.math.replace(/\s+/g,'').normalize('NFC'),display:item.display})))).toEqual(approved.math)
 const e=page.locator('qni-webgpu-circuit');await expect(e).toHaveAttribute('palette','[]');await expect(e).toHaveAttribute('max-wire-count','1');expect(await e.getAttribute('run-button')).toBeNull();expect(JSON.parse((await e.getAttribute('circuit'))!)).toEqual(original.circuits[0])
 await expect(page.locator('main qubit-circle')).toHaveCount(32)
 expect(await page.locator('main qubit-circle').evaluateAll(es=>es.map(e=>({amplitude:e.getAttribute('data-amplitude'),ket:e.getAttribute('data-ket'),size:e.getAttribute('data-size')})))).toEqual(original.amplitudes)
 for(const c of await page.locator('main qubit-circle').all())await expect(c).toHaveAttribute('data-qubit-count','4')
 await expect(page.locator('main img')).toHaveCount(0)
 expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(width)
 expect(await page.locator('.content-with-margin').evaluate(e=>[e,...e.querySelectorAll('*')].filter(e=>{const s=getComputedStyle(e);return ['scroll','auto'].includes(s.overflowX)&&e.scrollWidth>e.clientWidth+1}).length)).toBe(0)
 expect(errors).toEqual([])
})
