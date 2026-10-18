import assert from 'node:assert/strict'
import { test } from 'node:test'
import { buildQniAppUrl, QNI_APP_BASE_URL } from '../src/components/qni-webgpu-app-url.ts'

test('known circuit opens the official Pages directory with an encoded bare JSON hash', () => {
  const circuit = '{"cols":[["H"]]}'
  assert.equal(QNI_APP_BASE_URL, 'https://qniapp.github.io/qni-webgpu/')
  assert.equal(buildQniAppUrl(circuit), 'https://qniapp.github.io/qni-webgpu/#%7B%22cols%22%3A%5B%5B%22H%22%5D%5D%7D')
})

for (const circuit of [
  { cols: [] },
  { cols: [['H'], ['•', 'X'], ['S†'], ['P(π/4)']], title: '回路 100% & # + ? /' },
  { cols: [['custom']], init: [0, 1], gates: [{ id: 'custom', matrix: '{{1,0},{0,1}}' }] },
]) {
  test(`URL round-trips all circuit metadata: ${JSON.stringify(circuit)}`, () => {
    const json = JSON.stringify(circuit)
    const href = buildQniAppUrl(json)
    const url = new URL(href)
    assert.ok(href.startsWith(QNI_APP_BASE_URL + '#'))
    assert.equal(url.pathname, '/qni-webgpu/')
    assert.equal(url.search, '')
    assert.equal(url.hash, '#' + encodeURIComponent(json))
    assert.ok(!url.hash.startsWith('#circuit='))
    assert.equal(decodeURIComponent(url.hash.slice(1)), json)
    assert.deepEqual(JSON.parse(decodeURIComponent(url.hash.slice(1))), circuit)
  })
}
