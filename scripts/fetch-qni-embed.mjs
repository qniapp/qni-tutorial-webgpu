import { createHash } from 'node:crypto'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { mkdir, mkdtemp, readFile, rename, rm, writeFile } from 'node:fs/promises'
import { basename, dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

export class PinnedEmbed {
  static assets = [
    ['qni-web.js', 'text/javascript'],
    ['qni-web_bg.wasm', 'application/wasm'],
    ['qni-embed.mjs', 'text/javascript'],
    ['qni-embed-error.mjs', 'text/javascript'],
    ['h.svg', 'image/svg+xml'],
    ['design-system.css', 'text/css'],
    ['h-gate.js', 'text/javascript'],
    ['LICENSE', 'text/plain'],
  ]

  static digest(bytes) {
    return createHash('sha256').update(bytes).digest('hex')
  }

  static runGh = promisify(execFile)

  static async verifyAttestation(filename, sha) {
    await this.runGh('gh', [
      'attestation', 'verify', filename, '-R', 'qniapp/qni-webgpu',
      '--signer-workflow', 'qniapp/qni-webgpu/.github/workflows/embed-release.yml',
      '--source-ref', 'refs/heads/master', '--source-digest', sha,
    ], { timeout: 60_000 })
  }

  static async download(url) {
    const response = await fetch(url, { signal: AbortSignal.timeout(60_000) })
    if (!response.ok) throw new Error(`Pinned embed download failed: ${response.status} ${url}`)
    return Buffer.from(await response.arrayBuffer())
  }

  static validateManifest(manifest, sha) {
    if (!manifest || manifest.schema_version !== 1) throw new Error('Pinned embed: unsupported schema_version')
    if (manifest.source_commit !== sha) throw new Error('Pinned embed: source_commit does not match qni-webgpu.ref')
    if (manifest.embed_api_version !== 1) {
      throw new Error('Pinned embed: unsupported embed_api_version (expected 1)')
    }
    if (typeof manifest.built_at !== 'string'
      || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/.test(manifest.built_at)
      || !Number.isFinite(Date.parse(manifest.built_at))
      || new Date(manifest.built_at).toISOString().slice(0, 19) !== manifest.built_at.slice(0, 19)) {
      throw new Error('Pinned embed: built_at must be valid UTC')
    }
    for (const key of ['rustc', 'wasm-bindgen', 'wasm-opt', 'trunk', 'node', 'pnpm']) {
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
      const expected = this.assets.find(([name]) => name === file.name)
      if (!expected) throw new Error(`Pinned embed: unexpected asset ${file.name}`)
      if (file.content_type !== expected[1]) throw new Error(`Pinned embed: wrong content_type for ${file.name} (expected ${expected[1]})`)
      if (typeof file.sha256 !== 'string' || !/^[a-f0-9]{64}$/.test(file.sha256)
        || !Number.isSafeInteger(file.size) || file.size < 0
        || typeof file.content_type !== 'string' || !file.content_type.trim()) {
        throw new Error(`Pinned embed: invalid metadata for ${file.name}`)
      }
    }
    for (const [name] of this.assets) {
      if (!names.has(name)) throw new Error(`Pinned embed: missing required asset ${name}`)
    }
    if (manifest.files.some((file, index) => file.name !== this.assets[index][0])) {
      throw new Error('Pinned embed: manifest asset order mismatch')
    }
  }

  static async fetch({ refFile = 'qni-webgpu.ref', outputDir, verifyAttestation = this.verifyAttestation.bind(this), baseUrl = process.env.QNI_EMBED_RELEASE_BASE_URL ?? 'https://github.com/qniapp/qni-webgpu/releases/download' } = {}) {
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
      const attest = async name => {
        try {
          await verifyAttestation(join(stage, name), sha)
        } catch (error) {
          const detail = error.code === 'ENOENT' ? 'gh is missing; install GitHub CLI' : (error.code ? `gh error (${error.code})` : 'verifier rejected artifact')
          throw new Error(`Pinned embed: attestation verification failed for ${name}: ${detail}`, { cause: error })
        }
      }
      await writeFile(join(stage, 'manifest.json'), bytes)
      await attest('manifest.json')
      const manifest = JSON.parse(bytes.toString('utf8'))
      this.validateManifest(manifest, sha)
      await writeFile(join(stage, 'manifest.json.sha256'), checksum)
      await attest('manifest.json.sha256')
      for (const file of manifest.files) {
        const data = await this.download(`${release}${file.name}`)
        if (data.length !== file.size) throw new Error(`Pinned embed: size mismatch for ${file.name}`)
        if (this.digest(data) !== file.sha256) throw new Error(`Pinned embed: sha256 mismatch for ${file.name}`)
        await writeFile(join(stage, file.name), data)
        await attest(file.name)
      }
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
