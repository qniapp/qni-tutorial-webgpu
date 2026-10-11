import { expect, test } from '@playwright/test'
import original from './fixtures/increment_circuit-original.json' with { type: 'json' }

test('increment applies only the authorized sixth-circuit empty-slot correction', async ({ page }) => {
  await page.goto('/qni-tutorial-webgpu/increment_circuit/')
  const circuits = await page.locator('main qni-webgpu-circuit').evaluateAll(elements => elements.map(element => JSON.parse(element.getAttribute('circuit')!)))
  expect(circuits).toHaveLength(6)
  expect(original.circuits[5].cols.at(-1)).toEqual(['1'])
  const expected = structuredClone(original.circuits)
  expected[5].cols[expected[5].cols.length - 1] = [1]
  expect(circuits).toEqual(expected)
  circuits[5].cols[circuits[5].cols.length - 1] = ['1']
  expect(circuits).toEqual(original.circuits)
})
