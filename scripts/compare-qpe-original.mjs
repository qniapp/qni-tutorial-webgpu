// Actual original/live comparison. Native WebGPU is explicitly disabled.
import {chromium} from '@playwright/test'
import {readFile,writeFile} from 'node:fs/promises'
const slug=process.argv[2]??'quantum_phase_estimation_circuit'
if(!['quantum_phase_estimation_circuit','phase_kickback','qpe_output'].includes(slug))throw Error('unsupported page')
const fixed=JSON.parse(await readFile(new URL(`../tests/fixtures/${slug==='qpe_output'?'qpe-output-approved':slug+'-fixed'}.json`,import.meta.url)))
const originalFixture=slug==='qpe_output'?{circuits:[]}:JSON.parse(await readFile(new URL(`../tests/fixtures/${slug}-original.json`,import.meta.url)))
const base=process.env.QTW_AUDIT_URL??'https://qniapp.github.io/qni-tutorial-webgpu/'
const browser=await chromium.launch({args:['--no-sandbox','--disable-gpu']});const results=[]
try{
for(const width of [390,1440])for(const dpr of [1,2]){
 const context=await browser.newContext({viewport:{width,height:1100},deviceScaleFactor:dpr}),snapshots=[]
 for(const url of [`https://qniapp.github.io/qni/${slug}.html`,new URL(`${slug}/`,base).href]){
  const page=await context.newPage();await page.addInitScript(()=>Object.defineProperty(navigator,'gpu',{configurable:true,value:undefined}))
  await page.goto(url);await page.waitForFunction(()=>window.MathJax?.startup?.document?.math);await page.evaluate(async()=>{await window.MathJax.startup.promise;await document.fonts.ready})
  const snapshot=await page.evaluate(()=>{
   const root=document.querySelector('.content-with-margin');if(!root)throw Error('missing content root')
   const walk=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);let text='',node
   while(node=walk.nextNode()){if(!node.parentElement.closest('footer,script,style,mjx-container,orbit-reviewarea,qni-webgpu-circuit,quantum-simulator,quantum-circuit,circle-notation,qubit-circle')&&!(node.parentElement.closest('a')&&node.textContent.replace(/\s+/g,'')==='Qniで開く'))text+=node.textContent}
   const normalize=s=>s.replace(/\s+/g,'').normalize('NFC')
   return {text:normalize(text),description:normalize((document.querySelector('.lede')??document.querySelector('h1')?.parentElement.nextElementSibling)?.textContent??''),math:Array.from(window.MathJax.startup.document.math).filter(item=>root.contains(item.typesetRoot)&&!item.typesetRoot.closest('quantum-simulator,quantum-circuit,circle-notation,qubit-circle,qni-webgpu-circuit')).map(item=>({tex:normalize(item.math),display:item.display})),circuits:[...root.querySelectorAll('quantum-circuit[data-json],qni-webgpu-circuit[circuit]')].map(e=>JSON.parse(e.getAttribute('data-json')??e.getAttribute('circuit')))}
  })
  snapshot.url=url;snapshots.push(snapshot);await page.screenshot({path:`/tmp/qtw-${slug}-live-${snapshots.length===1?'original':'ours'}-${width}-dpr${dpr}.png`,fullPage:true});await page.close()
 }
 const original=snapshots[0],ours=snapshots[1],approvedCircuits=structuredClone(original.circuits)
 for(const d of fixed.diff??[]){if(approvedCircuits[d.circuit].cols[d.column][d.wire]!==d.before)throw Error('Original changed; STOP');approvedCircuits[d.circuit].cols[d.column][d.wire]=d.after}
 let approvedText=slug==='quantum_phase_estimation_circuit'?original.text.replace('量子位相推定回路の後半は逆QFT回路そのままです。','量子位相推定回路の後半には、先に説明したQFT回路を使います。').replace('後半の逆QFT','後半のQFT'):original.text
 const approvedMath=structuredClone(original.math)
 if(slug==='qpe_output'){
  for(const [before,after] of fixed.edits)approvedText=approvedText.replace(before.replace(/\s+/g,''),after.replace(/\s+/g,''))
  if(approvedMath.length!==4)throw Error('Original TeX changed; STOP')
  if(!approvedMath[2].tex.includes('逆QFT')&&JSON.stringify(approvedMath)!==JSON.stringify(fixed.math))throw Error('Original TeX changed outside approval; STOP')
  approvedMath[2].tex=approvedMath[2].tex.replace('逆QFT','QFT')
 }
 const result={slug,width,dpr,base,snapshots,approvedTextDiffZero:approvedText===ours.text,sourceGoldenTextMatches:ours.text===fixed.text,approvedTexDiffZero:JSON.stringify(approvedMath)===JSON.stringify(ours.math),rawTexUnchanged:JSON.stringify(original.math)===JSON.stringify(ours.math),sourceGoldenTexMatches:JSON.stringify(ours.math)===JSON.stringify(fixed.math),originalJSONMatches:JSON.stringify(original.circuits)===JSON.stringify(originalFixture.circuits),approvedJSONMatches:JSON.stringify(approvedCircuits)===JSON.stringify(ours.circuits),fixedJSONMatches:JSON.stringify(ours.circuits)===JSON.stringify(fixed.circuits??[]),WebGPUExecuted:false}
 if(slug==='qpe_output')result.approvedDescriptionMatches=original.description.replace('逆QFT','QFT')===ours.description&&ours.description===fixed.description
 results.push(result)
 if(Object.entries(result).some(([k,v])=>(k.endsWith('Zero')||k.endsWith('Matches'))&&v!==true))throw Error(JSON.stringify(result))
 await context.close()
}
console.log(`PASS ${slug}: original/live text and TeX only approved diffs (4 cases)`)
}finally{await writeFile(`/tmp/qtw-${slug}-live-comparison.json`,JSON.stringify(results,null,2)+'\n');await browser.close()}
