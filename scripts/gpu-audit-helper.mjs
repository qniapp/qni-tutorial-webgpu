// Native GPU audit utilities. Geometry follows qni-webgpu's layout/geometry.rs,
// constants.rs, layout/palette.rs and app/drag_controller.rs (no selection API).
import {mkdir, writeFile} from 'node:fs/promises'
import {chromium} from '@playwright/test'

export const isMarker = col => col.some(x => typeof x === 'string' && /^[{\[}\]]/.test(x))
export const gateColumns = circuit => circuit.cols.map((col, source) => ({col, source})).filter(x => !isMarker(x.col))
const k = Math.SQRT1_2
const states = {'|0>': [[1,0],[0,0]], '|1>': [[0,0],[1,0]], '|+>': [[k,0],[k,0]], '|->': [[k,0],[-k,0]], '|i>': [[k,0],[0,k]], '|-i>': [[k,0],[0,-k]]}
export function initialVector(circuit, size) {
 const qubits = Math.log2(size)
 if (!Number.isInteger(qubits)) throw Error(`Invalid state count ${size}`)
 // Embed step 0 applies the first non-marker column, not later preparation gates.
 const first = gateColumns(circuit)[0]?.col ?? []
 // A leading SWAP column (QPE's inverse-QFT example) leaves |0...0> unchanged.
 if (first.some(x => x !== 1 && x !== 'Swap' && !states[x])) throw Error('Step 0 contains non-initialization gates; expected vector must be authored explicitly')
 return Array.from({length:size}, (_,basis) => {
  let re=1, im=0
  for(let q=0;q<qubits;q++) {
   const [a,b]=(states[first[q]] ?? states['|0>'])[(basis >> q)&1]
   ;[re,im]=[re*a-im*b,re*b+im*a]
  }
  return [re,im]
 })
}
export function verify(v, expected) {
 const flat=expected.flat()
 if(v.length!==flat.length || v.some((x,i)=>!Number.isFinite(x)||Math.abs(x-flat[i])>3e-5)) throw Error(`signed vector mismatch: ${JSON.stringify({v,expected:flat})}`)
 const norm=v.reduce((sum,x)=>sum+x*x,0)
 if(Math.abs(norm-1)>5e-5) throw Error(`norm=${norm}`)
 return {values:v,norm}
}
export async function read(page,index) {
 return page.evaluate(async index => {
  const e=document.querySelectorAll('qni-webgpu-circuit')[index]
  return Array.from(await e.runner.readStateVector())
 },index)
}
export async function checkVector(page,index,expected) {
 const deadline=Date.now()+10000
 let error
 do {
  try {return verify(await read(page,index),expected)} catch(e) {error=e}
  await page.waitForTimeout(100)
 } while(Date.now()<deadline)
 throw error
}
export async function circuitJSON(embed) {return embed.evaluate(e=>e.runner.circuitJSON())}
export async function waitJSON(page,index,json) {
 await page.waitForFunction(({index,json})=>document.querySelectorAll('qni-webgpu-circuit')[index].runner.circuitJSON()===json,{index,json})
}
export async function geometry(embed,circuit) {
 const canvas=embed.locator('canvas')
 await canvas.scrollIntoViewIfNeeded()
 const box=await canvas.boundingBox(), width=box.width-16
 const palette=JSON.parse(await embed.getAttribute('palette') ?? 'null')
 if(palette===null || palette.length) throw Error('This audit geometry requires the authored hidden palette')
 return {canvas,box,width,x:8+(width<640?80:162),y:136+(circuit.cols.some(isMarker)?58:0)}
}
export async function columnPosition(page,embed,circuit,source) {
 const columns=gateColumns(circuit), step=columns.findIndex(x=>x.source===source)
 if(step<0) throw Error(`Source column ${source} is a block marker or missing`)
 const g=await geometry(embed,circuit)
 // Reset horizontal scroll deterministically, then scroll to a computed offset.
 await page.mouse.move(g.box.x+g.x,g.box.y+g.y-24)
 await page.mouse.wheel(-100000,0); await page.waitForTimeout(400)
 const max=Math.max(0,(g.x-8)+56*columns.length+40+(g.width<640?16:64)-g.width)
 const offset=Math.min(max,Math.max(0,g.x+56*step-g.width/2))
 if(offset) {await page.mouse.wheel(offset,0);await page.waitForTimeout(400)}
 return {...g,step,position:{x:g.x+56*step-offset,y:g.y-24}}
}
export async function selectColumn(page,embed,circuit,source) {
 const g=await columnPosition(page,embed,circuit,source)
 // 24px above q0 is inside the step hit area but outside its 40px gate.
 await g.canvas.click({position:g.position})
 // Hover takes precedence over the locked step: move out before readback.
 await page.mouse.move(g.box.x+4,g.box.y+4)
 await page.waitForTimeout(200)
 return {source,step:g.step,method:'canvas-layout'}
}
export async function screenshot(canvas,path) {
 await canvas.screenshot({path}); console.log(`SCREENSHOT ${path} (visual evidence, not a glyph/visibility assertion)`)
}
export async function toolbarAudit(page,embed,index,circuit,initial) {
 const columns=gateColumns(circuit)
 const target=columns.find(x=>x.col.includes('H')) ?? columns[0]
 const wire=target.col.includes('H')?target.col.indexOf('H'):target.col.findIndex(x=>x!==1)
 const g=await columnPosition(page,embed,circuit,target.source)
 await page.mouse.move(g.box.x+g.position.x,g.box.y+g.y+56*wire)
 await page.mouse.down();await page.waitForTimeout(100)
 // Drag above all wires: native drop removes the gate.
 await page.mouse.move(g.box.x+g.position.x,g.box.y+55,{steps:12})
 await page.waitForTimeout(100);await page.mouse.up()
 await page.waitForFunction(({index,initial})=>document.querySelectorAll('qni-webgpu-circuit')[index].runner.circuitJSON()!==initial,{index,initial})
 const edited=await circuitJSON(embed)
 for(const [x,json] of [[28,initial],[68,edited],[28,initial],[108,initial]]) {
  await g.canvas.click({position:{x,y:22}})
  await page.mouse.move(g.box.x+4,g.box.y+4)
  await waitJSON(page,index,json)
 }
 // The old trash location must remain inert after events have been processed.
 await page.waitForTimeout(200)
 if(await circuitJSON(embed)!==initial) throw Error('Former trash location changed circuit')
 return {undoRedo:true,jsonRestored:true,formerTrashInert:true}
}
export async function visualSweep(page,embed,circuit,prefix) {
 const columns=gateColumns(circuit)
 const g=await geometry(embed,circuit), stride=Math.max(1,Math.floor((g.width-100)/56))
 for(let step=0;step<columns.length;step+=stride) {
  await columnPosition(page,embed,circuit,columns[step].source)
  await page.mouse.move(g.box.x+4,g.box.y+4)
  await screenshot(g.canvas,`${prefix}-visual-column${columns[step].source}.png`)
 }
 await columnPosition(page,embed,circuit,columns.at(-1).source)
 await page.mouse.move(g.box.x+4,g.box.y+4)
 await screenshot(g.canvas,`${prefix}-visual-last.png`)
}
export async function scrollFindings(page,width) {
 const findings=await page.evaluate(()=>{
  const roots=[document.body,...document.querySelectorAll('.content-with-margin,.content-with-margin *')]
  for(const e of document.querySelectorAll('qni-webgpu-circuit')) roots.push(...e.shadowRoot.querySelectorAll('*'))
  return roots.filter(e=>{const s=getComputedStyle(e);return (['auto','scroll'].includes(s.overflowX)&&e.scrollWidth>e.clientWidth+1)||(['auto','scroll'].includes(s.overflowY)&&e.scrollHeight>e.clientHeight+1)}).map(e=>e.tagName)
 })
 if(findings.length || await page.evaluate(()=>document.documentElement.scrollWidth)>width) throw Error(`Unexpected DOM overflow: ${JSON.stringify(findings)}`)
 return findings
}
export async function audit({slug,base,out,check}) {
 await mkdir(out,{recursive:true})
 const headless=process.argv.includes('--headless') || (!process.argv.includes('--headed') && process.env.QTW_HEADLESS!=='0')
 const summaries=[],records=[]
 let browser
 try {
  browser=await chromium.launch({headless,executablePath:process.env.QTW_CHROMIUM_PATH || undefined,args:['--enable-unsafe-webgpu','--enable-features=Vulkan','--use-angle=vulkan','--no-sandbox']})
  for(const width of [390,1440]) for(const dpr of [1,2]) {
   let context
   const summary={slug,width,dpr,status:'FAIL'}
   try {
    context=await browser.newContext({viewport:{width,height:1100},deviceScaleFactor:dpr})
    const page=await context.newPage(),errors=[]
    page.setDefaultTimeout(30000)
    page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())})
    await page.goto(new URL(`${slug}/`,base).href)
    if(!await page.evaluate(async()=>!!(navigator.gpu&&await navigator.gpu.requestAdapter()))) throw Error('No real WebGPU adapter; audit cannot pass')
    await page.waitForFunction(()=>document.documentElement.dataset.mathjax==='ready')
    await check({page,width,dpr,records})
    await scrollFindings(page,width)
    if(errors.length) throw Error(`Browser errors: ${JSON.stringify(errors)}`)
    summary.status='PASS'
   } catch(e) {summary.error=e.stack ?? String(e);process.exitCode=1}
   finally {await context?.close()}
   summaries.push(summary)
   console.log(`${summary.status} ${slug} ${width}/DPR${dpr}${summary.error?`: ${summary.error}`:''}`)
  }
 } catch(e) {
  process.exitCode=1
  for(const width of [390,1440]) for(const dpr of [1,2]) {
   summaries.push({slug,width,dpr,status:'FAIL',error:String(e)})
   console.error(`FAIL ${slug} ${width}/DPR${dpr}: ${e}`)
  }
 } finally {
  await browser?.close()
  await writeFile(`${out}/result.json`,JSON.stringify({base,slug,headless,realGPURequired:true,visualEvidenceOnly:true,summaries,records},null,2)+'\n')
 }
}
