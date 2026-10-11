import {expect,test} from '@playwright/test'
import {readFileSync} from 'node:fs'
import {createHash} from 'node:crypto'
const edits=[
  [
    "の候補として 4 と 8 が得られます。",
    "の候補として 2 と 4 が得られます。 測定値 4、8、12 を 16 で割って既約分数にすると、分母はそれぞれ 4、2、4 になります。 測定値 0 からは有用な候補が得られないので、測定をやり直します。"
  ],
  [
    "あとは \\(r = 4, 8\\) それぞれの候補について \\(gcd(N, a^{r/2} + 1)\\) と \\(gcd(N, a^{r/2} - 1)\\)\n  を計算して、それぞれが \\(N = 15\\)\n  の因数になっているかチェックします。これらは古典コンピュータで簡単にでき、 \\(r = 4\\) の場合因数 3\n  と 5 がみつかるので、計算は終了です。",
    "あとは \\(r = 2, 4\\) それぞれの候補について \\(gcd(N, a^{r/2} + 1)\\) と \\(gcd(N, a^{r/2} - 1)\\)\n  を計算し、結果が 1 より大きく \\(N = 15\\) より小さい非自明な因数かチェックします。\n  非自明な因数が得られたら、\\(N\\) をその因数で割ってもう一つの因数を求めます。\n  これらは古典コンピュータで簡単にでき、\\(r = 4\\) の場合には因数 3 と 5 がみつかるので、計算は終了です。"
  ]
]
test('Shor R exactly approved C1/C2; other text/TeX unchanged',()=>{
 const raw=readFileSync('docs/shor-r-original-source.html','utf8'),fixed=readFileSync('docs/shor-r-approved-source.html','utf8')
 expect(createHash('sha256').update(raw).digest('hex')).toBe('c3f78702445ec522ec7362d45e4809d147b2dd4fba1f4d31750fdcfb79d14b33')
 let expected=raw
 for(const [a,b] of edits){expect(expected.split(a)).toHaveLength(2);expected=expected.replace(a,b)}
 expect(expected).toBe(fixed)
 const math=s=>Array.from(s.split('---')[2].matchAll(/\\\((.*?)\\\)/gs),m=>m[1].replace(/\s+/g,''))
 const original=math(raw),approved=math(fixed)
 expect(original.filter(x=>x==='r=4,8')).toHaveLength(1)
 const changed=original.map(x=>x==='r=4,8'?'r=2,4':x)
 // The added N belongs immediately before the existing final r=4 example.
 changed.splice(changed.lastIndexOf('r=4'),0,'N')
 expect(approved).toEqual(changed)
})
