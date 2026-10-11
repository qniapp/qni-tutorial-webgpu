import {expect,test} from '@playwright/test'
import {readFileSync} from 'node:fs'
import {createHash} from 'node:crypto'
const edits = [
  [
    "古典の因数分解アルゴリズムである「一般数体ふるい法」の実行時間は、因数分解したい数が大きくなるにつれて指数関数的に増えます。\n  一方でショアのアルゴリズムは、多項式時間に留まります。 分かりやすく具体的な値で言うと、1024\n  ビットの整数を因数分解するのに必要な計算量は、古典コンピュータ (一般数体ふるい法) で\n  \\(O(10^{278})\\) です。 これに対して、ショアのアルゴリズムは \\(O(10^{61})\\) となり、\\(10^{278}\n  \\rightarrow 10^{61}\\) と計算量を大幅に減らせます。",
    "古典の因数分解アルゴリズムである「一般数体ふるい法」の実行時間は、入力のビット数に対して準指数時間と見積もられます。\n  一方でショアのアルゴリズムは、入力のビット数に対して多項式時間で実行できます。"
  ],
  [
    "\\(a\\) はとりあえず \\(N\\)\n  より小さい整数なら何でも良いので",
    "\\(a\\) は \\(N\\) より小さく、\\(N\\) と共通の因数を持たない整数から選ぶので"
  ],
  [
    "周期 \\(r\\) が偶数の場合のみ gcd が計算できることに注意してください。",
    "この手順では、周期 \\(r\\) が偶数の場合に上の 2 つの式を使うことに注意してください。"
  ],
  [
    "gcd の結果が \\(N\\)\n  の因数にならない場合があります (因数かどうかは、積が \\(N\\)\n  になるかどうかを調べるだけで簡単にチェックできます)",
    "gcd の結果が 1 や \\(N\\) 自身という自明な約数になる場合があります\n  (結果が 1 より大きく \\(N\\) より小さいかを調べることで、非自明な因数が得られたか確認できます)"
  ],
  [
    "反復周期 \\(r\\) が指数関数的に増えることです。",
    "反復周期 \\(r\\) が指数関数的に大きくなる場合があることです。"
  ],
  [
    "この周期を求める計算は、古典コンピュータでは指数時間が必要なため、量子コンピュータを使います。",
    "この周期を順に値を調べて求める古典的な方法は、最悪の場合に入力のビット数に対して指数時間がかかるため、量子コンピュータを使います。"
  ],
  [
    "このため、古典コンピュータではショアのアルゴリズムを使ってもやはり指数時間かかってしまいます。",
    "このため、古典コンピュータでは、ショアのアルゴリズムの手順をそのまま使っても、最悪の場合は指数時間かかってしまいます。"
  ]
]
test('Shor HSP exactly seven independently pinned approved changes',()=>{
 const original=readFileSync('docs/shor-hsp-original-source.html','utf8'),approved=readFileSync('docs/shor-hsp-approved-source.html','utf8')
 expect(createHash('sha256').update(original).digest('hex')).toBe('5bc7e636ec570f264e1b5caa5aeacd93302f796dd9d8a2db770765d13214512c')
 let fixed=original
 for(const [before,after] of edits){expect(fixed.split(before)).toHaveLength(2);fixed=fixed.replace(before,after)}
 expect(fixed).toBe(approved)
 const math=s=>Array.from(s.matchAll(/\\\((.*?)\\\)/gs),m=>m[1].replace(/\s+/g,''))
 const expected=math(original);expect(expected).toHaveLength(55)
 expect(expected.slice(1,4)).toEqual(['O(10^{278})','O(10^{61})',String.raw`10^{278}\rightarrow10^{61}`])
 expected.splice(1,3);expected.splice(15,0,'N')
 expect(math(approved)).toEqual(expected)
})
