// Unattended native GPU audit; no mocks or CPU simulation.
import {audit,gateColumns,initialVector,checkVector,circuitJSON,selectColumn,screenshot,toolbarAudit,visualSweep} from './gpu-audit-helper.mjs'
const base=process.env.QTW_AUDIT_URL ?? 'https://qniapp.github.io/qni-tutorial-webgpu/'
const out=process.env.QTW_AUDIT_OUTPUT ?? '/tmp/qtw-eigenphases-gpu'
const c=Math.cos(Math.PI/8),s=Math.sin(Math.PI/8)
await audit({slug:'eigenphases',base,out,async check({page,width,dpr,records}) {
 for(let index=0;index<2;index++) {
  const embed=page.locator('qni-webgpu-circuit').nth(index),canvas=embed.locator('canvas')
  await canvas.scrollIntoViewIfNeeded()
  await page.waitForFunction(i=>document.querySelectorAll('qni-webgpu-circuit')[i].dataset.state==='running',index)
  const initial=await circuitJSON(embed),circuit=JSON.parse(initial),columns=gateColumns(circuit)
  const prefix=`${out}/${width}-dpr${dpr}-${index}`
  const record={base,width,dpr,index,start:await checkVector(page,index,initialVector(circuit,2))}
  await screenshot(canvas,`${prefix}-step0.png`)
  const preparation=columns.find(x=>x.col.some(g=>typeof g==='string'&&g.startsWith('Ry(')))
  if(!preparation) throw Error('Missing authored Ry preparation')
  record.preparationSelection=await selectColumn(page,embed,circuit,preparation.source)
  record.preparation=await checkVector(page,index,index===0?[c,0,s,0]:[-s,0,c,0])
  await screenshot(canvas,`${prefix}-preparation.png`)
  record.finalSelection=await selectColumn(page,embed,circuit,columns.at(-1).source)
  record.final=await checkVector(page,index,index===0?[c,0,s,0]:[s,0,-c,0])
  await screenshot(canvas,`${prefix}-final.png`)
  record.toolbar=await toolbarAudit(page,embed,index,circuit,initial)
  record.restoredStep0=await checkVector(page,index,initialVector(circuit,2))
  await visualSweep(page,embed,circuit,prefix)
  records.push(record)
 }
}})
