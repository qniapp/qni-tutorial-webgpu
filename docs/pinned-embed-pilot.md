# Pinned embed pilot

The verified prebuilt release pilot is enabled by default for `h_gate`. Set
`QNI_H_GATE_PREBUILT=0` to use the bundled Rust/Trunk artifacts instead. The
Pages build job explicitly sets the switch to `1`, so its conditional token
wiring supplies `GH_TOKEN` to the release-verifying builds.
Only `h_gate.astro` passes the selected release directory to `HGateEmbed.astro`,
through the layout's generic head slot. Other pages and the standalone app
continue to use bundled artifacts. The shared circuit component, standalone-link
helper, and layout client script remain identical to `origin/main`.

## Independent pins

`qni-embed.ref` selects the release, currently
`33366e270556c69201da901612cb522b4e18e2ee`. The fetcher defaults to this pin.
`qni-webgpu.ref` remains the source commit for the bundled Rust/Trunk build,
shared tutorial icons and source checkout. Bumping the bundled pin would
change unrelated pages and the standalone app; the separate release pin
avoids that coupling.

The build fetches from
`https://github.com/qniapp/qni-webgpu/releases/download/embed-<full-40-character-SHA>/`.
`pnpm fetch:embed` explicitly fetches the same release.
`QNI_EMBED_RELEASE_BASE_URL` overrides the download root for isolated tests;
the fetcher appends `/embed-<SHA>/<asset>`.

## Verification policy

The release manifest uses `schema_version: 1`, the exact `source_commit`,
`embed_api_version: 1` (all other values are rejected), valid UTC `built_at`,
and nonempty `toolchain` versions: `rustc`, `wasm-bindgen`, `wasm-opt`, `trunk`,
`node`, `pnpm`. The `files` array must contain exactly these flat filenames
in release order:

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

Each entry has `name`, `sha256`, `size`, and `content_type`. Missing, extra,
duplicate, unsafe, reordered, or incorrectly typed entries are rejected.
The complete set is these eight assets plus `manifest.json` and
`manifest.json.sha256`; neither manifest file appears in `files`.

`manifest.json.sha256` is fetched first and must contain exactly one sha256sum
line: `<64 lowercase hex>  manifest.json`, with an optional final newline.
Missing, malformed, or mismatched checksums fail before parsing the manifest.
After checking the manifest checksum, the fetcher verifies its GitHub artifact
attestation before parsing it. It validates the manifest, attests the checksum
file, then downloads each asset, checks its byte size and SHA-256 against the
manifest's validated content-type metadata, and verifies its attestation.
All ten files are attested, including auxiliary assets not loaded by the page.

Each verification runs GitHub CLI with this policy (use the full SHA from
`qni-embed.ref`):

```sh
gh attestation verify <file> -R qniapp/qni-webgpu \
  --signer-workflow qniapp/qni-webgpu/.github/workflows/embed-release.yml \
  --source-ref refs/heads/master --source-digest <full-SHA>
```

Missing `gh`, CLI/authentication/network errors, and rejected attestations all
fail closed. No downloaded code is executed. Only a fully verified release is
published under the ignored `public/qni-webgpu-prebuilt/embed-<SHA>/` directory;
a failed update leaves the previous release intact. GitHub hosted runners
include `gh`. Public upstream verification requires no additional write or
`id-token` permission; the workflow retains `contents: read`.
Upstream qni-webgpu is MIT licensed; the release retains its `LICENSE`.

## Runtime boundary and acceptance

Preloads, runtime JS, WASM and error handling on `h_gate` use only the selected
release directory, with no bundled fallback. This does not replace tutorial
prose illustrations: the tutorial keeps its guarded `<h-gate>` component and
source-pinned icons. Upstream `h-gate.js` and design-system CSS are verified
auxiliary assets, not loaded, preventing duplicate custom-element registration.
The Open in Qni link retains `origin/main`'s official external destination;
the tutorial-hosted standalone app remains available for diagnostics. Neither
the Rust/Trunk build nor source checkout is removed.

`HGateEmbed.astro` compiles an inline, page-local copy of the unchanged circuit
component at build time, changing only its runtime/error-module asset base.
It registers synchronously in the head, before the shared deferred script's
guarded registration. Keeping this copy outside Vite's shared client graph
avoids common-chunk extraction that would change other pages' script hashes.
The shared component already exposes per-runner `readStateVector()`; no test-only
shipped-code change is needed. Non-H page output is checked byte-for-byte
against a fresh `origin/main` build, except its existing inner-product UUID.

Run lightweight fixture tests with `pnpm test:unit` (one worker, no browser).
Unit fixtures inject the verifier and do not claim real provenance.
Run `pnpm test:pinned-embed-mobile` after preparing the bundled assets and
pinned source checkout, with authenticated `gh` available to the build.
This runner fetches the actual release and verifies real attestations; it does
not substitute fixture bytes or a fixture CLI. It builds to temporary output
and previews that output with fetching disabled, without changing the release
selection already baked into the page. It removes temporary output but retains
the verified public cache; subsequent builds download and verify again.

The dedicated Chromium/SwiftShader test requires a running circuit, per-runner
`readStateVector()` GPU output, release-only runtime requests, and no phone
horizontal overflow. Missing WebGPU fails rather than skips. It does not patch
or work around upstream swipe behavior, nor claim physical-phone compatibility.
See the README for setup.
