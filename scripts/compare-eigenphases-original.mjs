// Browser comparison against the actual original site; explicitly no WebGPU.
import {chromium} from '@playwright/test'
import {readFile,writeFile} from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
const golden=JSON.parse(await readFile(new URL('../tests/fixtures/eigenphases-approved-text.json',import.meta.url)))
const originalCircuits=JSON.parse(await readFile(new URL('../tests/fixtures/eigenphases-original.json',import.meta.url))).circuits
const base=process.env.QTW_AUDIT_URL ?? 'https://qniapp.github.io/qni-tutorial-webgpu/'
const browser=await chromium.launch({args:['--no-sandbox','--disable-gpu']})
const results=[]
try{
 for(const width of [390,1440])for(const dpr of [1,2]){
 const context=await browser.newContext({viewport:{width,height:1100},deviceScaleFactor:dpr})
 const snapshots=[]
 for(const url of ['https://qniapp.github.io/qni/eigenphases.html',new URL('eigenphases/',base).href]){
 const page=await context.newPage()
 await page.addInitScript(()=>Object.defineProperty(navigator,'gpu',{configurable:true,value:undefined}))
 await page.goto(url);await page.waitForFunction(()=>window.MathJax?.startup?.document?.math)
 await page.evaluate(async()=>{await window.MathJax.startup.promise;await document.fonts.ready})
 const snapshot=await page.evaluate(()=>{
 const root=document.querySelector('.content-with-margin');if(!root)throw Error('Missing content root')
 const walk=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);let text='',node
 while(node=walk.nextNode()){
 if(!node.parentElement.closest('footer,script,style,mjx-container,orbit-reviewarea,qni-webgpu-circuit,quantum-simulator,quantum-circuit,circle-notation,qubit-circle')&&!(node.parentElement.closest('a')&&node.textContent.replace(/\s+/g,'')==='Qniで開く'))text+=node.textContent
 }
 const normalize=s=>s.replace(/\s+/g,'').normalize('NFC')
 return {text:normalize(text),math:Array.from(window.MathJax.startup.document.math).filter(item=>root.contains(item.typesetRoot)&&!item.typesetRoot.closest('quantum-simulator,quantum-circuit,circle-notation,qubit-circle,qni-webgpu-circuit')).map(item=>({tex:normalize(item.math),display:item.display})),circuits:[...root.querySelectorAll('quantum-circuit[data-json],qni-webgpu-circuit[circuit]')].map(e=>JSON.parse(e.getAttribute('data-json')??e.getAttribute('circuit')))}
 })
 snapshot.url=url;snapshots.push(snapshot)
 await page.screenshot({path:path.join(os.tmpdir(), `qtw-eigenphases-live-${snapshots.length===1?'original':'ours'}-${width}-dpr${dpr}.png`),fullPage:true})
 await page.close()
 }
 const original=snapshots[0],ours=snapshots[1]
 const approvedText=original.text.replace('ユニークな状態ベクトル','状態ベクトル').replace('独自の(固有の)状態ベクトル','固有状態')
 const result={width,dpr,base,snapshots,approvedTextDiffZero:approvedText===ours.text,sourceGoldenTextMatches:ours.text===golden.text,texDiffZero:JSON.stringify(original.math)===JSON.stringify(ours.math),sourceGoldenTexMatches:JSON.stringify(ours.math)===JSON.stringify(golden.math),originalJSONMatches:JSON.stringify(original.circuits)===JSON.stringify(originalCircuits),oursJSONMatches:JSON.stringify(ours.circuits)===JSON.stringify(originalCircuits),WebGPUExecuted:false}
 results.push(result)
 if(Object.entries(result).some(([k,v])=>k.endsWith('Zero')||k.endsWith('Matches')?v!==true:false))throw Error(JSON.stringify(result))
 await context.close()
 }
 console.log('PASS original/live diff: approved two phrases only; TeX and JSON unchanged (4 cases)')
}finally{await writeFile(path.join(os.tmpdir(), 'qtw-eigenphases-live-comparison.json'),JSON.stringify(results,null,2)+'\n');await browser.close()}
