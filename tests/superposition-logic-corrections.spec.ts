import {expect,test} from '@playwright/test'
import original from './fixtures/superposition_quantum_logic-original.json' with {type:'json'}
import approvedText from './fixtures/superposition-logic-approved-text.json' with {type:'json'}

for(const width of [390,1440]) test(`approved superposition logic wording only at ${width}`, async({page})=>{
  await page.setViewportSize({width,height:1100})
  await page.goto('/qni-tutorial-webgpu/superposition_quantum_logic/')
  await page.waitForFunction(()=>document.documentElement.dataset.mathjax==='ready')
  const faithful=await page.evaluate(()=>{
    const root=document.querySelector('.content-with-margin')!,walk=document.createTreeWalker(root,NodeFilter.SHOW_TEXT)
    let text='',node
    while((node=walk.nextNode())) if(!node.parentElement!.closest('footer,script,style,mjx-container,orbit-reviewarea,quantum-simulator,quantum-circuit,qni-webgpu-circuit,[data-original-image]')) text+=node.textContent
    return text.replace(/\s+/g,'').normalize('NFC')
  })
  expect(faithful).toEqual(approvedText.text)
  const codes=await page.locator('main code').allTextContents()
  expect(codes.filter(s=>s.trim()==='(a OR (NOT b)) AND c')).toHaveLength(5)
  expect(codes).toContain('(a || !b) && c')
  expect(codes).not.toContain('a || !b && c')
  const text=(await page.locator('main').textContent())!.replace(/\s+/g,'')
  expect(text).toContain('(0,0,1)')
  expect(text).not.toContain('(1,0,0)')
  expect(text).toContain('(1,0,1)')
  expect(text).toContain('(1,1,1)')
  expect(text).toContain('答は4,5,7')
  expect(text).toContain('3ビットなら入力は8通り')
  expect(text).toContain('NOTはb自身を反転するだけで済みますが、ORとAND演算にはそれぞれ出力用のビットが必要なので、aOR(NOTb)の結果をd(ビット4),dANDcの結果をe(ビット5)に出力しています。')
  expect(text).toContain('また、最後に結果e以外のビット(a,b,c,d)をアンコンピューテーションで戻しておきます。')
  expect(await page.locator('main table th').allTextContents()).toEqual(['a','b','c','(a OR (NOT b)) AND c'])
  expect(await page.locator('main table tbody tr').evaluateAll(rows=>rows.map(r=>Array.from(r.querySelectorAll('td'),td=>td.textContent)))).toEqual([
    ['0','0','0','0'],['0','0','1','1'],['0','1','0','0'],['0','1','1','0'],['1','0','0','0'],['1','0','1','1'],['1','1','0','0'],['1','1','1','1'],
  ])
  expect(await page.locator('main table tbody tr').evaluateAll(rows=>rows.map(r=>!!r.querySelector('td:last-child strong')))).toEqual([false,true,false,false,false,true,false,true])
  expect(await page.locator('qni-webgpu-circuit').evaluateAll(es=>es.map(e=>JSON.parse(e.getAttribute('circuit')!)))).toEqual(original.circuits)
  await expect(page.locator('[data-logic-result] qubit-circle')).toHaveCount(32)
  expect(await page.locator('[data-logic-result] qubit-circle').evaluateAll(es=>es.map((e,i)=>e.getAttribute('data-amplitude')==='0'?null:i).filter(i=>i!==null))).toEqual([0,1,2,3,6,20,21,23])
  expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(width)
})
