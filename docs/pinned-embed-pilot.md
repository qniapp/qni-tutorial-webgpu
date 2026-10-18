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
`embed_api_version`, UTC `built_at`, `toolchain` versions (`rustc`, `wasm-bindgen`,
`wasm-opt`, `trunk`), and `files` entries with `name`, `sha256`, `size`, and
`content_type`. Assets use flat filenames: the four runtime files, `h.svg`,
`design-system.css`, gate component files, and `LICENSE`. Every listed file is
verified, including auxiliary assets not currently loaded by the pilot.
`manifest.json.sha256` is required and fetched first. It must contain exactly
one sha256sum line: `<64 lowercase hex>  manifest.json` (optional final newline).
Missing, malformed, or mismatched checksums fail before the manifest is parsed
or trusted. This checks integrity, not a cryptographic signature or independent
proof of provenance.

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
real locally built embed artifacts, not a mocked runner. CI runs it after the
default site build, using a separate temporary output and a 390px touch/mobile
Chromium viewport with SwiftShader. It requires a running circuit and no page
horizontal overflow; it does not work around upstream swipe behavior. Readback
uses each circuit's `readStateVector()`, not the module-level
`read_state_vector()` that targets the last-prepared runner. See the
README for setup. It must remain separate from the normal deployment build.
