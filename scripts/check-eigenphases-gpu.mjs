// Unattended native GPU audit; no mocks or CPU simulation.
import {readFile} from 'node:fs/promises'
import {audit,freshCircuit,initialVector,checkVector,selectColumn,screenshot,toolbarAudit,visualSweep} from './gpu-audit-helper.mjs'
const base=process.env.QTW_AUDIT_URL ?? 'https://qniapp.github.io/qni-tutorial-webgpu/'
const out=process.env.QTW_AUDIT_OUTPUT ?? '/tmp/qtw-eigenphases-gpu'
const fixed=JSON.parse(await readFile(new URL('../tests/fixtures/eigenphases-original.json',import.meta.url)))
const c=Math.cos(Math.PI/8),s=Math.sin(Math.PI/8)
await audit({slug:'eigenphases',base,out,async check({page,width,dpr,records}) {
 for(let index=0;index<2;index++) {
  const fixture=fixed.circuits[index]
  const {embed,canvas,circuit,columns,stepCount}=await freshCircuit(page,index,fixture)
  await selectColumn(page,embed,circuit,columns[0].source)
  const prefix=`${out}/${width}-dpr${dpr}-${index}`
  const record={base,width,dpr,index,stepCount,start:await checkVector(page,index,initialVector(circuit,2))}
  await screenshot(canvas,`${prefix}-step0.png`)
  const preparation=columns.find(x=>x.col.some(g=>typeof g==='string'&&g.startsWith('Ry(')))
  if(!preparation) throw Error('Missing authored Ry preparation')
  record.preparationSelection=await selectColumn(page,embed,circuit,preparation.source)
  record.preparation=await checkVector(page,index,index===0?[c,0,s,0]:[-s,0,c,0])
  await screenshot(canvas,`${prefix}-preparation.png`)
  record.finalSelection=await selectColumn(page,embed,circuit,columns.at(-1).source)
  record.final=await checkVector(page,index,index===0?[c,0,s,0]:[s,0,-c,0])
  await screenshot(canvas,`${prefix}-final.png`)
  await visualSweep(page,embed,circuit,prefix)
  // Keep edit/undo/redo isolated from all authored-column checks.
  const toolbar=await freshCircuit(page,index,fixture)
  await selectColumn(page,toolbar.embed,toolbar.circuit,toolbar.columns[0].source)
  record.toolbar=await toolbarAudit(page,toolbar.embed,index,toolbar.circuit,toolbar.initial)
  const restored=await freshCircuit(page,index,fixture)
  await selectColumn(page,restored.embed,restored.circuit,restored.columns[0].source)
  record.restoredStep0=await checkVector(page,index,initialVector(restored.circuit,2))
  records.push(record)
 }
}})
