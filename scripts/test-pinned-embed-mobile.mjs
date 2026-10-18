import { spawn, execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { createServer } from 'node:http'
import { mkdtemp, mkdir, readFile, rm, stat, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('../', import.meta.url))
const pin = (await readFile(join(root, 'qni-webgpu.ref'), 'utf8')).trim()
if (!/^[a-f0-9]{40}$/.test(pin)) throw new Error('Invalid qni-webgpu.ref')
const source = resolve(root, process.env.QNI_WEBGPU_SOURCE ?? '.qni-webgpu-source')
const cached = join(root, 'public/qni-webgpu-prebuilt', `embed-${pin}`)
// Do not overwrite or clean up a caller's existing verified release directory.
try {
  await stat(cached)
  throw new Error(`Remove the existing prebuilt cache before acceptance: ${cached}`)
} catch (error) {
  if (error.code !== 'ENOENT') throw error
}
const temporary = await mkdtemp(join(tmpdir(), 'qni-mobile-'))
const outDir = join(temporary, 'site')
const release = join(temporary, `embed-${pin}`)
const types = { '.mjs': 'text/javascript', '.js': 'text/javascript', '.wasm': 'application/wasm', '.css': 'text/css', '.svg': 'image/svg+xml' }
const files = []
const contents = new Map()
let server
let child
const stop = () => child?.kill('SIGTERM')
process.on('SIGINT', stop)
process.on('SIGTERM', stop)

function run(args, env = process.env) {
  return new Promise((accept, reject) => {
    child = spawn('pnpm', args, { cwd: root, env, stdio: 'inherit' })
    child.once('error', reject)
    child.once('exit', (code, signal) => {
      child = undefined
      if (code === 0) accept()
      else reject(new Error(`pnpm ${args.join(' ')} failed (${signal ?? code})`))
    })
  })
}

try {
  await mkdir(release, { recursive: true })
  async function asset(name, bytes) {
    const extension = name.slice(name.lastIndexOf('.'))
    const content_type = types[extension] ?? 'text/plain'
    files.push({ name, sha256: createHash('sha256').update(bytes).digest('hex'), size: bytes.length, content_type })
    const destination = join(release, name)
    await mkdir(dirname(destination), { recursive: true })
    await writeFile(destination, bytes)
    contents.set(`/embed-${pin}/${name}`, { bytes, content_type })
  }
  // Never replace the real Rust/wasm runtime with a mock or synthetic module.
  for (const name of ['qni-embed.mjs', 'qni-embed-error.mjs', 'qni-web.js', 'qni-web_bg.wasm']) {
    await asset(name, await readFile(join(root, 'public/qni-webgpu', name)))
  }
  for (const [name, path] of [
    ['h.svg', 'apps/web/assets/icons/h.svg'],
    ['design-system.css', 'docs/design-system/design-system.css'],
    ['h-gate.js', 'docs/design-system/components/h-gate.js'],
    ['LICENSE', 'LICENSE'],
  ]) {
    await asset(name, execFileSync('git', ['-C', source, 'show', `${pin}:${path}`]))
  }
  const manifest = Buffer.from(JSON.stringify({
    schema_version: 1,
    source_commit: pin,
    embed_api_version: 1,
    built_at: new Date().toISOString(),
    // This is a repackaging fixture, not a claim of release-toolchain provenance.
    toolchain: { rustc: 'ci-built-fixture', 'wasm-bindgen': 'ci-built-fixture', 'wasm-opt': 'ci-built-fixture', trunk: 'ci-built-fixture' },
    files,
  }, null, 2))
  await writeFile(join(release, 'manifest.json'), manifest)
  contents.set(`/embed-${pin}/manifest.json`, { bytes: manifest, content_type: 'application/json' })
  const checksum = Buffer.from(`${createHash('sha256').update(manifest).digest('hex')}  manifest.json\n`)
  await writeFile(join(release, 'manifest.json.sha256'), checksum)
  contents.set(`/embed-${pin}/manifest.json.sha256`, { bytes: checksum, content_type: 'text/plain' })
  server = createServer((request, response) => {
    const entry = contents.get(new URL(request.url, 'http://fixture.invalid').pathname)
    if (!entry) { response.writeHead(404).end(); return }
    response.writeHead(200, { 'content-type': entry.content_type, 'content-length': entry.bytes.length })
    response.end(entry.bytes)
  })
  await new Promise((accept, reject) => {
    server.once('error', reject)
    server.listen(0, '127.0.0.1', accept)
  })
  const baseUrl = `http://127.0.0.1:${server.address().port}`
  await run(['run', 'build', '--outDir', outDir], {
    ...process.env,
    QNI_H_GATE_PREBUILT: '1',
    QNI_EMBED_RELEASE_BASE_URL: baseUrl,
  })
  // Preview must not trigger opt-in fetching again or inherit a global opt-in.
  const previewEnv = { ...process.env, QNI_MOBILE_OUT_DIR: outDir }
  delete previewEnv.QNI_H_GATE_PREBUILT
  delete previewEnv.QNI_EMBED_RELEASE_BASE_URL
  await run(['exec', 'playwright', 'test', '--config', 'playwright.pinned-embed-mobile.config.ts'], previewEnv)
} finally {
  process.off('SIGINT', stop)
  process.off('SIGTERM', stop)
  if (server) await new Promise(accept => server.close(accept))
  await rm(temporary, { recursive: true, force: true })
  await rm(cached, { recursive: true, force: true })
}
