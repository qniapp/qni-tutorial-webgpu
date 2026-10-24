import { test } from 'node:test'
import assert from 'node:assert/strict'
import { TutorialEmbed } from '../scripts/tutorial-embed.mjs'
import { PinnedEmbed } from '../scripts/fetch-qni-embed.mjs'
import { readFileSync } from 'node:fs'

for (const page of TutorialEmbed.pages) {
  test(`${page || 'index'} defaults on and accepts explicit per-page off`, () => {
    assert.equal(TutorialEmbed.enabled(page, {}), true)
    const key = `QNI_${(page || 'index').replaceAll('-', '_').toUpperCase()}_PREBUILT`
    for (const value of ['0', 'false', 'OFF', ' off ']) {
      assert.equal(TutorialEmbed.enabled(page, { [key]: value }), false)
    }
    assert.equal(TutorialEmbed.enabled(page, { QNI_EMBED_PREBUILT: '0' }), false)
    assert.equal(TutorialEmbed.enabled(page, { QNI_EMBED_PREBUILT: '0', [key]: '  ' }), false)
    assert.equal(TutorialEmbed.enabled(page, { QNI_EMBED_PREBUILT: '0', [key]: '1' }), true)
  })
}

test('selection fetches once and gives every page the same release directory', async () => {
  const fetch = PinnedEmbed.fetch
  let calls = 0
  PinnedEmbed.fetch = async () => { calls++ }
  try {
    const directories = await TutorialEmbed.directories({}, false)
    assert.deepEqual(Object.keys(directories), TutorialEmbed.pages)
    const sha = readFileSync('qni-embed.ref', 'utf8').trim()
    assert.deepEqual([...new Set(Object.values(directories))], [`qni-webgpu-prebuilt/embed-${sha}/`])
    assert.equal(calls, 1)
    const mixed = await TutorialEmbed.directories({ QNI_MEASUREMENT_OPERATION_PREBUILT: '0' }, false)
    assert.equal(mixed.measurement_operation, undefined)
    assert.equal(mixed.inside_the_qft, directories.inside_the_qft)
    assert.equal(mixed['multi-1'], undefined)
    assert.equal(mixed.phase_gate, undefined)
    assert.deepEqual(await TutorialEmbed.directories({ QNI_EMBED_PREBUILT: '0' }, false), {})
    assert.deepEqual(await TutorialEmbed.directories({}, true), {})
    assert.equal(calls, 2)
  } finally { PinnedEmbed.fetch = fetch }
})
