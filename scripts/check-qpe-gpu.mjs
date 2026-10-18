// Unattended real GPU audit; no mocks/CPU fallback.
import {readFile} from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import {audit,freshCircuit,gateColumns,initialVector,checkVector,read,circuitJSON,circuitJSONEqual,selectColumn,screenshot,toolbarAudit,visualSweep} from './gpu-audit-helper.mjs'
const slug=process.argv.slice(2).find(x=>!x.startsWith('--')) ?? 'quantum_phase_estimation_circuit'
if(!['quantum_phase_estimation_circuit','phase_kickback','shor_fx','shor_u','shor_qft'].includes(slug)) throw Error('unsupported page')
const fixed=JSON.parse(await readFile(new URL(`../tests/fixtures/${slug}-fixed.json`,import.meta.url)))
const analysis=JSON.parse(await readFile(new URL(slug==='shor_qft'?'../tests/fixtures/shor-qft-approved-analysis.json':slug==='shor_u'?'../tests/fixtures/shor-u-approved-analysis.json':slug==='shor_fx'?'../tests/fixtures/shor-fx-approved-analysis.json':'../tests/fixtures/qpe-approved-analysis.json',import.meta.url)))
const vectors=slug==='shor_qft'?analysis.shorQftExpected:slug==='shor_u'?analysis.shorUExpected:slug==='shor_fx'?analysis.shorFxExpected:slug==='phase_kickback'?analysis.kickbackExpected:analysis.qpeExpected
const base=process.env.QTW_AUDIT_URL ?? 'https://qniapp.github.io/qni-tutorial-webgpu/'
const out=process.env.QTW_AUDIT_OUTPUT ?? path.join(os.tmpdir(), `qtw-${slug}-gpu`)
await audit({slug,base,out,async check({page,width,dpr,records}) {
 for(let index=0;index<vectors.length;index++) {
  const fixture=fixed.circuits[index]
  const {embed,canvas,circuit,columns,stepCount}=await freshCircuit(page,index,fixture)
  await selectColumn(page,embed,circuit,columns[0].source)
  const initialExpected=initialVector(circuit,vectors[index].length)
  const prefix=`${out}/${width}-dpr${dpr}-${index}`
  const record={base,slug,width,dpr,index,stepCount,start:await checkVector(page,index,initialExpected)}
  await screenshot(canvas,`${prefix}-step0.png`)
  if(slug==='shor_u'||slug==='shor_qft') {
   record.authoredStages=[]
   for(const stage of slug==='shor_qft'?analysis.shorQftBeforeExpected:analysis.shorUStageExpected) {
    // Stage column numbers refer to authored JSON, including block markers.
    // Use fixed source numbering, then map onto the runner's semantic columns.
    const step=gateColumns(fixed.circuits[index]).findIndex(x=>x.source===stage.column)
    const selection=await selectColumn(page,embed,circuit,columns[step].source)
    record.authoredStages.push({stage:stage.stage,column:stage.column,selection,...await checkVector(page,index,stage.values)})
    await screenshot(canvas,`${prefix}-stage${stage.column}.png`)
   }
  }
  const measurement=columns.findIndex(x=>x.col.includes('Measure'))
  const final=(measurement<0?columns:columns.slice(0,measurement)).findLast(x=>x.col.some(g=>g!==1))
  if(!final) throw Error('Missing effective pre-measurement column')
  record.finalSelection=await selectColumn(page,embed,circuit,final.source)
  record.finalBeforeMeasurement=await checkVector(page,index,vectors[index])
  await screenshot(canvas,`${prefix}-final.png`)
  if(measurement>=0) {
   record.measurementSelection=await selectColumn(page,embed,circuit,columns[measurement].source)
   const values=await read(page,index),N=index===4?8:16,probabilities=Array(N).fill(0)
   if(values.length!==vectors[index].length*2 || values.some(x=>!Number.isFinite(x))) throw Error('Invalid measurement readback')
   for(let i=0;i<values.length;i+=2) probabilities[slug==='shor_qft'?Math.floor((i/2)/16):(i/2)%N]+=values[i]**2+values[i+1]**2
   const outcomes=probabilities.map((p,k)=>({p,k})).filter(x=>x.p>1e-5)
   if(outcomes.length!==1||Math.abs(outcomes[0].p-1)>5e-5||(slug==='shor_qft'&&![0,4,8,12].includes(outcomes[0].k))||(index===3&&outcomes[0].k!==8)) throw Error(JSON.stringify({values,outcomes}))
   record.measuredOutcome={values,outcomes}
   await screenshot(canvas,`${prefix}-measurement.png`)
  }
  await visualSweep(page,embed,circuit,prefix)
  if(fixed.embeds[index].runButton) {
   // Replay gets an unedited runner, independently of selection/measurement.
   const replay=await freshCircuit(page,index,fixture)
   // Main moved restart inside egui, last in its keyboard focus order.
   await replay.canvas.focus()
   await page.keyboard.press('Shift+Tab')
   await page.waitForTimeout(100)
   await page.keyboard.press('Enter')
   await page.waitForTimeout(500)
   await page.waitForFunction(i=>document.querySelectorAll('qni-webgpu-circuit')[i].dataset.state==='running',index)
   record.runButtonReplayStep0=await checkVector(page,index,initialExpected)
   if(!circuitJSONEqual(await circuitJSON(replay.embed),replay.initial)) throw Error('Run replay changed JSON')
  }
  // Destructive toolbar checks run last, on a separate authored load.
  const toolbar=await freshCircuit(page,index,fixture)
  await selectColumn(page,toolbar.embed,toolbar.circuit,toolbar.columns[0].source)
  record.toolbar=await toolbarAudit(page,toolbar.embed,index,toolbar.circuit,toolbar.initial)
  // Undo can drop trailing identities; verify step 0 only after a fresh load.
  const restored=await freshCircuit(page,index,fixture)
  await selectColumn(page,restored.embed,restored.circuit,restored.columns[0].source)
  record.restoredStep0=await checkVector(page,index,initialExpected)
  records.push(record)
 }
}})
