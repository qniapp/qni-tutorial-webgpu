# 「Qni WebGPU で開く」 follow-up

## Status - 2026-10-09 19:13 JST

- Bounded Step 4 started at 19:13 JST: 27-minute limit, ship/checkpoint around 19:36 JST. Fetch/rebase before each normal push; no force/merge/comments. No new PR unless a substantial upstream URL-support change is necessary.
- Existing tutorial pin: `dfb300d960824029a084a8d3e75b3f9dea5cd67f`. Binaryen 123 stays pinned.

## URL contract and deployment discovery

- Standalone source `apps/web/src/url_circuit.rs` and `url_circuit/decode.rs` accepts Quirk-style `{"cols":[...]}` as a bare JSON hash, raw or `encodeURIComponent`-encoded: `APP_URL#${encodeURIComponent(circuitJSON)}`. Control gates use `•`; empty cells use `1`; ordinary gates include H/X/Y/Z/S/T. This is circuit metadata, not quantum-state serialization.
- `QniApp` already stores committed editor JSON in its active circuit-library entry, updated by edits/undo/redo even in embed mode. A small synchronous per-runner getter can export the current committed circuit without GPU readback or CPU simulation. In-progress drag previews are not committed circuits.
- **Deployment blocker found:** repository metadata has `default_branch: master`, `homepage: null`, no GitHub deployment records. GitHub Pages API `/repos/qniapp/qni-webgpu/pages` returned 404; `https://qniapp.github.io/qni-webgpu/` also returns HTTP 404. Both the current branch and `origin/master` contain only `.github/workflows/ci.yml`, not a Pages/web-deploy workflow. README documents local/ABCI/container operation but gives no public standalone URL. Thus a public app destination and its deployed source revision cannot currently be verified.
- Asked the orchestrator for the actual deployed standalone URL or authorization to host a master build alongside the tutorial. Do not silently substitute the WebGL Qni app, invent a destination, or publish a broken link. The existing URL parser does not need a new PR.

## Milestone - 2026-10-09 19:17 JST

- Verified fetched master SHA `41e1d3ff35ed546fbd39f01efcdba17e02bcc0b0`. Its URL decoder, encoder and URL-contract module are byte-identical to the current embed branch versions (no diff). Thus URL circuit support is already in master, not dependent on merging #47.
- Verified the small current-circuit export seam: `WebRunner::app_mut::<QniApp>()` can access the per-runner active circuit entry synchronously, but requires implementing wasm-only `App::as_any_mut` (the default returns None). This is feasible without changing standalone URL support, sharing editor state, GPU readback, or computing quantum state on CPU. No API change has been made while the destination is unresolved.
- Decision: **do not publish a nonfunctional link or create an unrelated deployment PR**. Initial-circuit fallback alone does not resolve the missing destination. No production files, upstream branch, pin or Binaryen configuration have changed; only this investigation/status document is being committed.
- Blocked deliverables: component link UI, popup/circuit tests, current-circuit export and live new-tab checks. No `/tmp/qtw-link-live.json` is claimed or created because there is no verified destination to test. No test suite or server/browser was started for this investigation.

## Resume after the destination is supplied

1. Verify the actual standalone deployment URL, its source branch/revision, and hash restoration in hardware Chromium.
2. Prefer the small synchronous current-committed-circuit getter above. Otherwise explicitly use the initial circuit attribute.
3. Add the exact label `Qni WebGPU で開く`, `target="_blank"`, `rel="noopener"`; encode JSON in the hash. Update href synchronously before default link navigation so popup blocking is avoided; cover keyboard and mouse activation.
4. Run targeted component tests, publish any small upstream change with fmt/clippy and fetch/rebase first, repin and deploy tutorial, then verify H-gate and all three multi-embed links plus an actual edited circuit. Save `/tmp/qtw-link-live.json`.

**Owner decision needed at the initial checkpoint:** provide an existing public standalone URL, or authorize hosting a standalone build. The initial evidence did not establish a public destination.

## Authorized hosting implementation - 2026-10-09 19:32 JST

- Owner selected hosting alongside the tutorial, now explicitly from the **same pinned upstream SHA as the embeds**, not a separate master checkout. Destination: `/qni-tutorial-webgpu/app/` on tutorial Pages. This supersedes the earlier master-hosting proposal/blocker.
- Bounded implementation started 19:32 JST; 28-minute hard limit, ship/status checkpoint around 19:56 JST. Keep Binaryen 123; upstream fmt/clippy/relevant tests before push; fetch/rebase before every normal push.
- Plan: small synchronous current-committed-circuit getter, one destination constant, accessible real anchor navigation, dual pinned builds, targeted local nested-path/popup verification, Pages deployment, hardware live new-tab checks. No new PR or infrastructure service is needed.
- Milestone 19:38 JST: small upstream getter committed/pushed as `fd9e3c245da2d040da398f2f64eca1e737cedfba` after fmt, wasm32 clippy `-D warnings`, 16 relevant embed library tests and six Node 22 loader/export tests passed. Getter returns the active library's committed JSON, scoped through the owning WebRunner; wasm-only `as_any_mut` enables safe downcasting. No GPU readback or standalone URL change.
- Destination is defined **once** in `src/components/qni-webgpu-app-url.ts` as exported `APP_URL`. It is root-relative for identical local/live path verification; later it can become an absolute official app URL. The fetch/build script imports this same constant to derive Trunk's public asset path. Component refreshes href synchronously on pointerdown/focus/keydown/click/auxclick using current committed metadata; startup/unavailable runners retain an initial/last-valid link. No window.open is used.
- Asset audit: standalone bootstrap imports, CSS fonts, icons and bootstrap entry are relative; Trunk rewrites generated JS/wasm/CSS under the configured public path. The only local URL in the error page is an explicitly localhost-only troubleshooting example. External GPU `run` resolves relative to the page, but static Pages does not host that backend; default local WebGPU execution remains supported.
- Milestone 19:44 JST: both optimized pinned artifacts built locally; standalone uses the APP_URL-derived public path, and generated `public/app/` is ignored rather than committed. Fixed the concrete Trunk `NO_COLOR=1` incompatibility by unsetting NO_COLOR, matching the existing embed build. Typecheck and all **16 targeted component tests** passed under Node 22, including exact label, safe attributes, encoding and current export on four activation events.
- Real local hardware clicks under the exact Pages base path passed four popup cases: H-gate initial state, multi-X, multi-Bell, and multi-H edited by an actual palette H drag (HH). Each new tab reached ready, restored matching circuit columns, matched GPU state, had `window.opener === null`, and loaded every same-origin resource under the app base path. Zero console/page/Table.grow errors. Raw `/tmp/qtw-app-link-local.json`. Inspected standalone and widget screenshots; footer link is separate from the canvas and visible without overlaying controls.
- Grep proof: `rg -n '(export )?const APP_URL\\s*=' src scripts` reports only `src/components/qni-webgpu-app-url.ts:3`. Upstream #47 checks on fd9e3c2: qiskit-backend, tui, web-preflight passed; web still running. Publishing tutorial dual-build/link/pin next.
