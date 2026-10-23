# Pinned embed pilot

The verified prebuilt release is enabled by default for the T2 pages listed in
`scripts/tutorial-embed.mjs` (including the original `h_gate` pilot). Pages sets
`QNI_EMBED_PREBUILT=1`; `GH_TOKEN` is supplied to release-verifying builds.

`TutorialEmbed` owns page selection and fetches the release once per build.
`QNI_EMBED_PREBUILT=0` selects the old compiled path for all pages. Each page
can override that default with `QNI_<SLUG>_PREBUILT`: uppercase, hyphens changed
to underscores, and `INDEX` for the root page. For example,
`QNI_INSIDE_THE_QFT_PREBUILT=0` or `QNI_MULTI_7_PREBUILT=off`. Explicit `0`,
`false`, and `off` (case-insensitive) select the bundled path. The existing
`QNI_H_GATE_PREBUILT` override remains supported. Unset switches default on,
including in CI; pages outside the allowlist always stay bundled.

The layout selects `PinnedEmbed.astro` only for release-backed pages. The
shared circuit component, standalone-link helper and layout client script
remain unchanged; the standalone app still uses its compiled artifacts.

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

`PinnedEmbed.astro` compiles an inline, page-local copy of the unchanged circuit
component at build time, changing only its runtime/error-module asset base.
It registers synchronously in the head, before the shared deferred script's
guarded registration. Keeping this copy outside Vite's shared client graph
avoids common-chunk extraction that would change other pages' script hashes.
The shared component already exposes per-runner `readStateVector()`; no test-only
shipped-code change is needed. Non-H page output is checked byte-for-byte
against a fresh base build. The T2 acceptance compares `phase_gate`, `x_gate`
and `multi-1` byte-for-byte, including their referenced shared script assets.

Run lightweight fixture tests with `pnpm test:unit` (one worker, no browser).
Unit fixtures inject the verifier and do not claim real provenance.
Run `pnpm test:pinned-embed-mobile` after preparing the bundled assets and
pinned source checkout, with authenticated `gh` available to the build.
This runner fetches the actual release and verifies real attestations; it does
not substitute fixture bytes or a fixture CLI. It builds to temporary output
and previews that output with fetching disabled, without changing the release
selection already baked into the page. It removes temporary output but retains
the verified public cache; subsequent builds download and verify again.

The dedicated Chromium/SwiftShader tests require running circuits, per-runner
`readStateVector()` GPU output, release-only runtime requests, no phone horizontal
overflow, horizontal swipe, gate drag, and native vertical article scrolling.
Missing WebGPU fails rather than skips. These tests do not patch upstream input
handling or claim physical-phone compatibility. `tests/pinned-embed-t2.spec.ts`
checks release requests across the migrated routes, independent QFT runners,
multi-7, selected steps, sampling and restart. See the README for setup.

## T2 scope and T3 boundary

T2 includes the root page, `qni_intro`, `measurement_operation`,
`multi_qubit_superposition`, `random_byte_generator`, `cnot_gate`, `swap_gate`,
`entanglement`, `entanglement_operation`, `teleportation_circuit`,
`cascading_teleportation`, `long_distance_entanglement`, `increment_circuit`,
`quantum_logic`, `quantum_phase_estimation_circuit`, `shor_qft`, `bb84_circuit`,
`superdense_coding_circuit`, `amplitude_probability`, `basis_inner_product`,
`global_relative_phase`, `matrix_adjoint`, `tensor_product_state`,
`entangled_state`, `unitary_observable`, `multi-3`, `multi-7`, and
`inside_the_qft`, plus the retained `h_gate` pilot. Measurement scope is based
on executable circuit JSON, not prose or decorative measurement glyphs.

T3 still owns remaining pages (including `multi-1`), removing Rust/Trunk and
its caches/source checkout, retiring switches and compiled fallback, arranging
standalone-app tests and auxiliary SVG/font assets, and pin-update operations.
None of those paths is removed in T2.
