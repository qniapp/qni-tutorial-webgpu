import { createHash } from 'node:crypto'

// Mirror EmbedRelease.assets and stage() independently of the consumer validator.
export const releaseAssets = [
  ['qni-web.js', 'text/javascript'],
  ['qni-web_bg.wasm', 'application/wasm'],
  ['qni-embed.mjs', 'text/javascript'],
  ['qni-embed-error.mjs', 'text/javascript'],
  ['h.svg', 'image/svg+xml'],
  ['design-system.css', 'text/css'],
  ['h-gate.js', 'text/javascript'],
  ['LICENSE', 'text/plain'],
]

const hash = bytes => createHash('sha256').update(bytes).digest('hex')
export const manifestBytes = manifest => Buffer.from(`${JSON.stringify(manifest, null, 2)}\n`)
export const manifestChecksum = bytes => Buffer.from(`${hash(bytes)}  manifest.json\n`)

export function buildReleaseFixture({ sourceCommit, contents = new Map(), builtAt = '2026-01-01T00:00:00.000Z' }) {
  const files = new Map(releaseAssets.map(([name]) => {
    const identity = `export const EMBED_API_VERSION = 1\nconst buildSourceCommit = '${sourceCommit}'\nexport const SOURCE_COMMIT = /^[0-9a-f]{40}$/i.test(buildSourceCommit) ? buildSourceCommit : 'unknown'\n`
    return [name, contents.get(name) ?? Buffer.from(name === 'qni-embed.mjs' ? identity : `fixture ${name}`)]
  }))
  const manifest = {
    schema_version: 1,
    source_commit: sourceCommit,
    embed_api_version: 1,
    built_at: builtAt,
    // Repackaging fixtures do not claim release-toolchain provenance.
    toolchain: { rustc: 'fixture', 'wasm-bindgen': 'fixture', 'wasm-opt': 'fixture', trunk: 'fixture', node: 'fixture', pnpm: 'fixture' },
    files: releaseAssets.map(([name, content_type]) => {
      const bytes = files.get(name)
      return { name, sha256: hash(bytes), size: bytes.length, content_type }
    }),
  }
  const bytes = manifestBytes(manifest)
  return { files, manifest, bytes, checksum: manifestChecksum(bytes) }
}
