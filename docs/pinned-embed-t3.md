# Pinned embed: complete migration

All circuit pages, including `multi-1`, use the immutable release selected by
`qni-embed.ref`. Page allowlists, environment switches, the source compilation
script and the tutorial-hosted standalone app are removed. One shared client
component imports one release module identity per document.

## Build and deployment

`pnpm run build` downloads the manifest, verifies its checksum and GitHub
attestation, checks the API/source SHA/file metadata, and verifies every asset's
size, checksum and attestation before publication. A failed verification does
not replace the previous output. Preview serves the completed build without
network verification. Neither normal builds nor CI need upstream source, Rust,
Cargo caches, wasm targets or Trunk. Deployment waits for both build and tests.

Update only the full SHA in `qni-embed.ref` in a dedicated update PR after the
upstream release exists. Run `pnpm run test:unit`, typecheck, build, the ordinary
one-worker browser suite and isolated mobile acceptance. Review circuit startup,
editing, signed state vectors, measurements/conditions, multiple-runner isolation,
restart/device-loss recovery, narrow layouts and screenshots. Missing GPU or
incorrect state must not be converted into a passing mock. Roll back by reverting
the pin and rebuilding. Release metadata records the upstream build tools;
these are not tutorial build dependencies.

## Auxiliary assets

The same verified release supplies `h.svg`, `design-system.css`, `h-gate.js` and
`LICENSE`. The H icon build reads the verified SVG rather than invoking `git show`.
The CSS and gate module remain at their release-relative URLs for PR #21's design
components; this migration does not modify or merge that PR. They are not a
simulator custom-element API.

Generated bold glyph SVGs stay checked in. `qni-webgpu.ref` is deliberately kept
as a separate, optional regeneration source pin. `bash scripts/fetch-glyph-source.sh`
fetches its immutable git objects into an ignored source directory, without
checking out or modifying an existing upstream tree. `QNI_WEBGPU_SOURCE` can
select an existing object store. With Python `fonttools` installed, run:

```sh
python3 scripts/extract-inline-h.py --glyph h
python3 scripts/extract-inline-h.py --glyph plus
python3 scripts/extract-inline-glyphs.py
```

These scripts read the pinned geometry recipe and Geist Bold/Mono fonts. No Rust
compilation is involved. Reproduction at the current source pin preserves the
checked-in glyph geometry; provenance SHA/comment metadata may differ because
some checked-in glyphs were generated at older pins. The upstream license remains
in the optional source objects, and the release license accompanies the assets.

## Tests

Standalone `/app/` conditional-gate tests now instantiate the pinned embed,
select its final semantic step and read the same runner's GPU vector. Host tests
mock the pinned entry only; the error module and real GPU tests use the verified
release. The universal startup sweep discovers actual circuit pages from source
and expands the multi-circuit routes, so new pages cannot silently retain a
legacy runtime. It checks exact runtime request identities and normalized,
finite per-runner vectors. Existing T2 semantic and lifecycle checks remain.

T1/T2 documents describe historical migration switches, not supported current
configuration. See the README for current commands.
