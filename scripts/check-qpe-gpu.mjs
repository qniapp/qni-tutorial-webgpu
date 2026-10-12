// Real GPU desktop audit; no mocks/CPU fallback. Column selection and toolbar appearance are manual.
import {chromium} from '@playwright/test'
import {createInterface} from 'node:readline/promises'
import {mkdir,writeFile,readFile} from 'node:fs/promises'
const slug=process.argv[2]??'quantum_phase_estimation_circuit'
if(!['quantum_phase_estimation_circuit','phase_kickback','shor_fx','shor_u'].includes(slug))throw Error('unsupported page')
const fixed=JSON.parse(await readFile(new URL(`../tests/fixtures/${slug}-fixed.json`,import.meta.url)))
const analysis=JSON.parse(await readFile(new URL(slug==='shor_u'?'../tests/fixtures/shor-u-approved-analysis.json':slug==='shor_fx'?'../tests/fixtures/shor-fx-approved-analysis.json':'../tests/fixtures/qpe-approved-analysis.json',import.meta.url)))
const vectors=slug==='shor_u'?analysis.shorUExpected:slug==='shor_fx'?analysis.shorFxExpected:slug==='phase_kickback'?analysis.kickbackExpected:analysis.qpeExpected
const base=process.env.QTW_AUDIT_URL??'https://qniapp.github.io/qni-tutorial-webgpu/'
const out=process.env.QTW_AUDIT_OUTPUT??`/tmp/qtw-${slug}-gpu`;await mkdir(out,{recursive:true})
const terminal=createInterface({input:process.stdin,output:process.stdout})
const browser=await chromium.launch({headless:false,args:['--enable-unsafe-webgpu','--enable-features=Vulkan','--use-angle=vulkan','--no-sandbox']})
const records=[]
function verify(v,expected){const flat=expected.flat();if(v.length!==flat.length||v.some((x,i)=>!Number.isFinite(x)||Math.abs(x-flat[i])>3e-5))throw Error(JSON.stringify({v,expected:flat}));const norm=v.reduce((a,x)=>a+x*x,0);if(Math.abs(norm-1)>5e-5)throw Error(`norm ${norm}`);return {values:v,norm}}
async function read(page,index){return page.evaluate(async index=>{const e=document.querySelectorAll('qni-webgpu-circuit')[index],deadline=performance.now()+10000;while(performance.now()<deadline){try{const v=Array.from(await e.runner.readStateVector());if(v.length)return v}catch{}await new Promise(r=>setTimeout(r,50))}throw Error('GPU readback unavailable')},index)}
try{
for(const width of [390,1440])for(const dpr of [1,2]){
 const context=await browser.newContext({viewport:{width,height:1100},deviceScaleFactor:dpr}),page=await context.newPage(),errors=[]
 page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())})
 await page.goto(new URL(`${slug}/`,base).href)
 if(!await page.evaluate(async()=>!!(navigator.gpu&&await navigator.gpu.requestAdapter())))throw Error('No real WebGPU adapter')
 await page.waitForFunction(()=>document.documentElement.dataset.mathjax==='ready')
 for(let index=0;index<vectors.length;index++){
  const embed=page.locator('qni-webgpu-circuit').nth(index),canvas=embed.locator('canvas');await canvas.scrollIntoViewIfNeeded();await page.waitForFunction(i=>document.querySelectorAll('qni-webgpu-circuit')[i].dataset.state==='running',index)
  const initialExpected=vectors[index].map((_,i)=>[i===0?1:0,0]);const record={base,slug,width,dpr,index,start:verify(await read(page,index),initialExpected)}
  const initial=await embed.evaluate(e=>e.runner.circuitJSON())
  await canvas.screenshot({path:`${out}/${width}-dpr${dpr}-${index}-step0.png`})
  if(slug==='shor_u'){
   record.authoredStages=[]
   for(const stage of analysis.shorUStageExpected){
    await terminal.question(`Shor U: ${stage.stage} authored column ${stage.column} (0-based)を選択してEnter: `)
    record.authoredStages.push({stage:stage.stage,column:stage.column,...verify(await read(page,index),stage.values)})
   }
  }
  const hasMeasurement=fixed.circuits[index].cols.some(col=>col.includes('Measure'))
  await terminal.question(`${slug}/${width}/DPR${dpr}/回路${index} (0-based): step0・palette非表示・全gate可視・Regularを確認。${hasMeasurement?'測定直前の最後のH列':'最後の有効列'}を選択してEnter: `)
  record.finalBeforeMeasurement=verify(await read(page,index),vectors[index])
  await canvas.screenshot({path:`${out}/${width}-dpr${dpr}-${index}-final.png`})
  if(hasMeasurement){
   await terminal.question('測定列を選択してEnter（確率分布は既に測定直前の全signed値で検証済み）: ')
   const values=await read(page,index),N=index===4?8:16,probabilities=Array(N).fill(0)
   for(let i=0;i<values.length;i+=2)probabilities[(i/2)%N]+=values[i]**2+values[i+1]**2
   const outcomes=probabilities.map((p,k)=>({p,k})).filter(x=>x.p>1e-5)
   if(outcomes.length!==1||Math.abs(outcomes[0].p-1)>5e-5||(index===3&&outcomes[0].k!==8))throw Error(JSON.stringify({values,outcomes}))
   record.measuredOutcome={values,outcomes}
  }
  if(await terminal.question('undo/redoのみ・trashなしを目視。ゲート一時削除→undo→redo→undoで元回路復元。旧trash位置クリック無効果、全gate可視を確認したら yes: ')!=='yes')throw Error('Manual checks not confirmed')
  if(await embed.evaluate(e=>e.runner.circuitJSON())!==initial)throw Error('Circuit not restored')
  record.manualToolbarVisibilityConfirmed=true
  if(fixed.embeds[index].runButton){await embed.locator('.run-button').click();await page.waitForTimeout(500);await page.waitForFunction(i=>document.querySelectorAll('qni-webgpu-circuit')[i].dataset.state==='running',index);record.runButtonReplayStep0=verify(await read(page,index),initialExpected)}
  record.scrollFindings=await page.evaluate(()=>{const root=document.querySelector('.content-with-margin'),es=[document.body,root,...root.querySelectorAll('*')];for(const e of root.querySelectorAll('qni-webgpu-circuit'))es.push(...e.shadowRoot.querySelectorAll('*'));return es.filter(e=>{const s=getComputedStyle(e);return(['auto','scroll'].includes(s.overflowX)&&e.scrollWidth>e.clientWidth)||(['auto','scroll'].includes(s.overflowY)&&e.scrollHeight>e.clientHeight)}).map(e=>e.tagName)})
  if(record.scrollFindings.length||await page.evaluate(()=>document.documentElement.scrollWidth)>width||errors.length)throw Error(JSON.stringify({record,errors}))
  records.push(record)
 }
 await context.close()
}
await writeFile(`${out}/result.json`,JSON.stringify({base,slug,realGPU:true,manualConfirmations:true,records},null,2)+'\n');console.log(`PASS ${out}/result.json`)
}finally{await browser.close();terminal.close()}
