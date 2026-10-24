import { test } from 'node:test'
import assert from 'node:assert/strict'
import { TutorialEmbed } from '../scripts/tutorial-embed.mjs'
import { PinnedEmbed } from '../scripts/fetch-qni-embed.mjs'
import { readFileSync } from 'node:fs'

const sha = readFileSync('qni-embed.ref', 'utf8').trim()
const directory = `qni-webgpu-prebuilt/embed-${sha}/`

test('all tutorials use one pinned directory, independent of legacy switches', async () => {
  const fetch = PinnedEmbed.fetch
  const keys = ['QNI_EMBED_PREBUILT', ...['', 'h_gate', 'measurement_operation', 'phase_gate', 'sat', 'multi-7'].map(page =>
    `QNI_${(page || 'index').replaceAll('-', '_').toUpperCase()}_PREBUILT`)]
  const previous = keys.map(key => process.env[key])
  let calls = 0
  PinnedEmbed.fetch = async () => { calls++ }
  try {
    assert.equal(await TutorialEmbed.directory(false), directory)
    assert.equal(calls, 1)
    for (const value of ['0', 'false', 'OFF', ' off ', '1']) {
      for (const key of keys) process.env[key] = value
      assert.equal(await TutorialEmbed.directory(false), directory)
    }
    assert.equal(calls, 6)
    assert.equal(TutorialEmbed.enabled, undefined)
    assert.equal(TutorialEmbed.directories, undefined)
  } finally {
    PinnedEmbed.fetch = fetch
    keys.forEach((key, i) => {
      if (previous[i] === undefined) delete process.env[key]
      else process.env[key] = previous[i]
    })
  }
})

test('preview computes the identical pinned directory without fetching', async () => {
  const fetch = PinnedEmbed.fetch
  PinnedEmbed.fetch = async () => { throw new Error('Preview must not fetch') }
  try {
    assert.equal(await TutorialEmbed.directory(true), directory)
  } finally { PinnedEmbed.fetch = fetch }
})
