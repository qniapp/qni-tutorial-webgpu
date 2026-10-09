# 「Qni WebGPU で開く」 follow-up

## Current status - 2026-10-09 19:53 JST

**Complete and live.** The full app is hosted alongside the tutorial at `https://qniapp.github.io/qni-tutorial-webgpu/app/`, using the same pinned source as embeds. Each link opens the current committed circuit in a real noopener tab. All local targeted tests, four live popup cases, Pages deployment and all four upstream #47 checks passed. Historical investigation/blocker entries below are retained as checkpoints, not outstanding work.

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
- Milestone 19:46 JST: tutorial implementation/pin commit `ee6da1e445f491a9ce5071d78413ba64bc0a84c8` fetched/rebased and normally pushed. [Pages run 37919619852](https://github.com/qniapp/qni-tutorial-webgpu/actions/runs/37919619852) targets that exact commit and builds both products from `fd9e3c245da2d040da398f2f64eca1e737cedfba`. Watching deployment with an eight-minute cap, then running the same real-click hardware verifier against live Pages.
- Milestone 19:49 JST: Pages run **37919619852 succeeded**, build **2m39s**, deploy **10s**. Actual CI logs show both embed and standalone use cached Binaryen **123**, wasm-bindgen **0.2.129**, and the existing `-Oz --enable-bulk-memory --enable-nontrapping-float-to-int` flags. Standalone is now live at `https://qniapp.github.io/qni-tutorial-webgpu/app/` from the same fd9e3c2 pin as the embed.

## Live new-tab verification

Node 22.23.2, hardware Chromium 152.0.7977.82, AMD RDNA-3, flags `--enable-unsafe-webgpu --enable-features=Vulkan --use-angle=vulkan`. These were real anchor clicks, not direct navigation or window.open.

| Source/action | Restored app circuit | GPU state matches | Ready / noopener / base-path assets |
| --- | --- | --- | --- |
| h_gate link | Initial write-zero circuit | Yes | All passed |
| multi-3 X link | X plus write-zero on wire 1 | Yes | All passed |
| multi-3 Bell link | H, then control + X | Yes | All passed |
| multi-3 H edited with a real palette drag | HH, not the initial H attribute | Yes | All passed |

Each popup reached `__eguiReady`, stayed under `/qni-tutorial-webgpu/app/`, restored matching circuit columns from its **own normalized URL**, and matched the embed's on-demand GPU readback. All same-origin resources resolved below the app path; `window.opener` was null. **Zero console errors, zero page errors, no Table.grow.** Test-only readback never runs from the production link handler.

Raw results: `/tmp/qtw-app-link-live.json`; local results `/tmp/qtw-app-link-local.json`; verifier `/tmp/qtw-app-link-verify.mjs`; live log `/tmp/qtw-app-link-live.log`; CI provenance `/tmp/qtw-app-pages-ci.log`. The app rewrites its URL to its native raw-JSON hash after load; links initially use the required fully encoded hash.

Current vs initial: links export the **current committed circuit** on activation; uncommitted drag previews are intentionally not exported. Initial/last-valid metadata is a fallback only during startup or when a runner is unavailable. Future destination switch is in the single APP_URL constant; when retiring this temporary host, the now-unneeded standalone publishing can also be removed. Static Pages cannot host the optional external Qiskit backend; local WebGPU mode, editor persistence and URL restoration work normally.

## Final checkpoint

- Upstream/pin: `fd9e3c245da2d040da398f2f64eca1e737cedfba`; tutorial implementation: `ee6da1e445f491a9ce5071d78413ba64bc0a84c8`. No new PR; #47 is the existing upstream PR.
- #47 workflow [37918759156](https://github.com/qniapp/qni-webgpu/actions/runs/37918759156) passed all four checks on fd9e3c2: qiskit-backend **14s**, tui **23s**, web-preflight **31s**, web **11m45s**. Binaryen 123 remains pinned.
- APP_URL grep found exactly one source definition. Both pushes used fetch/rebase; no protected checkout, force push, merge or comments. Final changes are this results document only. Local server stopped, all browsers closed, inspected screenshots removed.
- Nothing remains for the requested local-WebGPU link flow. Limitations: no external Qiskit server on static Pages; activation exports committed edits rather than live uncommitted previews; popup blockers or unsupported WebGPU browsers remain normal browser constraints.
