# 「Qni で開く」 destination

Tutorial circuit links now target the official qni-webgpu GitHub Pages build:

```text
https://qniapp.github.io/qni-webgpu/#<encodeURIComponent(circuitJson)>
```

The Pages build is live at https://qniapp.github.io/qni-webgpu/, built with `trunk build --public-url /qni-webgpu/`, without a custom domain, for browser-local execution (WebGPU required; no external execution server).

`src/components/qni-webgpu-app-url.ts` defines the single `QNI_APP_BASE_URL` constant and `buildQniAppUrl(circuitJson)` helper. The trailing slash is required. Pass the complete serialized JSON, normally `{"cols":[...]}`, in the hash, without a `circuit=` prefix. Do not place the encoded JSON in the pathname: GitHub Pages would return 404.

Links retain `target="_blank"` and `rel="noopener"`. Activation synchronously exports the embed's current committed circuit, including edits and undo/redo; uncommitted drag previews are excluded. During startup the initial circuit is used; if export fails the last valid href is retained. The helper preserves all JSON keys without filtering or reserializing.

## Upstream compatibility

At the tutorial's pinned source, the standalone app reads the hash first, percent-decodes once, and accepts bare JSON (and optionally a Quirk-compatible `circuit=` prefix). Its history writer uses a prefix-free hash and preserves the page pathname, including `/qni-webgpu/`. It may canonicalize the JSON/hash after loading. Relative bootstrap/assets are compatible with the trailing-slash directory URL and the configured Trunk public path; the deployed output was smoke-tested.

URL compatibility does not imply support for every circuit: the pinned parser accepts `cols` and optional `title`, not arbitrary root keys. Local execution requires WebGPU and supports up to 16 qubits; larger circuits select external GPU mode, which a static-only deployment cannot serve. No upstream URL-parser or history change is needed for supported local circuits.

## Tutorial runtime

No standalone app is bundled with the tutorial. `tests/bb84-conditional.spec.ts` exercises the pinned embed directly, selecting its final step and reading that runner's GPU state. The external link destination remains independent of the tutorial's immutable embed release.

## Targeted verification

- `node --experimental-strip-types --test tests/qni-app-url.unit.mjs`: exact destination, hash-only encoding, Unicode/reserved characters and lossless metadata round trips.
- `tests/circuit.spec.ts`: exact H-gate page href, label/new-tab attributes and current committed state on pointer, focus, keyboard, click and auxiliary-click activation.

On 2026-10-18, three tutorial links were manually checked on the live site in headless Chromium with WebGPU: h_gate (`{"cols":[["|0>"]]}`), long_distance_entanglement (4 qubits, 11 columns), and qni_intro (2 qubits with H, CNOT and measurements). None showed a startup error screen; each rewritten hash decoded to the same `cols`, and each drawn circuit visually matched.
