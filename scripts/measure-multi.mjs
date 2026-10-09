// Hardware WebGPU multi-embed checks and measurements. GPU readback is test-only.
// Usage: node scripts/measure-multi.mjs BASE_URL OUTPUT_JSON [pairs=3]
import { chromium } from '@playwright/test'
import { writeFile } from 'node:fs/promises'
const base = process.argv[2] ?? 'https://qniapp.github.io/qni-tutorial-webgpu/'
const output = process.argv[3] ?? '/tmp/qtw-multi-live.json'
const pairs = Number(process.argv[4] ?? 3)
const median = xs => { const sorted = [...xs].sort((a,b)=>a-b); return sorted[Math.floor(sorted.length/2)] }
const result = { base, pairs, browser: null, flags: ['--enable-unsafe-webgpu','--enable-features=Vulkan','--use-angle=vulkan'], gpuMemoryBytes: null, runs: [], medians: {} }
const browser = await chromium.launch({ executablePath: '/usr/bin/chromium', headless: true, args: result.flags })
result.browser = browser.version()
async function save() {
 for (const count of [1,3,7]) for (const cache of ['cold','warm']) {
  const runs = result.runs.filter(r=>r.count===count&&r.cache===cache)
  if (!runs.length) continue
  result.medians[`${count}-${cache}`] = {
   readyMs: median(runs.map(r=>r.readyMs)), perEmbedReadyMs: Array.from({length:count},(_,i)=>median(runs.map(r=>r.perEmbedReadyMs[i]))),
   jsHeapUsedBytes: median(runs.map(r=>r.jsHeapUsedBytes)), wasmMemoryBytes: median(runs.map(r=>r.wasmMemoryBytes)),
   idleRafMs: median(runs.map(r=>r.idle.p50)), interactingRafMs: median(runs.map(r=>r.interacting.p50)),
   idleRafP95Ms: median(runs.map(r=>r.idle.p95)), interactingRafP95Ms: median(runs.map(r=>r.interacting.p95)),
  }
 }
 await writeFile(output, JSON.stringify(result,null,2))
}
function sampleFrames(duration) {
 return new Promise(resolve=>{
  const values=[]; let start, previous
  function frame(time) {
   start ??= time
   if (previous!==undefined) values.push(time-previous)
   previous=time
   if (time-start<duration) requestAnimationFrame(frame)
   else { const sorted=[...values].sort((a,b)=>a-b); resolve({ intervals:values, p50:sorted[Math.floor(sorted.length/2)], p95:sorted[Math.floor(sorted.length*0.95)] }) }
  }
  requestAnimationFrame(frame)
 })
}
try {
 for (const count of [1,3,7]) for (let pair=0;pair<pairs;pair++) {
  const context=await browser.newContext({ viewport:{width:1280,height:900} })
  const page=await context.newPage()
  await page.addInitScript(()=>{
   window.__multi={ready:{},devices:[],memories:[],streaming:0}
   new MutationObserver(records=>{ for(const {target} of records) if(target.localName==='qni-webgpu-circuit'&&target.dataset.state==='running'&&window.__multi.ready[target.id]===undefined) window.__multi.ready[target.id]=performance.now() }).observe(document,{subtree:true,attributes:true,attributeFilter:['data-state']})
   const request=GPUAdapter.prototype.requestDevice
   GPUAdapter.prototype.requestDevice=async function(...args){ const device=await request.apply(this,args); window.__multi.devices.push(device); return device }
   const instantiate=WebAssembly.instantiateStreaming
   WebAssembly.instantiateStreaming=async function(...args){ const value=await instantiate.apply(this,args); window.__multi.streaming++; window.__multi.memories.push(value.instance.exports.memory); return value }
  })
  const cdp=await context.newCDPSession(page)
  await cdp.send('Performance.enable')
  let errors=[],pageErrors=[]
  page.on('console',m=>{if(m.type()==='error')errors.push(m.text())})
  page.on('pageerror',e=>pageErrors.push(e.message))
  for (const cache of ['cold','warm']) {
   errors=[];pageErrors=[]
   if(cache==='cold') await page.goto(new URL(`multi-${count}/`,base).href)
   else await page.reload()
   await page.waitForFunction(n=>document.querySelectorAll('qni-webgpu-circuit[data-state="running"]').length===n,count,{timeout:30000})
   const run=await page.evaluate(({count,pair,cache})=>{
    const times=Array.from({length:count},(_,i)=>window.__multi.ready[`circuit-${i}`])
    const wasm=performance.getEntriesByType('resource').filter(e=>e.name.endsWith('qni-web_bg.wasm'))
    return {count,pair,cache,perEmbedReadyMs:times,readyMs:Math.max(...times),devices:window.__multi.devices.length,streaming:window.__multi.streaming,wasmRequests:wasm.length,wasmTransferBytes:wasm[0]?.transferSize,wasmDecodedBytes:wasm[0]?.decodedBodySize,wasmMemoryBytes:window.__multi.memories.reduce((n,m)=>n+m.buffer.byteLength,0),uaMemoryApiAvailable:typeof performance.measureUserAgentSpecificMemory==='function'&&crossOriginIsolated}
   },{count,pair,cache})
   const adapter=await page.evaluate(async()=>{ const a=await navigator.gpu.requestAdapter();return {vendor:a.info.vendor,architecture:a.info.architecture,device:a.info.device,description:a.info.description} })
   run.adapter=adapter
   if(adapter.vendor!=='amd') throw new Error(`Unexpected hardware adapter: ${JSON.stringify(adapter)}`)
   if(run.devices!==1||run.streaming!==1||run.wasmRequests!==1||run.perEmbedReadyMs.some(t=>!Number.isFinite(t))) throw new Error(`Initialization not shared: ${JSON.stringify(run)}`)
   const metrics=await cdp.send('Performance.getMetrics')
   run.jsHeapUsedBytes=metrics.metrics.find(m=>m.name==='JSHeapUsedSize').value
   await page.waitForFunction(async()=>{try{return(await Promise.all([...document.querySelectorAll('qni-webgpu-circuit')].map(e=>e.readStateVector()))).every(v=>v.length>0)}catch{return false}})
   run.before=await page.evaluate(async()=>Promise.all([...document.querySelectorAll('qni-webgpu-circuit')].map(async e=>Array.from(await e.readStateVector()))))
   run.idle=await page.evaluate(sampleFrames,2000)
   const canvas=page.locator('qni-webgpu-circuit').first().locator('canvas')
   const box=await canvas.boundingBox()
   const sampling=page.evaluate(sampleFrames,2000)
   await page.mouse.move(box.x+box.width*0.2,box.y+120)
   await page.mouse.down()
   for(let i=0;i<40;i++){await page.mouse.move(box.x+box.width*0.2+i*2,box.y+120+i*3);await page.waitForTimeout(45)}
   await page.mouse.up()
   await page.mouse.move(0,0)
   run.interacting=await sampling
   await page.evaluate(()=>document.querySelector('qni-webgpu-circuit').setAttribute('circuit','{"cols":[["X","|0>"]]}'))
   await page.waitForFunction(n=>document.querySelectorAll('qni-webgpu-circuit[data-state="running"]').length===n,count)
   await page.waitForTimeout(150)
   run.after=await page.evaluate(async()=>Promise.all([...document.querySelectorAll('qni-webgpu-circuit')].map(async e=>Array.from(await e.readStateVector()))))
   run.isolation=JSON.stringify(run.before.slice(1))===JSON.stringify(run.after.slice(1))&&JSON.stringify(run.before[0])!==JSON.stringify(run.after[0])
   run.errors=[...errors];run.pageErrors=[...pageErrors]
   result.runs.push(run)
   await save()
   if(!run.isolation||errors.length||pageErrors.length) throw new Error(`Live isolation/errors failed: ${JSON.stringify(run)}`)
   console.log(count,pair,cache,run.readyMs,run.jsHeapUsedBytes,run.wasmMemoryBytes,run.idle.p50,run.interacting.p50)
  }
  await context.close()
 }
 console.log(JSON.stringify(result.medians,null,2))
} finally { await save(); await browser.close() }
