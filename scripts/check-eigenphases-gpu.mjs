// Real native audit, run on a GPU desktop. No mocks or CPU simulation.
// Interactive: select the indicated native columns, inspect toolbar and exercise undo/redo.
import {chromium} from '@playwright/test'
import {createInterface} from 'node:readline/promises'
import {mkdir,writeFile} from 'node:fs/promises'
const base=process.env.QTW_AUDIT_URL ?? 'https://qniapp.github.io/qni-tutorial-webgpu/'
const out=process.env.QTW_AUDIT_OUTPUT ?? '/tmp/qtw-eigenphases-gpu'
await mkdir(out,{recursive:true})
const terminal=createInterface({input:process.stdin,output:process.stdout})
const browser=await chromium.launch({headless:false,args:['--enable-unsafe-webgpu','--enable-features=Vulkan','--use-angle=vulkan','--no-sandbox']})
const records=[]
const c=Math.cos(Math.PI/8),s=Math.sin(Math.PI/8)
function verify(v,expected){
 if(v.length!==4||v.some((x,i)=>!Number.isFinite(x)||Math.abs(x-expected[i])>2e-5))throw Error(`signed vector mismatch: ${JSON.stringify({v,expected})}`)
 const norm=v.reduce((a,x)=>a+x*x,0);if(Math.abs(norm-1)>2e-5)throw Error(`norm=${norm}`)
 return {values:v,norm}
}
async function read(page,index){return page.evaluate(async index=>{
 const e=document.querySelectorAll('qni-webgpu-circuit')[index]
 const deadline=performance.now()+10000
 while(performance.now()<deadline){try{const v=Array.from(await e.runner.readStateVector());if(v.length)return v}catch{}
 await new Promise(r=>setTimeout(r,50))}
 throw Error('GPU readback unavailable')
},index)}
try{
 for(const width of [390,1440])for(const dpr of [1,2]){
 const context=await browser.newContext({viewport:{width,height:1100},deviceScaleFactor:dpr});const page=await context.newPage();const errors=[]
 page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())})
 await page.goto(new URL('eigenphases/',base).href)
 if(!await page.evaluate(async()=>!!(navigator.gpu&&await navigator.gpu.requestAdapter())))throw Error('No real WebGPU adapter; audit cannot pass')
 await page.waitForFunction(()=>document.documentElement.dataset.mathjax==='ready')
 for(let index=0;index<2;index++){
 const embed=page.locator('qni-webgpu-circuit').nth(index);const canvas=embed.locator('canvas');await canvas.scrollIntoViewIfNeeded()
 await page.waitForFunction(index=>document.querySelectorAll('qni-webgpu-circuit')[index].dataset.state==='running',index)
 const record={base,width,dpr,index,start:verify(await read(page,index),[1,0,0,0])}
 await canvas.screenshot({path:`${out}/${width}-dpr${dpr}-${index}-step0.png`})
 const initial=await embed.evaluate(e=>e.runner.circuitJSON())
 await terminal.question(`${width}/DPR${dpr}/回路${index+1}: step0、全ゲート可視、palette非表示、Regular字形を画面で確認。Ry列を選択しEnter: `)
 record.preparation=verify(await read(page,index),index===0?[c,0,s,0]:[-s,0,c,0])
 await terminal.question('最後のH列を選択しEnter: ')
 record.final=verify(await read(page,index),index===0?[c,0,s,0]:[s,0,-c,0])
 await canvas.screenshot({path:`${out}/${width}-dpr${dpr}-${index}-final.png`})
 const answer=await terminal.question('ツールバーがundo/redoのみ(旧trashなし)を目視。Hを一時削除→undoで復元→redoで削除→undoで復元。旧trash位置クリックも無効果、全ゲート可視を確認できたら yes: ')
 if(answer.trim()!=='yes')throw Error('Manual toolbar/visibility checks not confirmed')
 if(await embed.evaluate(e=>e.runner.circuitJSON())!==initial)throw Error('Circuit was not restored after undo/redo/trash audit')
 record.manualToolbarAndVisibilityConfirmed=true
 record.scrollFindings=await page.evaluate(()=>{
 const roots=[document.body,...document.querySelectorAll('.content-with-margin,.content-with-margin *')];for(const e of document.querySelectorAll('qni-webgpu-circuit'))roots.push(...e.shadowRoot.querySelectorAll('*'))
 return roots.filter(e=>{const s=getComputedStyle(e);return(['auto','scroll'].includes(s.overflowX)&&e.scrollWidth>e.clientWidth+1)||(['auto','scroll'].includes(s.overflowY)&&e.scrollHeight>e.clientHeight+1)}).map(e=>e.tagName)
 })
 if(record.scrollFindings.length||await page.evaluate(()=>document.documentElement.scrollWidth)>width||errors.length)throw Error(JSON.stringify({record,errors}))
 records.push(record)
 }
 await context.close()
 }
 await writeFile(`${out}/result.json`,JSON.stringify({base,realGPU:true,records},null,2)+'\n')
 console.log(`PASS: ${out}/result.json (manual confirmations explicitly recorded)`)
}finally{await browser.close();terminal.close()}
