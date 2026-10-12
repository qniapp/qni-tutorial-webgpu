import {expect,test} from '@playwright/test'
import {readFileSync} from 'node:fs'
import {createHash} from 'node:crypto'
const edits=[
  [
    "最後の測定で 0, 4, 8, 12 のいずれかが求まることを確認してください。\n  これを連分数アルゴリズムにかければ、\\(r = 4, 8\\) が得られます。 そして gcd を計算して実際に \\(N =\n  15\\) の約数として正しい 3, 5 が求まります。 長い道程でしたが、\\(15 = 3 \\times 5\\)\n  の因数分解を実行するショアのアルゴリズムができました!",
    "最後の測定で 0, 4, 8, 12 のいずれかが求まることを確認してください。\n  これを連分数アルゴリズムにかけると、\\(r = 2, 4\\) が候補として得られます。\n  測定値 4、8、12 を 16 で割って既約分数にすると、分母はそれぞれ 4、2、4 になります。\n  測定値 0 からは有用な候補が得られないので、測定をやり直します。\n  そして gcd を計算して、結果が 1 より大きく \\(N = 15\\) より小さい非自明な因数かチェックします。\n  非自明な因数が得られたら、\\(N\\) をその因数で割ってもう一つの因数を求めます。\n  \\(r = 4\\) の場合には正しい 3, 5 が求まります。 長い道程でしたが、\\(15 = 3 \\times 5\\)\n  の因数分解を実行するショアのアルゴリズムができました!"
  ],
  [
    "{{ '0' | qubit_circle: 241, 'base' }} {{ '0' |\n        qubit_circle: 241, 'base' }}",
    "{{ '0' | qubit_circle: 241, 'base' }} {{ '0' |\n        qubit_circle: 242, 'base' }}"
  ]
]
const mergedEdits=[
 [String.raw`これを連分数アルゴリズムにかけると、\(r = 2, 4\) が候補として得られます。`,String.raw`これを連分数アルゴリズムにかければ、\(r\) の候補として 2 と 4 が得られます。`],
 [String.raw`\(r = 4\) の場合には正しい 3, 5 が求まります。`,String.raw`\(r = 4\) の場合因数 3 と 5 がみつかります。`]
]
test('Shor QFT Q1/Q2 plus exactly two merged-original spots; nothing else',()=>{
 const raw=readFileSync('docs/shor-qft-original-source.html','utf8'),fixed=readFileSync('docs/shor-qft-approved-source.html','utf8')
 expect(createHash('sha256').update(raw).digest('hex')).toBe('ef1b68017823d37888ae043af3c96e32db166230b67b819f95d084506966a499')
 let expected=raw;for(const [a,b] of edits){expect(expected.split(a)).toHaveLength(2);expected=expected.replace(a,b)}
 expect(expected).toBe(readFileSync('docs/shor-qft-q1-exact-approved-source.html','utf8'))
 for(const [a,b] of mergedEdits){expect(expected.split(a)).toHaveLength(2);expected=expected.replace(a,b)}expect(expected).toBe(fixed)
 const merged=readFileSync('docs/shor-qft-pr590-source.html','utf8');expect(createHash('sha256').update(merged).digest('hex')).toBe('22620ead2dc92b9dfc16c3052253307248268cd4bee9fc501e0f0980b3b311f7')
 expect(fixed.replace(/\s+/g,'')).toBe(merged.replace(/\s+/g,''))
 const cells=s=>Array.from(s.matchAll(/{{\s*'([^']+)'\s*\|\s*qubit_circle:\s*(\d+),\s*'base'\s*}}/gs),m=>[m[1],Number(m[2])]);const old=cells(raw),now=cells(fixed)
 expect(now).toHaveLength(256);expect(now.map(x=>x[0])).toEqual(old.map(x=>x[0]));expect(now.map((x,i)=>x[1]!==old[i][1]?i:null).filter(x=>x!==null)).toEqual([242])
 expect(now.map(x=>x[1])).toEqual(Array.from({length:256},(_,i)=>i))
 const json=s=>Array.from(s.matchAll(/data-json='([^']*)'/g),m=>JSON.parse(m[1]));expect(json(fixed)).toEqual(json(raw))
 const math=s=>Array.from(s.split('---')[2].matchAll(/\\\((.*?)\\\)/gs),m=>m[1].replace(/\s+/g,''))
 expect(math(fixed)).toEqual(['2^xmod(15)','x','x','r','N=15','N','r=4',String.raw`15=3\times5`])
})
