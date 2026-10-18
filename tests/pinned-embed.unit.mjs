import { expect, test } from '@playwright/test'
import { createServer } from 'node:http'
import { mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { PinnedEmbed } from '../scripts/fetch-qni-embed.mjs'

class FixtureRelease {
  static async create() {
    const root = await mkdtemp(join(tmpdir(), 'pinned-embed-test-'))
    const sha = 'a'.repeat(40)
    const refFile = join(root, 'qni-webgpu.ref')
    await writeFile(refFile, `${sha}\n`)
    const files = new Map(['qni-web.js', 'qni-web_bg.wasm', 'qni-embed.mjs', 'qni-embed-error.mjs', 'h.svg', 'design-system.css', 'h-gate.mjs', 'LICENSE'].map(name => [name, Buffer.from(`fixture ${name}`)]))
    const manifest = {
      schema_version: 1, source_commit: sha, embed_api_version: 1,
      built_at: '2026-01-01T00:00:00Z',
      toolchain: { rustc: 'fixture', 'wasm-bindgen': 'fixture', 'wasm-opt': 'fixture', trunk: 'fixture' },
      files: [...files].map(([name, bytes]) => ({ name, sha256: PinnedEmbed.digest(bytes), size: bytes.length, content_type: 'application/octet-stream' })),
    }
    const fixture = { root, sha, refFile, files, manifest, checksum: true, missing: false, badChecksum: false, checksumStatus: 200, requests: [] }
    const server = createServer((request, response) => {
      fixture.requests.push(request.url)
      const prefix = `/embed-${sha}/`
      if (fixture.missing || !request.url.startsWith(prefix)) { response.writeHead(404).end(); return }
      const name = request.url.slice(prefix.length)
      if (name === 'manifest.json.sha256' && fixture.checksumStatus !== 200) { response.writeHead(fixture.checksumStatus).end(); return }
      const bytes = fixture.manifestBytes ?? Buffer.from(JSON.stringify(fixture.manifest))
      let data = files.get(name)
      if (name === 'manifest.json') data = bytes
      if (name === 'manifest.json.sha256' && fixture.checksum) data = `${fixture.badChecksum ? '0'.repeat(64) : PinnedEmbed.digest(bytes)}  manifest.json\n`
      if (data === undefined) { response.writeHead(404).end(); return }
      response.end(data)
    })
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
    fixture.options = { refFile, outputDir: join(root, 'output'), baseUrl: `http://127.0.0.1:${server.address().port}` }
    fixture.close = async () => {
      await new Promise(resolve => server.close(resolve))
      await rm(root, { recursive: true, force: true })
    }
    return fixture
  }
}

for (const newline of [true, false]) {
  test(`verified release publishes all files, checksum ${newline ? 'with' : 'without'} final newline`, async () => {
    const fixture = await FixtureRelease.create()
    try {
      if (!newline) {
        fixture.checksum = false
        fixture.files.set('manifest.json.sha256', Buffer.from(`${PinnedEmbed.digest(Buffer.from(JSON.stringify(fixture.manifest)))}  manifest.json`))
      }
      await PinnedEmbed.fetch(fixture.options)
      for (const [name, bytes] of fixture.files) expect(await readFile(join(fixture.options.outputDir, name))).toEqual(bytes)
      expect(fixture.requests.slice(0, 2)).toEqual([`/embed-${fixture.sha}/manifest.json.sha256`, `/embed-${fixture.sha}/manifest.json`])
      expect(fixture.requests.every(path => path.startsWith(`/embed-${fixture.sha}/`))).toBe(true)
      // A subsequent fetch also replaces a complete, already-published release.
      await PinnedEmbed.fetch(fixture.options)
    } finally { await fixture.close() }
  })
}

const failures = [
  ['manifest checksum mismatch', f => { f.badChecksum = true }, /manifest checksum mismatch/],
  ['untrusted invalid JSON', f => { f.badChecksum = true; f.manifestBytes = Buffer.from('{not JSON') }, /manifest checksum mismatch/],
  ['file sha mismatch', f => { f.manifest.files[0].sha256 = '0'.repeat(64) }, /sha256 mismatch/],
  ['size mismatch', f => { f.manifest.files[0].size++ }, /size mismatch/],
  ['wrong source_commit', f => { f.manifest.source_commit = 'b'.repeat(40) }, /source_commit/],
  ['missing release', f => { f.missing = true }, /404/],
  ['unsupported schema', f => { f.manifest.schema_version = 2 }, /schema_version/],
  ...['../escape', '/absolute', 'dir/file', 'dir\\file', '%2e%2e', '..', 'C:drive'].map(name => [`unsafe name ${name}`, f => { f.manifest.files[0].name = name }, /unsafe/]),
  ['duplicate asset', f => { f.manifest.files.push(f.manifest.files[0]) }, /duplicate/],
  ['missing runtime', f => { f.manifest.files.shift() }, /missing required asset/],
  ['missing checksum', f => { f.checksum = false }, /404/],
  ...[
    'invalid',
    `${'A'.repeat(64)}  manifest.json\n`,
    `${'a'.repeat(64)} manifest.json\n`,
    `${'a'.repeat(64)} *manifest.json\n`,
    `${'a'.repeat(64)}  other.json\n`,
    `${'a'.repeat(64)}\n`,
    `${'a'.repeat(64)}  manifest.json\n\n`,
    `${'a'.repeat(64)}  manifest.json\r\n`,
    `${'a'.repeat(64)}  manifest.json \n`,
    `${'a'.repeat(64)}  manifest.json\n${'a'.repeat(64)}  manifest.json\n`,
  ].map((value, index) => [`malformed checksum ${index + 1}`, f => {
    f.checksum = false
    f.files.set('manifest.json.sha256', value)
  }, /malformed manifest checksum/]),
  ['checksum server error', f => { f.checksumStatus = 500 }, /500/],
]
for (const [name, mutate, error] of failures) {
  test(`refuses ${name} without publishing partial output`, async () => {
    const fixture = await FixtureRelease.create()
    try {
      mutate(fixture)
      await expect(PinnedEmbed.fetch(fixture.options)).rejects.toThrow(error)
      if (name === 'missing checksum' || name.startsWith('malformed checksum') || name === 'checksum server error') {
        expect(fixture.requests).toEqual([`/embed-${fixture.sha}/manifest.json.sha256`])
      }
      if (name === 'manifest checksum mismatch') {
        expect(fixture.requests).toEqual([`/embed-${fixture.sha}/manifest.json.sha256`, `/embed-${fixture.sha}/manifest.json`])
      }
      expect((await readdir(fixture.root)).sort()).toEqual(['qni-webgpu.ref'])
    } finally { await fixture.close() }
  })
}

test('failed verification leaves previously published output untouched', async () => {
  const fixture = await FixtureRelease.create()
  try {
    await PinnedEmbed.fetch(fixture.options)
    fixture.manifest.files.at(-1).sha256 = '0'.repeat(64)
    await expect(PinnedEmbed.fetch(fixture.options)).rejects.toThrow(/sha256 mismatch/)
    for (const [name, bytes] of fixture.files) expect(await readFile(join(fixture.options.outputDir, name))).toEqual(bytes)
    expect((await readdir(fixture.root)).sort()).toEqual(['output', 'qni-webgpu.ref'])
  } finally { await fixture.close() }
})
