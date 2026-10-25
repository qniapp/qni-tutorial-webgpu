import { test } from 'node:test'
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { chmod, copyFile, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

// Exercise the real checkout validation and build invocation without compiling
// Rust. The fixture builder models upstream's source-provenance precedence.
test('source build records the validated engine SHA, not the parent Actions SHA', async () => {
  const root = await mkdtemp(join(tmpdir(), 'qni-source-provenance-'))
  try {
    const checkout = join(root, 'engine')
    const bin = join(root, 'bin')
    await mkdir(join(root, 'scripts'), { recursive: true })
    await mkdir(join(checkout, 'apps/web/scripts'), { recursive: true })
    await mkdir(bin)
    await copyFile(new URL('../scripts/fetch-qni-webgpu.sh', import.meta.url), join(root, 'scripts/fetch-qni-webgpu.sh'))
    await writeFile(join(checkout, 'apps/web/scripts/build-embed.sh'), `#!/usr/bin/env bash
set -euo pipefail
mkdir -p "$1"
source_commit="\${QNI_SOURCE_COMMIT:-\${GITHUB_SHA:-$(git rev-parse HEAD)}}"
printf 'export const SOURCE_COMMIT = "%s";\\n' "$source_commit" > "$1/qni-embed.mjs"
`)
    const git = args => execFileSync('git', ['-C', checkout, ...args], { encoding: 'utf8' }).trim()
    git(['init', '--quiet'])
    git(['add', '.'])
    git(['-c', 'user.name=Test', '-c', 'user.email=test@example.invalid', 'commit', '--quiet', '-m', 'Engine fixture'])
    const engine = git(['rev-parse', 'HEAD'])
    await writeFile(join(root, 'qni-webgpu.ref'), `${engine}\n`)
    for (const tool of ['rustup', 'pnpm', 'trunk']) {
      const file = join(bin, tool)
      await writeFile(file, '#!/bin/sh\nexit 0\n')
      await chmod(file, 0o755)
    }
    const parent = '1111111111111111111111111111111111111111'
    assert.notEqual(engine, parent)
    const env = { ...process.env, PATH: `${bin}:${process.env.PATH}`, GITHUB_SHA: parent }
    delete env.QNI_SOURCE_COMMIT
    const run = () => execFileSync('bash', [join(root, 'scripts/fetch-qni-webgpu.sh'), checkout], { env, stdio: 'pipe' })
    for (const inheritedSource of [undefined, parent]) {
      if (inheritedSource === undefined) delete env.QNI_SOURCE_COMMIT
      else env.QNI_SOURCE_COMMIT = inheritedSource
      run()
      assert.equal(await readFile(join(root, 'public/qni-webgpu/qni-embed.mjs'), 'utf8'), `export const SOURCE_COMMIT = "${engine}";\n`)
    }

    // The provenance override must not bypass exact-checkout validation.
    await writeFile(join(root, 'qni-webgpu.ref'), `${parent}\n`)
    assert.throws(run, /Checkout must be at the commit/)
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})
