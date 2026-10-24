import { spawn } from 'node:child_process'
import { mkdtemp, rm, symlink } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('../', import.meta.url))
const temporary = await mkdtemp(join(tmpdir(), 'qni-mobile-'))
const outDir = join(temporary, 'site')
let child
const stop = () => child?.kill('SIGTERM')
process.on('SIGINT', stop)
process.on('SIGTERM', stop)

function run(args, env) {
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
  // Astro prerender resolves build-time packages relative to the isolated output.
  await symlink(join(root, 'node_modules'), join(temporary, 'node_modules'), 'dir')
  // Fetch and verify the actual release again: never relabel bundled bytes or
  // substitute a fixture verifier in this GPU acceptance path.
  await run(['run', 'build', '--outDir', outDir], {
    ...process.env,
    QNI_EMBED_PREBUILT: '1',
    QNI_H_GATE_PREBUILT: '1',
  })
  // Preview serves the completed build without triggering another fetch.
  const previewEnv = { ...process.env, QNI_MOBILE_OUT_DIR: outDir, QNI_EMBED_PREBUILT: '0', QNI_H_GATE_PREBUILT: '0' }
  delete previewEnv.GH_TOKEN
  await run(['exec', 'playwright', 'test', '--config', 'playwright.pinned-embed-mobile.config.ts'], previewEnv)
} finally {
  process.off('SIGINT', stop)
  process.off('SIGTERM', stop)
  await rm(temporary, { recursive: true, force: true })
}
