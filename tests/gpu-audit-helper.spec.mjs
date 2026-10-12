import assert from 'node:assert/strict'
import {test} from '@playwright/test'
import {circuitJSONEqual} from '../scripts/gpu-audit-helper.mjs'

const json=cols=>JSON.stringify({cols})
test('edit/undo normalization ignores angles and trailing identity columns',()=>{
 assert.ok(circuitJSONEqual(json([['Z^(-π/2)'],[1],[1,1]]),json([['Z^(-π_2)']])))
 assert.ok(circuitJSONEqual(json([]),json([[1],[1,1]])))
 assert.ok(circuitJSONEqual(json([['H'],[1]]),json([['H'],[1],[1]])))
})
test('interior identity columns and non-identity trailing columns remain significant',()=>{
 assert.equal(circuitJSONEqual(json([['H'],[1],['X']]),json([['H'],['X']])),false)
 assert.equal(circuitJSONEqual(json([[1],['H']]),json([['H']])),false)
 assert.equal(circuitJSONEqual(json([['H'],['X']]),json([['H']])),false)
 assert.equal(circuitJSONEqual(json([['H'],['1']]),json([['H']])),false)
 assert.equal(circuitJSONEqual(JSON.stringify({cols:[['H']],extra:1}),json([['H']])),false)
})
