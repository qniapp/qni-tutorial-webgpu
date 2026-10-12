import assert from 'node:assert/strict'
import {test} from '@playwright/test'
import {runInNewContext} from 'node:vm'
import {circuitJSONEqual,freshCircuit,scrollFindings} from '../scripts/gpu-audit-helper.mjs'

const json=cols=>JSON.stringify({cols})

test('overflow uses the actual viewport, but still rejects document overflow',async()=>{
 const check=async(scrollWidth,clientWidth,innerWidth)=>{
  const document={body:{},documentElement:{scrollWidth,clientWidth},querySelectorAll:()=>[]}
  const page={evaluate:async fn=>runInNewContext(`(${fn})()`,{document,window:{innerWidth},getComputedStyle:()=>({})})}
  return scrollFindings(page)
 }
 // A native DPR2 window requested at 390 CSS px can have a different viewport.
 assert.equal((await check(500,500,500)).length,0)
 await assert.rejects(check(501,500,500),/Unexpected DOM overflow/)
 await assert.rejects(check(501,500,501),/Unexpected DOM overflow/)
})

test('fresh circuit reload restores authored trailing identities and step mapping',async()=>{
 const fixture={cols:[['H'],[1],[1]]}
 let circuit={cols:[['H']]},reloads=0
 const runner={circuitJSON:()=>JSON.stringify(circuit),selectStep:()=>{},stepCount:()=>circuit.cols.length}
 const canvas={scrollIntoViewIfNeeded:async()=>{}}
 const embed={locator:()=>canvas,evaluate:async(fn,arg)=>fn({runner},arg)}
 const page={
  reload:async()=>{reloads++;circuit=structuredClone(fixture)},
  waitForFunction:async()=>{},
  locator:()=>({nth:()=>embed}),
 }
 const fresh=await freshCircuit(page,0,fixture)
 assert.equal(reloads,1)
 assert.equal(fresh.stepCount,3)
 assert.deepEqual(fresh.columns.map(x=>x.source),[0,1,2])
 assert.deepEqual(fresh.circuit,fixture)
})
test('edit/undo normalization ignores angles and trailing identity columns',()=>{
 assert.ok(circuitJSONEqual(json([['Z^(-π/2)'],[1],[1,1]]),json([['Z^(-π_2)']])))
 assert.ok(circuitJSONEqual(json([]),json([[1],[1,1]])))
 assert.ok(circuitJSONEqual(json([['H'],[1]]),json([['H'],[1],[1]])))
})
test('interior identity columns and non-identity trailing columns remain significant',()=>{
 assert.equal(circuitJSONEqual(json([['H'],[1],['X']]),json([['H'],['X']])),false)
 assert.equal(circuitJSONEqual(json([[1],['H']]),json([['H']])),false)
 assert.equal(circuitJSONEqual(json([['H'],['X']]),json([['H']])),false)
 assert.equal(circuitJSONEqual(json([['H'],['1']]),json([['H']])),false)
 assert.equal(circuitJSONEqual(JSON.stringify({cols:[['H']],extra:1}),json([['H']])),false)
})
