import {expect,test} from '@playwright/test'
import {readFileSync} from 'node:fs'
import {createHash} from 'node:crypto'
const edits=[
 ['位相キックバックと逆QFTの結果を固有位相として解釈する','位相キックバックとQFTの結果を固有位相として解釈する'],
 ['出力である逆 QFT','出力である QFT'],['これを逆 QFT にかけると','これを QFT にかけると'],
 [String.raw`\times 逆 QFT の結果`,String.raw`\times QFT の結果`],['で見た逆 QFT','で見た QFT'],
 ['周期 2 が得られます。 周期が 2 ということは','周波数 2 が得られます。 周波数が 2 ということは'],
]
test('QPE output source changes only approved A five places and B one phrase',()=>{
 const original=readFileSync('docs/qpe-output-original-source.html','utf8'),approved=readFileSync('docs/qpe-output-approved-source.html','utf8')
 expect(createHash('sha256').update(original).digest('hex')).toBe('421489783ef03a6fdcde1391b2379bebb12efb8bb0aaf97bdf62314c38d0a751')
 let fixed=original
 for(const [before,after] of edits){expect(fixed.split(before)).toHaveLength(2);fixed=fixed.replace(before,after)}
 expect(fixed).toBe(approved)
 const math=s=>Array.from(s.split('---')[2].matchAll(/\\\((.*?)\\\)/gs),m=>m[1].replace(/\s+/g,''))
 const expected=math(original);expect(expected).toHaveLength(4);expected[2]=expected[2].replace('逆QFT','QFT');expect(math(approved)).toEqual(expected)
})
