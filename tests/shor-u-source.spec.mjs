import {expect,test} from '@playwright/test'
import {readFileSync} from 'node:fs'
import {createHash} from 'node:crypto'
const edits=[
  [
    "この実装では、U ゲートの一つひとつは \\(a\\,mod(N)\\) を計算するのでした。",
    "この実装では、U ゲートの一つひとつは現在の値を \\(a\\) 倍し、\\(mod(N)\\) した値を書き込むのでした。"
  ],
  [
    "(2021)",
    "(1996)"
  ],
  [
    "の値は列方向 (縦方向) に読みます。",
    "の値は列番号 (横方向) から読みます。"
  ],
  [
    "x の値は行方向 (横方向) に読みます。",
    "x の値は行番号 (縦方向) から読みます。"
  ],
  [
    "{{ '0.25' | qubit_circle: 241, 'base' }} {{ '0' |\n        qubit_circle: 241, 'base' }}",
    "{{ '0.25' | qubit_circle: 241, 'base' }} {{ '0' |\n        qubit_circle: 242, 'base' }}"
  ],
  [
    "{{ '0' | qubit_circle: 241, 'base' }} {{ '0.25' |\n        qubit_circle: 241, 'base' }}",
    "{{ '0' | qubit_circle: 241, 'base' }} {{ '0.25' |\n        qubit_circle: 242, 'base' }}"
  ],
  [
    "{{ '0' | qubit_circle: 241, 'base' }} {{ '0' |\n        qubit_circle: 241, 'base' }}",
    "{{ '0' | qubit_circle: 241, 'base' }} {{ '0' |\n        qubit_circle: 242, 'base' }}"
  ],
  [
    "<figure>\n  <img src=\"./images/axmodN.png\" class=\"h-auto w-full\" />\n</figure>",
    "<figure>\n  <img src=\"./images/axmodN.png\" class=\"h-auto w-full\" />\n</figure>\n\n<p>注: 図中の出力ラベル \\(x^a\\, mod\\, N\\) は、正しくは \\(a^x\\, mod\\, N\\) です。</p>"
  ]
]
test('Shor U only approved U1-U4 changes; JSON/cells exact',()=>{
 const raw=readFileSync('docs/shor-u-original-source.html','utf8'),fixed=readFileSync('docs/shor-u-approved-source.html','utf8')
 expect(createHash('sha256').update(readFileSync('public/images/axmodN.png')).digest('hex')).toBe('a58880daae7dc6ca78fc303d3b3015f9b5a23df01fca0096326d0a7cde5ee5a0')
 expect(createHash('sha256').update(raw).digest('hex')).toBe('ae827cdbdfa4b902dabe8fef3b1c740d947193a29e695c796db299bea4ae3763')
 let expected=raw;for(const [a,b] of edits){expect(expected.split(a)).toHaveLength(2);expected=expected.replace(a,b)}expect(expected).toBe(fixed)
 const cells=s=>Array.from(s.matchAll(/{{\s*'([^']+)'\s*\|\s*qubit_circle:\s*(\d+),\s*'base'\s*}}/gs),m=>[m[1],Number(m[2])])
 const old=cells(raw),now=cells(fixed);expect(now).toHaveLength(768)
 expect(now.map(x=>x[0])).toEqual(old.map(x=>x[0]))
 expect(now.map((x,i)=>x[1]!==old[i][1]?i:null).filter(x=>x!==null)).toEqual([242,498,754])
 for(let g=0;g<3;g++)expect(now.slice(g*256,(g+1)*256).map(x=>x[1])).toEqual(Array.from({length:256},(_,i)=>i))
 const json=s=>Array.from(s.matchAll(/data-json='([^']*)'/g),m=>JSON.parse(m[1]));expect(json(fixed)).toEqual(json(raw))
})
