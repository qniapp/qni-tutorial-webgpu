# Pinned embed pilot

The default remains the Rust/Trunk-built bundle on **every page**, including
`h_gate`. Keep the pilot off until the first upstream embed release exists.

To opt in for `h_gate` only, run `QNI_H_GATE_PREBUILT=1 pnpm build` (or `pnpm dev`).
This is the page-specific switch in `astro.config.mjs`; only `h_gate.astro`
passes its selected directory to the layout. Other pages, the standalone app,
and the default CI/deployment build still use the existing bundled artifacts.
Do not enable this environment variable globally in deployment yet.

The build fetches from
`https://github.com/qniapp/qni-webgpu/releases/download/embed-<full-40-character-SHA>/`,
using `qni-webgpu.ref`. `pnpm fetch:embed` can explicitly fetch the same release.
`QNI_EMBED_RELEASE_BASE_URL` overrides the releases/download root for fixtures;
the fetcher appends `/embed-<SHA>/<asset>`.

The release manifest uses `schema_version: 1`, the exact `source_commit`,
`embed_api_version: 1` (all other values are rejected), UTC `built_at`, and
`toolchain` versions in release order: `rustc`, `wasm-bindgen`, `wasm-opt`, `trunk`,
`node`, `pnpm`. Manifest fields are emitted in this order: `schema_version`,
`source_commit`, `embed_api_version`, `built_at`, `toolchain`, `files`.
The `files` array must contain exactly these flat filenames in release order:

| Name | `content_type` |
| --- | --- |
| `qni-web.js` | `text/javascript` |
| `qni-web_bg.wasm` | `application/wasm` |
| `qni-embed.mjs` | `text/javascript` |
| `qni-embed-error.mjs` | `text/javascript` |
| `h.svg` | `image/svg+xml` |
| `design-system.css` | `text/css` |
| `h-gate.js` | `text/javascript` |
| `LICENSE` | `text/plain` |

Each entry has `name`, `sha256`, `size`, and `content_type` in that order.
Missing, extra, duplicate, reordered, or incorrectly typed entries are rejected.
The complete published set is these eight assets plus `manifest.json` and
`manifest.json.sha256`; neither manifest file appears in `files`. Every listed
file is verified, including auxiliary assets not currently loaded by the pilot.
The release serializes the manifest as two-space-indented JSON with a trailing
newline. Unit and mobile fixtures share one builder that mirrors this output.
`manifest.json.sha256` is required and fetched first. It must contain exactly
one sha256sum line: `<64 lowercase hex>  manifest.json` followed by a newline in
the real release and shared fixtures. The fetcher also accepts an absent final
newline as a compatibility allowance.
Missing, malformed, or mismatched checksums fail before the manifest is parsed
or trusted. Checksums alone do not prove provenance. After checking the manifest
checksum, the fetcher verifies its GitHub artifact attestation before parsing it.
It validates the manifest, attests the checksum file, then downloads each asset,
checks its size and SHA-256 against the manifest's validated `content_type`
metadata, and verifies its attestation. All ten release files are attested:
`manifest.json`, `manifest.json.sha256`, and all eight assets above.

Each verification runs GitHub CLI with this policy (substitute the file and the
full SHA from `qni-webgpu.ref`):

```sh
gh attestation verify <file> -R qniapp/qni-webgpu \
  --signer-workflow qniapp/qni-webgpu/.github/workflows/embed-release.yml \
  --source-ref refs/heads/master --source-digest <full-SHA>
```

Missing `gh`, CLI/authentication/network errors, and rejected attestations all
fail closed. No downloaded code is executed, and nothing is installed until
all checks pass; a failed update leaves any previously installed release intact.
GitHub runners already include `gh`. The CI build step that performs the opt-in
fetch receives `GH_TOKEN: ${{ github.token }}` only when
`QNI_H_GATE_PREBUILT` is `1`; it remains off here. Public upstream attestations
do not require an additional `attestations: read` permission; existing
`contents: read` suffices. Unit fixtures inject the verifier rather than contact
GitHub.

Upstream qni-webgpu is MIT licensed; the verified release retains its `LICENSE`.
The pilot keeps the tutorial's guarded `<h-gate>` component and pinned icon.
Upstream gate modules (including its unguarded `h-gate.js`) and design-system CSS
are verified auxiliary assets only: they are not imported or loaded on the page,
so the two `<h-gate>` implementations are never registered together.

Only a fully verified release is published under the ignored
`public/qni-webgpu-prebuilt/embed-<SHA>/` directory. Missing releases, malformed
manifests and mismatched files fail the build. Preloads, runtime JS, wasm and
error handling on the pilot all use that directory; there is no bundled
fallback. Other build-time illustrations still use the pinned source checkout.
The Rust/Trunk build and source checkout are intentionally not removed.

Run the lightweight fixture tests with `pnpm test:unit` (one worker, no browser).
Run `pnpm test:pinned-embed-mobile` after building the bundled artifacts and
preparing the pinned source checkout. This dedicated phone acceptance test uses
real locally built embed artifacts, not a mocked runner. Its isolated child build
substitutes a fixture CLI that checks exact fixture bytes and verification policy
arguments; locally repackaged fixtures do not claim upstream attestations. This
is not a production provenance bypass. CI runs it after the
default site build, using a separate temporary output and a 390px touch/mobile
Chromium viewport with SwiftShader. It requires a running circuit and no page
horizontal overflow; it does not work around upstream swipe behavior. Readback
uses each circuit's `readStateVector()`, not the module-level
`read_state_vector()` that targets the last-prepared runner. See the
README for setup. It must remain separate from the normal deployment build.
