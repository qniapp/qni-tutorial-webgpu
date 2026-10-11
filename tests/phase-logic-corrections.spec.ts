import {expect,test} from '@playwright/test'
import phaseSource from './fixtures/phase_logic-original.json' with {type:'json'}
import phaseText from './fixtures/phase_logic-approved-text.json' with {type:'json'}
import combinationText from './fixtures/phase_logic_combination-approved-text.json' with {type:'json'}
for(const width of [390,1440]) for(const slug of ['phase_logic','phase_logic_combination']) test(`authorized phase logic changes only: ${slug} at ${width}`,async({page})=>{
  await page.setViewportSize({width,height:1100})
  await page.goto(`/qni-tutorial-webgpu/${slug}/`)
  await page.waitForFunction(()=>document.documentElement.dataset.mathjax==='ready')
  const text=await page.evaluate(()=>{
    const root=document.querySelector('.content-with-margin')!,walk=document.createTreeWalker(root,NodeFilter.SHOW_TEXT)
    let text='',node
    while((node=walk.nextNode())) if(!node.parentElement!.closest('footer,script,style,mjx-container,orbit-reviewarea,quantum-simulator,quantum-circuit,qni-webgpu-circuit,[data-original-image]')) text+=node.textContent
    return text.replace(/\s+/g,'').normalize('NFC')
  })
  expect(text).toBe((slug==='phase_logic'?phaseText:combinationText).text)
  if(slug==='phase_logic'){
    expect(phaseSource.approvedAmplitudeIndices).toHaveLength(40)
    const actual=await page.locator('main qubit-circle:not([data-original-image] qubit-circle)').evaluateAll(es=>es.map(e=>e.getAttribute('data-amplitude')))
    expect(actual).toEqual(phaseSource.amplitudes.map((a,i)=>phaseSource.approvedAmplitudeIndices.includes(i)?a.amplitude.replace('0.70711','0.5'):a.amplitude))
    // Inverse whitelist: the original coefficients, including 1-qubit pNOT, remain recoverable.
    expect(actual.map((a,i)=>phaseSource.approvedAmplitudeIndices.includes(i)?a!.replace('0.5','0.70711'):a)).toEqual(phaseSource.amplitudes.map(a=>a.amplitude))
  }else{
    expect((await page.locator('main code').allTextContents()).filter(s=>s==='(a OR (NOT b)) AND c')).toHaveLength(2)
    await expect(page.locator('[data-logic-result]')).toHaveCount(2)
    expect(await page.locator('[data-logic-result]').first().locator('qubit-circle').evaluateAll(es=>es.map((e,i)=>e.getAttribute('data-amplitude')?.startsWith('-')?i:null).filter(i=>i!==null))).toEqual([4,5,7])
  }
  await page.evaluate(()=>document.fonts.ready)
  await expect.poll(()=>page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(width)
})
