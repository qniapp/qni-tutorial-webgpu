import {expect,test} from '@playwright/test'
import {readFileSync} from 'node:fs'
import {createHash} from 'node:crypto'
test('Shor FX only A approved, B rejected and JSON unchanged',()=>{
 const original=readFileSync('docs/shor-fx-original-source.html','utf8'),fixed=readFileSync('docs/shor-fx-approved-source.html','utf8')
 expect(createHash('sha256').update(original).digest('hex')).toBe('7ce601508a9f2cc9f43f23c3a90923765cb92a53057bb0b240758e99280f11f3')
 const before=String.raw`\(a\,mod(N)\) を計算できるゲート U があったときに`,after=String.raw`現在の値を \(a\) 倍し、\(mod(N)\) した値を書き込むゲート U があったときに`
 expect(original.split(before)).toHaveLength(2);expect(original.replace(before,after)).toBe(fixed)
 expect(fixed).not.toContain('現在の値が \\(N\\) 以上の状態は U で変えない')
 const math=s=>Array.from(s.split('---')[2].matchAll(/\\\((.*?)\\\)/gs),m=>m[1].replace(/\s+/g,''))
 const expected=math(original);expect(expected).toHaveLength(33);expect(expected[30]).toBe(String.raw`a\,mod(N)`);expected.splice(30,1,'a','mod(N)');expect(math(fixed)).toEqual(expected)
 expect(Array.from(fixed.matchAll(/data-json='([^']*)'/g),m=>JSON.parse(m[1]))).toEqual(JSON.parse(readFileSync('tests/fixtures/shor_fx-original.json','utf8')).circuits)
})
