import {expect,test} from '@playwright/test'
import approved from './fixtures/qft-adder-approved-text.json' with {type:'json'}
import original from './fixtures/qft_adder-original.json' with {type:'json'}
for(const width of [390,1440])test(`QFT adder applies only approved ordinal edit at ${width}`,async({page})=>{
 await page.setViewportSize({width,height:1100});const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())})
 await page.goto('/qni-tutorial-webgpu/qft_adder/');await page.waitForFunction(()=>document.documentElement.dataset.mathjax==='ready');await page.waitForFunction(()=>[...document.querySelectorAll<HTMLElement>('qni-webgpu-circuit')].every(e=>e.dataset.state==='running'));await page.evaluate(()=>document.fonts.ready)
 const text=await page.locator('.content-with-margin').evaluate(root=>{const walk=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);let text='',node;while(node=walk.nextNode()){if(!node.parentElement!.closest('footer,script,style,mjx-container,orbit-reviewarea,qni-webgpu-circuit,[data-original-image]')&&!(node.parentElement!.closest('a')&&node.textContent!.replace(/\s+/g,'')==='Qniで開く'))text+=node.textContent}return text.replace(/\s+/g,'').normalize('NFC')})
 expect(text).toBe(approved.text);expect(approved.edits.reduce((t,[before,after])=>t.replace(after,before),text)).toBe(approved.original)
 expect(await page.evaluate(()=>Array.from((window as any).MathJax.startup.document.math as Iterable<any>).filter(item=>document.querySelector('.content-with-margin')!.contains(item.typesetRoot)&&!item.typesetRoot.closest('[data-original-image]')).map(item=>({tex:item.math.replace(/\s+/g,'').normalize('NFC'),display:item.display})))).toEqual(approved.math)
 await expect(page.locator('qni-webgpu-circuit')).toHaveCount(3);for(const [i,e]of(await page.locator('qni-webgpu-circuit').all()).entries()){await expect(e).toHaveAttribute('palette','[]');await expect(e).toHaveAttribute('max-wire-count','1');expect(await e.getAttribute('run-button')).toBeNull();expect(JSON.parse((await e.getAttribute('circuit'))!)).toEqual(original.circuits[i])}
 await expect(page.locator('main qubit-circle')).toHaveCount(0)
 expect(await page.locator('main qubit-circle').evaluateAll(es=>es.map(e=>({amplitude:e.getAttribute('data-amplitude'),ket:e.getAttribute('data-ket'),size:e.getAttribute('data-size')})))).toEqual(original.amplitudes)
 for(const c of await page.locator('main qubit-circle').all())await expect(c).toHaveAttribute('data-qubit-count','4')
 await expect(page.locator('main img')).toHaveCount(0)
 expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(width)
 expect(await page.locator('.content-with-margin').evaluate(e=>[e,...e.querySelectorAll('*')].filter(e=>{const s=getComputedStyle(e);return ['scroll','auto'].includes(s.overflowX)&&e.scrollWidth>e.clientWidth+1}).length)).toBe(0)
 expect(errors).toEqual([])
})

for(const width of[390,1440])test(`QFT adder footer previous link at ${width}`,async({page})=>{await page.setViewportSize({width,height:1100});await page.goto('/qni-tutorial-webgpu/qft_adder/');const link=page.locator('footer a').first();await expect(link).toHaveText('QFT の内部');await expect(link).toHaveAttribute('href','/qni-tutorial-webgpu/inside_the_qft/');await link.click();await expect(page).toHaveURL(/\/qni-tutorial-webgpu\/inside_the_qft\/$/);await expect(page.locator('h1')).toHaveText('QFT の内部')})
