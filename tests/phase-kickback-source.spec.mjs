import {expect,test} from '@playwright/test'
import {readFileSync} from 'node:fs'
test('phase kickback has no authored JSON changes',()=>{
 const before=JSON.parse(readFileSync('tests/fixtures/phase_kickback-original.json'))
 const after=JSON.parse(readFileSync('tests/fixtures/phase_kickback-fixed.json'))
 expect(after.diff).toEqual([]);expect(after.circuits).toEqual(before.circuits)
 expect(after.circuits.map(c=>c.cols.length)).toEqual([18,25])
 expect(after.circuits.map(c=>Math.max(...c.cols.map(col=>col.length)))).toEqual([5,5])
 expect(after.embeds).toEqual([{maxWireCount:1,runButton:false},{maxWireCount:1,runButton:false}])
})
