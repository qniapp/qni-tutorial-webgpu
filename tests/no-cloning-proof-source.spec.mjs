import {expect,test} from '@playwright/test'
import {readFileSync} from 'node:fs'
import {createHash} from 'node:crypto'
const edits=[
 [String.raw`(\langle 0|\langle 🍎|)U^{\dagger}_{CLONE}`,String.raw`(\langle 🍎|\langle 0|)U^{\dagger}_{CLONE}`],
 [String.raw`(\langle 0|\langle🍎|)U^{\dagger}_{CLONE}U_{CLONE}`,String.raw`(\langle🍎|\langle 0|)U^{\dagger}_{CLONE}U_{CLONE}`],
 [String.raw`\Rightarrow &\langle 0|\langle🍎|👶\rangle|0\rangle =`,String.raw`\Rightarrow &(\langle🍎|\langle 0|)(|👶\rangle|0\rangle) =`]
]
test('No-cloning B1/B2/B3 plus one exact merged TeX space, nothing else',()=>{
 const raw=readFileSync('docs/no-cloning-proof-original-source.html','utf8'),fixed=readFileSync('docs/no-cloning-proof-approved-source.html','utf8')
 expect(createHash('sha256').update(raw).digest('hex')).toBe('2b0296bf46e1aebd6db8c639886e615c48652f242054783d7d50f6a1f5e36a8f')
 let s=raw;for(const [a,b]of edits){expect(s.split(a)).toHaveLength(2);s=s.replace(a,b)}
 const a=String.raw`(\langle 🍎|\langle 0|)U^{\dagger}_{CLONE}`,b=String.raw`(\langle🍎|\langle 0|)U^{\dagger}_{CLONE}`
 expect(s.split(a)).toHaveLength(2);s=s.replace(a,b);expect(fixed).toBe(s)
 const merged=readFileSync('docs/no-cloning-proof-pr591-source.html','utf8')
 expect(fixed).toBe(merged)
 const math=s=>Array.from(s.matchAll(/\\\((.*?)\\\)|\\\[(.*?)\\\]|\$\$(.*?)\$\$/gs),m=>({tex:m[1]??m[2]??m[3],display:m[1]===undefined})),old=math(raw),now=math(fixed)
 expect(old).toHaveLength(12);expect(now).toHaveLength(12)
 expect(now.map((x,i)=>JSON.stringify(x)!==JSON.stringify(old[i])?i:null).filter(i=>i!==null)).toEqual([4,5])
 expect((fixed.match(/🍎/g)||[]).length).toBe((raw.match(/🍎/g)||[]).length)
 expect((fixed.match(/👶/g)||[]).length).toBe((raw.match(/👶/g)||[]).length)
 expect(fixed).not.toMatch(/data-json|qubit_circle|<img/)
})
