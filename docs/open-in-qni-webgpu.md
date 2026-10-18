# 「Qni で開く」 destination

Tutorial circuit links now target the official qni-webgpu GitHub Pages build:

```text
https://qniapp.github.io/qni-webgpu/#<encodeURIComponent(circuitJson)>
```

**Publication is pending.** The destination is confirmed by the qni-webgpu maintainers but is not live yet. The app will be built with `trunk build --public-url /qni-webgpu/`, without a custom domain, for browser-local execution (WebGPU required; no external execution server).

`src/components/qni-webgpu-app-url.ts` defines the single `QNI_APP_BASE_URL` constant and `buildQniAppUrl(circuitJson)` helper. The trailing slash is required. Pass the complete serialized JSON, normally `{"cols":[...]}`, in the hash, without a `circuit=` prefix. Do not place the encoded JSON in the pathname: GitHub Pages would return 404.

Links retain `target="_blank"` and `rel="noopener"`. Activation synchronously exports the embed's current committed circuit, including edits and undo/redo; uncommitted drag previews are excluded. During startup the initial circuit is used; if export fails the last valid href is retained. The helper preserves all JSON keys without filtering or reserializing.

## Upstream compatibility

At the tutorial's pinned source, the standalone app reads the hash first, percent-decodes once, and accepts bare JSON (and optionally a Quirk-compatible `circuit=` prefix). Its history writer uses a prefix-free hash and preserves the page pathname, including `/qni-webgpu/`. It may canonicalize the JSON/hash after loading. Relative bootstrap/assets are compatible with the trailing-slash directory URL and the configured Trunk public path; the future deployed output still needs a publication smoke test.

URL compatibility does not imply support for every circuit: the pinned parser accepts `cols` and optional `title`, not arbitrary root keys. Local execution requires WebGPU and supports up to 16 qubits; larger circuits select external GPU mode, which a static-only deployment cannot serve. No upstream URL-parser or history change is needed for supported local circuits.

## Retained tutorial standalone build

The tutorial still builds the pinned standalone app at `/qni-tutorial-webgpu/app/` for integration tests and diagnostics, alongside the embed bundle. Its asset base is independent of the external link destination. Removing that build is deliberately deferred; `tests/bb84-conditional.spec.ts` still uses it directly.

## Targeted verification

- `node --experimental-strip-types --test tests/qni-app-url.unit.mjs`: exact destination, hash-only encoding, Unicode/reserved characters and lossless metadata round trips.
- `tests/circuit.spec.ts`: exact H-gate page href, label/new-tab attributes and current committed state on pointer, focus, keyboard, click and auxiliary-click activation.

These tests do not claim the pending external Pages deployment is live.
