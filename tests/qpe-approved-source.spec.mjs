import {expect,test} from '@playwright/test'
import {readFileSync} from 'node:fs'
const original=JSON.parse(readFileSync('tests/fixtures/quantum_phase_estimation_circuit-original.json'))
const fixed=JSON.parse(readFileSync('tests/fixtures/quantum_phase_estimation_circuit-fixed.json'))
const expected=[
 [2,0,0,'{量子位相推定後半: 逆QFT','{量子位相推定後半: QFT'],
 [2,4,0,'P(π_2)','P(-π_2)'],[2,5,0,'P(π_4)','P(-π_4)'],[2,6,0,'P(π_8)','P(-π_8)'],
 [2,8,1,'P(π_2)','P(-π_2)'],[2,9,1,'P(π_4)','P(-π_4)'],[2,11,2,'P(π_2)','P(-π_2)'],
 [3,25,0,'{量子位相推定後半: 逆QFT','{量子位相推定後半: QFT'],
 [3,29,0,'P(π_2)','P(-π_2)'],[3,30,0,'P(π_4)','P(-π_4)'],[3,31,0,'P(π_8)','P(-π_8)'],
 [3,33,1,'P(π_2)','P(-π_2)'],[3,34,1,'P(π_4)','P(-π_4)'],[3,36,2,'P(π_2)','P(-π_2)'],
].map(([circuit,column,wire,before,after])=>({circuit,column,wire,before,after}))
test('QPE approval pins every changed JSON cell, including original column indices',()=>{
 expect(fixed.diff).toEqual(expected)
 const transformed=structuredClone(original.circuits)
 for(const row of expected){expect(transformed[row.circuit].cols[row.column][row.wire]).toBe(row.before);transformed[row.circuit].cols[row.column][row.wire]=row.after}
 expect(fixed.circuits).toEqual(transformed)
 expect(fixed.circuits[4]).toEqual(original.circuits[4]);expect(fixed.circuits[5]).toEqual(original.circuits[5])
})
test('QPE original HTML changes only the four approved edits',()=>{
 const before=readFileSync('docs/qpe-original-source.html','utf8')
 const after=readFileSync('docs/qpe-approved-source.html','utf8')
 const expected=before.replaceAll('P(π_2)','P(-π_2)').replaceAll('P(π_4)','P(-π_4)').replaceAll('P(π_8)','P(-π_8)').replaceAll('{量子位相推定後半: 逆QFT','{量子位相推定後半: QFT').replace('量子位相推定回路の後半は逆 QFT 回路そのままです。','量子位相推定回路の後半には、先に説明した QFT 回路を使います。').replace('後半の逆 QFT','後半の QFT')
 expect(after).toBe(expected)
 expect(expected.match(/P\(-π_[248]\)/g)).toHaveLength(21)
})
