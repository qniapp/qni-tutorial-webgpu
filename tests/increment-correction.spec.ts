import { expect, test } from '@playwright/test'
import { readFile } from 'node:fs/promises'
import original from './fixtures/increment_circuit-original.json' with { type: 'json' }

test('increment applies only the authorized sixth-circuit empty-slot correction', async () => {
  const source = await readFile(new URL('../src/pages/increment_circuit.astro', import.meta.url), 'utf8')
  const circuits = [...source.matchAll(/circuit=\{("(?:\\.|[^"\\])*")\}/g)].map(match => JSON.parse(JSON.parse(match[1])))
  expect(circuits).toHaveLength(6)
  expect(original.circuits[5].cols.at(-1)).toEqual(['1'])
  const expected = structuredClone(original.circuits)
  expected[5].cols[expected[5].cols.length - 1] = [1]
  expect(circuits).toEqual(expected)
  circuits[5].cols[circuits[5].cols.length - 1] = ['1']
  expect(circuits).toEqual(original.circuits)
})
