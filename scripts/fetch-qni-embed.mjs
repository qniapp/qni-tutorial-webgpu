import { createHash } from 'node:crypto'
import { mkdir, mkdtemp, readFile, rename, rm, writeFile } from 'node:fs/promises'
import { basename, dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

export class PinnedEmbed {
  static digest(bytes) {
    return createHash('sha256').update(bytes).digest('hex')
  }

  static async download(url) {
    const response = await fetch(url, { signal: AbortSignal.timeout(60_000) })
    if (!response.ok) throw new Error(`Pinned embed download failed: ${response.status} ${url}`)
    return Buffer.from(await response.arrayBuffer())
  }

  static validateManifest(manifest, sha) {
    if (!manifest || manifest.schema_version !== 1) throw new Error('Pinned embed: unsupported schema_version')
    if (manifest.source_commit !== sha) throw new Error('Pinned embed: source_commit does not match qni-webgpu.ref')
    if (!(typeof manifest.embed_api_version === 'string' && manifest.embed_api_version.trim())
      && !(Number.isSafeInteger(manifest.embed_api_version) && manifest.embed_api_version > 0)) {
      throw new Error('Pinned embed: invalid embed_api_version')
    }
    if (typeof manifest.built_at !== 'string'
      || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/.test(manifest.built_at)
      || !Number.isFinite(Date.parse(manifest.built_at))
      || new Date(manifest.built_at).toISOString().slice(0, 19) !== manifest.built_at.slice(0, 19)) {
      throw new Error('Pinned embed: built_at must be valid UTC')
    }
    for (const key of ['rustc', 'wasm-bindgen', 'wasm-opt', 'trunk']) {
      if (typeof manifest.toolchain?.[key] !== 'string' || !manifest.toolchain[key].trim()) {
        throw new Error(`Pinned embed: missing toolchain ${key}`)
      }
    }
    if (!Array.isArray(manifest.files) || !manifest.files.length) throw new Error('Pinned embed: missing files')
    const names = new Set()
    for (const file of manifest.files) {
      // Flat release asset names only: no URL syntax, escapes, or path traversal.
      if (!file || typeof file.name !== 'string' || !/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(file.name)
        || file.name.includes('..') || file.name.endsWith('.')
        || /^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(file.name)
        || ['manifest.json', 'manifest.json.sha256'].includes(file.name.toLowerCase()) || names.has(file.name)) {
        throw new Error('Pinned embed: unsafe or duplicate asset name')
      }
      names.add(file.name)
      if (typeof file.sha256 !== 'string' || !/^[a-f0-9]{64}$/.test(file.sha256)
        || !Number.isSafeInteger(file.size) || file.size < 0
        || typeof file.content_type !== 'string' || !file.content_type.trim()) {
        throw new Error(`Pinned embed: invalid metadata for ${file.name}`)
      }
    }
    for (const name of ['qni-web.js', 'qni-web_bg.wasm', 'qni-embed.mjs', 'qni-embed-error.mjs', 'h.svg', 'design-system.css', 'LICENSE']) {
      if (!names.has(name)) throw new Error(`Pinned embed: missing required asset ${name}`)
    }
    // Upstream component filenames are not fixed. Require an additional JS module,
    // rather than prescribing a particular gate component's name.
    if (![...names].some(name => /\.(?:mjs|js)$/.test(name)
      && !['qni-web.js', 'qni-embed.mjs', 'qni-embed-error.mjs'].includes(name))) {
      throw new Error('Pinned embed: missing gate component module')
    }
  }

  static async fetch({ refFile = 'qni-webgpu.ref', outputDir, baseUrl = process.env.QNI_EMBED_RELEASE_BASE_URL ?? 'https://github.com/qniapp/qni-webgpu/releases/download' } = {}) {
    const sha = (await readFile(refFile, 'utf8')).trim()
    if (!/^[a-f0-9]{40}$/.test(sha)) throw new Error('Pinned embed: invalid qni-webgpu.ref (expected full 40-character SHA)')
    const release = `${baseUrl.replace(/\/+$/, '')}/embed-${sha}/`
    const checksum = await this.download(`${release}manifest.json.sha256`)
    // Exactly one sha256sum line; allow an absent final newline, not extra lines,
    // whitespace, uppercase hex, binary markers, or a different filename.
    const match = /^([a-f0-9]{64})  manifest\.json\n?(?![\s\S])/.exec(checksum.toString('utf8'))
    if (!match) throw new Error('Pinned embed: malformed manifest checksum')
    const bytes = await this.download(`${release}manifest.json`)
    if (this.digest(bytes) !== match[1]) throw new Error('Pinned embed: manifest checksum mismatch')
    const manifest = JSON.parse(bytes.toString('utf8'))
    this.validateManifest(manifest, sha)
    const assets = []
    for (const file of manifest.files) {
      const data = await this.download(`${release}${file.name}`)
      if (data.length !== file.size) throw new Error(`Pinned embed: size mismatch for ${file.name}`)
      if (this.digest(data) !== file.sha256) throw new Error(`Pinned embed: sha256 mismatch for ${file.name}`)
      assets.push([file.name, data])
    }
    const target = resolve(outputDir ?? `public/qni-webgpu-prebuilt/embed-${sha}`)
    // Stage on the destination filesystem, but never within a public directory.
    let stageRoot = dirname(target)
    for (let ancestor = target; ; ancestor = dirname(ancestor)) {
      if (basename(ancestor) === 'public') stageRoot = dirname(ancestor)
      if (dirname(ancestor) === ancestor) break
    }
    await mkdir(stageRoot, { recursive: true })
    const stage = await mkdtemp(join(stageRoot, '.embed-stage-'))
    const backup = `${stage}-previous`
    let hadPrevious = false
    try {
      for (const [name, data] of assets) await writeFile(join(stage, name), data)
      await writeFile(join(stage, 'manifest.json'), bytes)
      await writeFile(join(stage, 'manifest.json.sha256'), checksum)
      await mkdir(dirname(target), { recursive: true })
      try {
        await rename(target, backup)
        hadPrevious = true
      } catch (error) {
        if (error.code !== 'ENOENT') throw error
      }
      try {
        await rename(stage, target)
      } catch (error) {
        if (hadPrevious) await rename(backup, target)
        throw error
      }
      await rm(backup, { recursive: true, force: true })
      return target
    } finally {
      await rm(stage, { recursive: true, force: true })
    }
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  PinnedEmbed.fetch().then(path => console.log(`Verified pinned embed: ${path}`)).catch(error => {
    console.error(error.message)
    process.exitCode = 1
  })
}
