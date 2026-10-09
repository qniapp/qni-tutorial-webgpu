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

**Owner decision needed:** provide an existing public standalone URL, or explicitly authorize hosting a standalone master build (including the intended origin/path and deployment configuration). The current evidence does not establish a publicly deployed WebGPU app or a deployment built from master.
