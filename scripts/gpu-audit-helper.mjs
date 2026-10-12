// Native GPU audit utilities; semantic step selection requires qni-webgpu #66.
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
// Geometry is only for the automated edit/undo/redo toolbar audit, never selection.
async function toolbarGeometry(embed,circuit) {
 const canvas=embed.locator('canvas')
 await canvas.scrollIntoViewIfNeeded()
 const box=await canvas.boundingBox()
 const palette=JSON.parse(await embed.getAttribute('palette') ?? 'null')
 if(palette===null || palette.length) throw Error('This audit geometry requires the authored hidden palette')
 // qni-webgpu 3842657, paths relative to apps/web/src (all CSS px, no DPR scaling):
 // app/embed.rs: CentralPanel margin = 8; app.rs::circuit_origin and
 // layout/geometry.rs::CircuitGutters: compact below content width 640.
 // constants.rs: LINE_LEFT_OFFSET = 64+42+16, compact left = 40;
 // first slot = line left + GATE_SIZE (40), LINE_GAP = 56.
 const margin=8, width=box.width-2*margin, gateSize=40, lineGap=56
 const lineLeft=width<640?40:64+42+16
 // constants.rs: LINE_Y = 80+(40*2+8)+20+48+20 = 256.
 // layout/palette.rs::circuit_shift_y: hidden palette subtracts 88+40 = 128.
 // app.rs::circuit_block_outset_y: blocks add 32+2+24 = 58.
 const y=margin+256-128+(circuit.cols.some(isMarker)?32+2+24:0)
 // render/toolbar.rs: viewport origin, margin (12,6), TOOL_SIZE 32,
 // horizontal gap 8. Embeds have no picker or clear button (app/embed.rs).
 const toolSize=32, toolGap=8, toolbarY=6+toolSize/2
 const undo={x:12+toolSize/2,y:toolbarY}
 const redo={x:undo.x+toolSize+toolGap,y:toolbarY}
 // drag_controller/drop.rs deletes beyond SNAP_DISTANCE (40) from every wire.
 return {canvas,box,x:margin+lineLeft+gateSize,y,lineGap,dropY:y-40-gateSize/2,undo,redo}
}
export async function validateRunner(embed,fixture) {
 const expected=gateColumns(fixture).length
 return embed.evaluate((e,expected)=>{
  const runner=e.runner
  if(typeof runner?.selectStep!=='function') throw Error('embed lacks runner.selectStep; requires qni-webgpu #66')
  const actual=runner.stepCount()
  if(actual!==expected) throw Error(`runner.stepCount()=${actual}; fixture has ${expected} non-marker columns`)
  return actual
 },expected)
}
export async function selectColumn(page,embed,circuit,source) {
 const step=gateColumns(circuit).findIndex(x=>x.source===source)
 if(step<0) throw Error(`Source column ${source} is a block marker or missing`)
 return embed.evaluate(async(e,{source,step})=>{
  const runner=e.runner
  if(typeof runner?.selectStep!=='function') throw Error('embed lacks runner.selectStep; requires qni-webgpu #66')
  runner.selectStep(step)
  // This read waits for GPU completion, not a guessed timeout after selection.
  await runner.readStateVector()
  const selected=runner.selectedStep()
  if(selected!==step) throw Error(`runner.selectedStep()=${selected}; expected ${step}`)
  return {source,step,method:'runner.selectStep'}
 },{source,step})
}
export async function screenshot(canvas,path) {
 await canvas.screenshot({path}); console.log(`SCREENSHOT ${path} (visual evidence, not a glyph/visibility assertion)`)
}
export async function toolbarAudit(page,embed,index,circuit,initial) {
 const columns=gateColumns(circuit)
 // Edit the initially visible first column; no scrolling or column hit-testing.
 const wire=columns[0].col.findIndex(x=>x!==1)
 if(wire<0) throw Error('Toolbar audit needs a gate in the first column')
 const g=await toolbarGeometry(embed,circuit)
 // egui consumes pointer events on render frames: allow hover and held press
 // to be rendered separately, rather than batching a whole click into one frame.
 await page.mouse.move(g.box.x+g.x,g.box.y+g.y+g.lineGap*wire)
 await page.waitForTimeout(150)
 await page.mouse.down();await page.waitForTimeout(150)
 // Drag above all wires by more than SNAP_DISTANCE: native drop removes the gate.
 await page.mouse.move(g.box.x+g.x,g.box.y+g.dropY,{steps:12})
 await page.waitForTimeout(150);await page.mouse.up()
 await page.mouse.move(g.box.x+4,g.box.y+4)
 await page.waitForTimeout(150)
 await page.waitForFunction(({index,initial})=>document.querySelectorAll('qni-webgpu-circuit')[index].runner.circuitJSON()!==initial,{index,initial})
 const edited=await circuitJSON(embed)
 for(const [position,json] of [[g.undo,initial],[g.redo,edited],[g.undo,initial]]) {
  await page.mouse.move(g.box.x+position.x,g.box.y+position.y)
  await page.waitForTimeout(150)
  await page.mouse.down();await page.waitForTimeout(150)
  await page.mouse.up();await page.waitForTimeout(150)
  await page.mouse.move(g.box.x+4,g.box.y+4)
  await page.waitForTimeout(150)
  await waitJSON(page,index,json)
 }
 // #63 removed Clear from embeds; there is no third edit button to audit.
 return {undoRedo:true,jsonRestored:true}
}
export async function visualSweep(page,embed,circuit,prefix) {
 const columns=gateColumns(circuit)
 const canvas=embed.locator('canvas')
 for(const {source} of columns) {
  await selectColumn(page,embed,circuit,source)
  await screenshot(canvas,`${prefix}-visual-column${source}.png`)
 }
 // API selection does not promise horizontal auto-scroll or all-gate visibility.
 await screenshot(canvas,`${prefix}-visual-last.png`)
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
