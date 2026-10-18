#!/usr/bin/env node
// Mobile fixture substitute for gh, NOT a provenance verifier. It accepts only
// the exact fixture bytes and policy arguments in the isolated acceptance run.
import { readFile } from 'node:fs/promises'
import { basename, join } from 'node:path'
import assert from 'node:assert/strict'

const [command, operation, filename, ...policy] = process.argv.slice(2)
const sha = process.env.QNI_MOBILE_FIXTURE_SHA
assert.equal(command, 'attestation')
assert.equal(operation, 'verify')
assert.match(sha ?? '', /^[a-f0-9]{40}$/)
assert.deepEqual(policy, [
  '-R', 'qniapp/qni-webgpu',
  '--signer-workflow', 'qniapp/qni-webgpu/.github/workflows/embed-release.yml',
  '--source-ref', 'refs/heads/master', '--source-digest', sha,
])
assert.deepEqual(await readFile(filename), await readFile(join(process.env.QNI_MOBILE_FIXTURE_RELEASE, basename(filename))))
