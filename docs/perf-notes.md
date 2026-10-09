# Performance follow-up notes

## 2026-10-09 - Investigation started

- Scope: verify Binaryen/wasm-bindgen compatibility, pin the optimizer if supported, audit standalone WebGL/font impact, then verify actual circuit execution in hardware WebGPU Chromium.
- Existing results and measurement caveats: [load-performance.md](load-performance.md).
- Starting upstream HEAD: `761fcfa1929f4ce0ce8f436500c507f8eb0b49c5`; tutorial HEAD: `6457656`.
- Rules retained: no push, merge, PR, `cd`, protected-checkout edits, or identity changes. Servers and browsers started here will be stopped.
- Initial inspection: upstream `apps/web/Trunk.toml` has no `[tools]` pin. Tutorial Pages CI installs Trunk `0.21.14` and caches `~/.cache/trunk`; Node is 24 in the workflow. Tool selection and compatibility have not yet been established.

## Tool provenance and reported failure - primary-source findings

- Local optimizer: `/home/yasuhito/.cache/trunk/wasm-opt-version_123/bin/wasm-opt`, reporting `wasm-opt version 123 (version_123)`. SHA-256: `d66c6724c07334155720eb2def29c434dcaaf741ce859b4f7f389e22674f9c4a`. No `wasm-opt` is on this session's PATH; no `TRUNK_TOOLS_WASM_OPT` override is set.
- Local bindgen: `/home/yasuhito/.cache/trunk/wasm-bindgen-0.2.129/wasm-bindgen`, reporting `wasm-bindgen 0.2.129`; `apps/web/Cargo.lock` selects the matching Rust crate.
- [Trunk 0.21.14 tool selection source](https://github.com/trunk-rs/trunk/blob/v0.21.14/src/tools.rs): default downloaded optimizer is `version_123`, but without an explicit version requirement it accepts **any** optimizer found on PATH before using its cache. That means the existing CI configuration was not sufficient to prevent an old system/Python binary from being selected. A `[tools] wasm_opt = "version_123"` pin is supported by [Trunk's configuration model](https://github.com/trunk-rs/trunk/blob/v0.21.14/src/config/models/tools.rs). With a pin, mismatched PATH versions are rejected in favor of the required download/cache; a matching-version PATH binary remains eligible. CLI/environment overrides can deliberately override the configuration.
- [wasm-bindgen #4228](https://github.com/wasm-bindgen/wasm-bindgen/issues/4228): release-only `RangeError: failed to grow table`; the reporter verified Binaryen **119** did not reproduce it. The issue was closed as resolved, but later reports again implicated system Binaryen. It does not provide an exhaustive affected-version or flag matrix.
- [wasm-pack #1446](https://github.com/wasm-bindgen/wasm-pack/issues/1446) specifically reports Ubuntu Binaryen **105** and Rust 1.82 reference types/multivalue, with system-tool preference causing miscompilation.
- [wasm-bindgen #2943](https://github.com/wasm-bindgen/wasm-bindgen/issues/2943) links the reference-types failure to [Binaryen #4711](https://github.com/WebAssembly/binaryen/issues/4711). Reproductions there name Binaryen **108/109**, bindgen **0.2.81**, bindgen `--reference-types --weak-refs`, optimizer `--enable-reference-types -Oz` (also `--debuginfo` in a profiling example).
- Root cause documented by Binaryen's maintainer: exporting table 1 was incorrectly rewritten to table 0, not simply an inherently unsafe optimization level. [Fix #4736](https://github.com/WebAssembly/binaryen/pull/4736), merged 2022-06-17, replaces a hard-coded export index. The maintainer explicitly verified the corrected testcase with `-Oz`.
- Next: pin version 123, confirm actual Trunk subprocess arguments for both profiles, and exercise optimized bundles in hardware Chromium rather than treating version age as sufficient proof.

## Pin applied and build observations

- Added `[tools] wasm_opt = "version_123"` in upstream `apps/web/Trunk.toml`. The embed build now enables Trunk's verbose logs so future Pages logs identify selected tools and their exact subprocess arguments. Tutorial CI's Trunk cache key now includes `Trunk.toml` as well as `Cargo.lock`.
- Both local optimized builds selected `/home/yasuhito/.cache/trunk/wasm-opt-version_123/bin/wasm-opt` and cached wasm-bindgen `0.2.129`. Build logs: `/tmp/qtw-followup-embed-build.log`, `/tmp/qtw-followup-standalone-build.log`.
- Exact optimizer argument sequence for both profiles: `--output=<apps/web/target/wasm-opt/release/qni-web_bg.wasm> -Oz <dist/.stage/qni-web_bg.wasm> --enable-bulk-memory --enable-nontrapping-float-to-int`. No `--all-features`, explicit `--enable-reference-types`, `--debuginfo`, or `--weak-refs` is added. The two added flags enable already-emitted Rust instructions, not aggressive transformation passes.
- Bindgen arguments: `--target=web --out-dir=<apps/web/target/wasm-bindgen/release> --out-name=qni-web <target/wasm32-unknown-unknown/{embed,release}/qni_web.wasm> --no-typescript`. No bindgen `--reference-types` or `--weak-refs` flag. Generated JS uses an object-handle `heap` array and contains no `Table.grow` / externref-table initialization call.
- [Binaryen comparison](https://github.com/WebAssembly/binaryen/compare/4652398b62ce0546f015cdc2c7b3010938c7c5a9...version_123) confirms release 123 contains the #4736 merge (`4652398b62ce0546f015cdc2c7b3010938c7c5a9`): comparison status `ahead`, behind=0, merge base equals that fix commit.
- Embedded wasm is byte-identical after pinning: SHA-256 `90dc5defa96c8b95c009d9c6c52068e17f6e98085555b62e44cc5b0a3b5565d7`, raw **9,874,155 B**. Standalone optimized release wasm: **9,476,180 B**. No optimization was dropped and no size cost was incurred.
- Expected Pages selection: official Binaryen `version_123` Linux x86_64 download/cache at `$HOME/.cache/trunk/wasm-opt-version_123/bin/wasm-opt`, with the same flags and bindgen 0.2.129 from the pinned Cargo lock. A matching-version PATH binary can still be used by Trunk; mismatched old versions cannot. CI has not been run remotely in this session. Verbose build logs will provide the actual CI pathname after the orchestrator runs it.

## Standalone scope audit - source and font data

- Compared with the pre-optimization commit `e33ee46`: `src/lib.rs` already set `Backends::BROWSER_WEBGPU` for **both** standalone and embed. The existing regression test also required no WebGL fallback. No CPU or WebGL simulation fallback was removed by switching eframe features; previously compiled WebGL was unreachable.
- Standalone unsupported-GPU handling remains HTML/browser-rendered: bootstrap catches initialization failure and shows the `webgpu-error` UI and troubleshooting dialog. It does not rely on an egui/WebGL renderer to draw that error screen. Hardware/no-WebGPU browser verification remains to be completed below.
- The pre-optimization `QniApp::new_with_startup` already used `FontDefinitions::empty()`, then registered exactly Geist Regular/Medium/Mono, the Japanese subset, and explicit Hack 0.33.3. These registrations, assets, and proportional/monospace fallback orders are unchanged. Dropping eframe `default_fonts` removes unregistered Ubuntu/Noto Emoji/Hack 0.35 data, not a used fallback.
- Cmap audit `/tmp/qtw-font-audit.json` confirms retained coverage for `⟨ ⟩`, directional and undo/redo arrows, `▷ ▾ ▸`, `… † √ ∞ ± − × • ◦ ⊕ ⊖`, Greek symbols, and Japanese names including 髙/﨑. In particular, the ket brackets and several arrows are covered by explicit Hack.
- Toolbar icons are painter geometry in `src/render/toolbar.rs`; gate glyphs use SVG/SDF textures. They do not depend on emoji fonts.
- Arbitrary emoji such as 🚀/💡/✅/😀 and ⚠ are absent from the unchanged custom font set. None is used as a UI text glyph in the audited Rust/HTML sources. Such characters in user-entered circuit names were already unsupported before this optimization, not a new regression. Enabling the Cargo default-font feature alone would not fix them because the app replaces the definitions; supporting them would require an explicit font-family fallback and is outside this change.
- Decision so far: retain the global feature reduction, since no standalone WebGPU behavior or registered glyph coverage was lost. Native graphics backends are still outside this browser-only app's deployment scope.

## Hardware browser verification completed

- Verification harness: `/tmp/qtw-verify-safety.mjs`; results persisted after every run to `/tmp/qtw-followup-browser.json`. Invoked with the tutorial's local built H-gate page and a static server of `/tmp/qtw-followup-standalone-dist/` at port 4174.
- Chromium **152.0.7977.82**, headless, using the same flags as the performance measurements: `--enable-unsafe-webgpu --enable-features=Vulkan --use-angle=vulkan`. Adapter: vendor `amd`, architecture `rdna-3`, not SwiftShader.
- Three fresh-context runs for **each** optimized artifact. Embed was changed from the zero-state circuit to an H circuit; standalone restored the H circuit through its normal URL path and reload. Every run changed GPU readback from `[1, 0, 0, 0]` to `[0.7071067690849304, 0, 0.7071067690849304, 0]`. This checks actual shader execution, not just runner readiness. GPU readback was test-only.
- Every hardware-enabled run had **zero console errors and zero page errors**. No `Table.grow` failure. Screenshots showed the H gate and two half-probability disks in both artifacts.
- Standalone also saved/restored a circuit named `量子 ⟨H⟩ → 日本語`; Japanese, ket brackets, arrow, palette symbols, state header and toolbar icons rendered without tofu in the inspected screenshot.
- A separate fresh context with `navigator.gpu` removed showed the normal `webgpu-error` screen and Linux troubleshooting dialog. It had no unhandled page error; the expected raw diagnostic was `No suitable graphics adapter found`. No WebGL rendering path was needed to show or operate the error UI.
- Safety verdict: **retain the pinned Binaryen 123 optimizer** for these tested artifacts. The historical wrong-table-export fix is present, the vulnerable externref initializer is not used in this bindgen mode, and both real optimized products executed H correctly. This is evidence for this exact combination, not a universal guarantee for arbitrary future tool versions or flags.

## Old-PATH selection probe and measurement preservation

- A temporary test executable at `/tmp/qtw-old-binaryen/wasm-opt` reported version 105 for `--version` and would fail if used for optimization. This simulates an incompatible PATH tool; it is not a Binaryen-105 miscompilation reproduction.
- Built through the normal `build-embed.sh` with that directory prepended to PATH. Trunk logged `tool version mismatch (required: version_123, system: version_105)`, then selected the cached official version-123 binary. The simulated tool was called only with `--version`. Evidence: `/tmp/qtw-old-path-probe.log`, `/tmp/qtw-old-binaryen-calls.txt`.
- Probe output again had SHA-256 `90dc5defa96c8b95c009d9c6c52068e17f6e98085555b62e44cc5b0a3b5565d7`. The pin and verbose logging do not change wasm bytes, JS glue, runtime behavior or transfer size.
- Thus the final after-measurement from [load-performance.md](load-performance.md) remains applicable without rerunning a noisy benchmark: raw ready **73.3 ms cold / 101.3 ms warm**; gzip-server ready **323.6 / 75.9 ms**. Wasm sizes remain **9,874,155 B raw / 4,929,252 B gzip-9 / 3,897,050 B Brotli-11**. Existing `/tmp/qtw-perf-after-local.json` is preserved.
- The two manual verification servers were stopped. Screenshots were inspected; trashing temporary filesystem files was unsupported, so those temporary images will be removed directly. Browsers were closed in the harness's `finally` block.

## Scope tightened after extending the audit

- Although the documented standalone product is the browser app, `apps/web/src/main.rs` also contains a native entry-point stub. Rather than infer that every non-browser consumer can lose graphics backends, I narrowed the eframe feature change to `cfg(target_arch = "wasm32")`.
- The browser target keeps `wgpu_no_default_features` plus `web_screen_reader`; both browser entry points retain their explicit fonts and WebGPU-only behavior.
- The non-wasm target now preserves the exact original eframe feature list: `wgpu`, `default_fonts`, `web_screen_reader`. This removes unintended native graphics/font scope from the size optimization. Native GUI startup is not claimed as verified; native library checks will be rerun.
- Added regression checks for the optimizer pin, exact feature-enabling flags, and target-specific eframe feature lists. Browser artifact hashes and checks will be recorded after rebuilding this narrower configuration.

## Narrowed configuration rebuilt and checked

- Final embed wasm remains byte-identical: **9,874,155 B**, SHA-256 `90dc5defa96c8b95c009d9c6c52068e17f6e98085555b62e44cc5b0a3b5565d7`. Final standalone wasm also remains byte-identical: **9,476,180 B**, SHA-256 `9e910cd8bd36d59db4270a70c6a51100d7ece0d1db186b691ec986d28d87269d`. Native feature preservation has no browser size or timing cost.
- Artifact directories: `/tmp/qtw-followup-final-embed/`, `/tmp/qtw-followup-final-standalone/`. Logs: `/tmp/qtw-followup-final-embed.log`, `/tmp/qtw-followup-final-standalone.log`.
- Cargo feature trees confirm wasm eframe only has `wgpu_no_default_features` and `web_screen_reader`; native eframe includes `wgpu`, `default_fonts`, and `web_screen_reader`. Evidence: `/tmp/qtw-followup-wasm-features.txt`, `/tmp/qtw-followup-native-features.txt`. Cargo regenerated the lock file to retain native font dependencies without compiling them into wasm.
- Passed so far in this follow-up: Rust fmt; wasm32 clippy with `-D warnings`; **417** library tests; **188** Node preflight tests (including three new config/scope checks) plus **3** streaming-loader tests; both optimized Trunk builds. Node checks used Node **22.23.2** LTS.
- The matching browser artifact hashes mean the already-recorded hardware circuit verification and after-measurement apply to the narrowed configuration too. Browser suites and documentation lint will also be rerun before committing.

## Final upstream checks before commit

- Passed **all 294 upstream Playwright tests**, including the five optimized-embed tests, and **6 BDD scenarios / 31 steps**, under Node 22 LTS. Logs: `/tmp/qtw-followup-all-playwright.log`, `/tmp/qtw-followup-bdd.log`.
- Documentation lint passed (terminology, HTML structure, Markdown); no pending snapshots; both repositories passed whitespace checks. Logs: `/tmp/qtw-followup-docs-lint.log`.
- Parallel independent reviews were attempted but still unavailable because the delegation backend requires missing Herdr environment variables. Manual correctness, coverage, scope and documentation review was completed. Important limits are recorded above: no remote CI run, matching-version PATH tools remain possible, and native GUI startup was not tested.
- Next: commit upstream pin/scope fixes, update `qni-webgpu.ref`, rebuild through the clean pinned-checkout script and run the tutorial checks before committing these notes.

## Status (resume 2026-10-09 18:10 JST)

- Done before interruption: tool pin and scope fixes; byte-identical optimized builds; hardware circuit verification; fmt/clippy; 417 library tests; 188 preflight plus 3 loader tests; 6 BDD scenarios; all 294 upstream Playwright tests; documentation lint; no pending snapshots. No need to repeat long suites.
- Remaining: quick fmt/config/whitespace checks, commit and push upstream, update and push tutorial pin/notes/cache key, watch Pages for at most about 12 minutes, then measure and verify the deployed H-gate page and push docs-only results.
- The orchestrator now authorizes **normal pushes of these two branches only**. No force push, merge, PR, `cd`, protected-checkout edits, or identity changes. Hard resume budget: 25 minutes; stop and report if deployment fails or exceeds the watch budget.

## Resume quick checks and upstream publication

- Passed the requested quick checks: `cargo fmt --check`, the three Node config/scope tests under Node 22.23.2, and `git diff --check`.
- Committed follow-up as `dd189d2f88efd96cf1a1df3944fa288242f71f20`: `build(web): pin wasm-opt version_123 and scope eframe features to wasm32`.
- Normal push of `feat/tutorial-embed` succeeded, publishing this commit together with `e33ee46` and `761fcfa`. Updated the tutorial pin to that final SHA.
- GitHub's push response reported two existing default-branch Dependabot alerts (one high, one moderate). No security dependency update is attempted within this bounded deployment task; owner review remains necessary.

## Pages deployment started

- Tutorial publication commit: `7292ae86d4d9b7cf4e8feaf411f1c9e70da012c9`, `build: deploy pinned WebGPU optimizer and record safety checks`. Normal push of main succeeded, also publishing `31a867f` and `6457656`.
- Pages run [37909494860](https://github.com/qniapp/qni-tutorial-webgpu/actions/runs/37909494860) targets that exact tutorial SHA and upstream pin `dd189d2f88efd96cf1a1df3944fa288242f71f20`.
- Watching this run with a roughly 12-minute limit. No new local server or long test suite is being started during the resume.

## Pages deployed and live measurement captured

- Pages run 37909494860 succeeded: build **1m49s**, deployment **11s**. Its verbose log confirms the actual CI optimizer `/home/runner/.cache/trunk/wasm-opt-version_123/bin/wasm-opt` and bindgen `/home/runner/.cache/trunk/wasm-bindgen-0.2.129/wasm-bindgen`, with the exact previously recorded arguments. Evidence saved to `/tmp/qtw-pages-ci.log`.
- CI produced **9,845,787 B** raw wasm, 28,368 B smaller than the local artifact. The CI/local artifacts are not byte-identical; the precise compiler/environment cause has not been isolated. This live artifact is separately being verified below rather than assuming local verification is sufficient.
- Live HEAD response at 18:13 JST: `application/wasm`, **gzip**, `Content-Length: 4927724`, `Last-Modified: Fri, 09 Oct 2026 09:11:51 GMT`, `Cache-Control: max-age=600`. Saved headers: `/tmp/qtw-after-live-headers.txt`.
- Ran the unchanged measurement command with five cold/warm pairs, the same hardware Chromium/Vulkan flags and AMD RDNA-3 adapter, saving `/tmp/qtw-perf-after-live.json`. Cold/warm ready medians: **536.3 / 80.6 ms**; download: **446.6 / 27.5 ms**; streaming compile/instantiate: **426.2 / 31.5 ms**; adapter+device: **3.3 / 2.3 ms**; shader span: **56.9 / 16.7 ms**; first-frame proxy: **595.6 / 155.0 ms**.
- Separate live console/page-error and H-amplitude verification is next. No local server was needed for the live measurements; the measurement script closed its browser.

## Live verification and before/after results

- `/tmp/qtw-verify-live.mjs` separately verified the deployed artifact using hardware Chromium 152.0.7977.82 and AMD RDNA-3. Results: `/tmp/qtw-live-verification.json`.
- **Zero console errors, zero page errors, no Table.grow error.** Initial GPU amplitudes `[1,0,0,0]` became `[0.7071067690849304,0,0.7071067690849304,0]` after setting the element's circuit to `{"cols":[["H"]]}`. The real GPU compute path executed; readback was test-only.
- All ten measured loads had one wasm resource entry and one streaming instantiation. The separate H/restart verification also reused a single wasm download.
- Five cold/warm pairs each, same measurement script, Chromium flags and hardware adapter as the saved live baseline. Sizes are bytes; durations are median milliseconds. Streaming compile overlaps download, shader span includes work between calls, and first frame is the documented submit/two-animation-frame proxy. Adapter+device excludes speculative early warm-up and records the actual runner acquisition.

| Live metric | Before cold | After cold | Before warm | After warm |
| --- | ---: | ---: | ---: | ---: |
| Wasm transfer size B | 6,788,254 | 4,928,024 | 6,788,254 | 0 |
| Wasm encoded body B | 6,787,954 | 4,927,724 | 6,787,954 | 4,927,724 |
| Wasm decoded body B | 13,365,301 | 9,845,787 | 13,365,301 | 9,845,787 |
| Wasm download ms | 2,201.5 | 446.6 | 2,731.5 | 27.5 |
| Streaming compile/instantiate ms | 2,209.0 | 426.2 | 2,739.6 | 31.5 |
| Adapter + device ms | 54.7 | 3.3 | 52.6 | 2.3 |
| Shader/pipeline API calls ms | 0.3 | 0.5 | 0.3 | 0.4 |
| Shader/pipeline span ms | 67.2 | 56.9 | 16.0 | 16.7 |
| First-frame proxy ms | 3,292.9 | 595.6 | 2,902.7 | 155.0 |
| Ready ms | 3,212.1 | 536.3 | 2,836.5 | 80.6 |

- Live gzip body is **27.4% smaller**, decoded body **26.3% smaller**. Observed ready medians are **83.3% lower cold / 97.2% lower warm**. Network variation means the cold speedup cannot be attributed exclusively to byte reduction. Warm behavior changes substantially because early preloads are reused from cache; baseline reloads transferred the whole wasm, whereas optimized reloads report transfer size zero.
- Raw evidence: `/tmp/qtw-perf-before-live.json`, `/tmp/qtw-perf-after-live.json`, `/tmp/qtw-after-live-measure.log`, `/tmp/qtw-after-live-headers.txt`, `/tmp/qtw-pages-ci.log`, `/tmp/qtw-live-verification.json`.
- Upstream publication/pin is final at `dd189d2f88efd96cf1a1df3944fa288242f71f20`. Next commit contains **only these measurement documents**; no pin or runtime changes. No deployment or live verification failed. All resume browsers have closed and no resume server was started.

## Step 3: multiple embeds (2026-10-09)

- Started 18:27 JST with a 26-minute hard budget; checkpoint/ship at about 18:49 JST. Targeted tests only, Node 22; normal pushes authorized, no force/merge/PR/comments.
- Inspection: each editor already owns a QniApp, input state, egui context, renderer callback resources and GPU state buffers. Wasm initialization already shares one promise/module. Actual hardware reproduction on the current live page: three independent elements reached running but requested **three GPUDevices**.
- Remaining hazards: fallback glyph texture handles and SDF surface format live in thread-local caches instead of egui contexts; global test readback targets the last painted runner. Planned changes: context-owned glyph/format caches, shared WebGPU setup with serialized startup, per-runner on-demand state readback, visible shared-device-loss handling, 1/3/7 fixture pages, targeted hardware isolation checks and live measurements.
- Milestone 18:39 JST: implemented those changes. Hardware local **seven**-embed test passed: one GPUDevice, one wasm resource, correct distinct GPU amplitudes; replacing only embed 0 changed its amplitudes and left all six others byte-for-byte unchanged. Explicitly destroying the real shared GPUDevice logged loss and showed a visible reload message in all seven affected elements. No unexpected console/page/Table.grow error. Inspected the full-page screenshot: all seven circuits, phase disks, palette icons and Japanese labels rendered correctly.
- Checks: wasm32 cargo check; wasm32 clippy `-D warnings`; focused Rust context-format isolation test; five Node 22 streaming/startup tests including seven concurrent starts and recovery after runner failure; tutorial TypeScript check and Astro build. `astro check` requested an absent optional dependency and was not a valid check, so the project's existing `npm run typecheck` was used instead. Native targeted tests still emit existing cfg/dead-code warnings; no test failed.
- Existing single-runner global diagnostic readback APIs remain legacy test-only last-painted-runner hooks, not production caches. Multiple-embed tests use the new runner/element readStateVector method, which obtains buffers from that runner's own renderer. No production readback was introduced. GPU setup intentionally shares only instance/adapter/device/queue; egui contexts, textures, renderer resources, state buffers and input remain independent. Startup is serialized to avoid a first-device initialization race.
- Milestone 18:42 JST: upstream `173cabc1b149e706f3a9437778a82607e7347259` committed and normally pushed; Binaryen 123 pin unchanged. Manual review checked ownership, stale startup destruction, loss-listener cleanup and lock lifetime before asynchronous readback. Shared adapter acquisition preserves eframe's power preference. Updated tutorial pin; publishing fixture pages next. Local server initially returned 404 because the Pages base path was missing, then was corrected with a temporary root alias; this was a test-server configuration error, not an application failure.
- Milestone 18:46 JST: tutorial fixture/pin commit `cb4103c07389ad0f057b4d8ff9115ef8c7098cf9` pushed. Pages run [37913185656](https://github.com/qniapp/qni-tutorial-webgpu/actions/runs/37913185656) succeeded (build 1m41s, deploy 11s). Starting live three cold/warm pairs each for 1/3/7 embeds, using a checkpointing harness at `scripts/measure-multi.mjs`; raw output `/tmp/qtw-multi-live.json`. Memory samples distinguish JS heap from wasm linear memory; GPU/native memory is not observable through the available browser APIs. rAF intervals are cadence proxies, not exclusive GPU execution times.
- Milestone 18:49 JST: all **18 live loads passed**, one wasm streaming instantiation/resource and one GPUDevice each; zero console/page/Table.grow errors; modifying embed 0 left every other GPU state unchanged. All-ready medians cold/warm: **1 embed 592.4/95.8 ms; 3 embeds 537.3/79.9 ms; 7 embeds 540.8/81.0 ms**. Wasm memory: **9.31/11.63/16.19 MiB**. Idle/drag rAF medians **16.7/16.7 ms**, p95 16.7-16.8 ms. Full tables, per-embed times, memory caveats and method: [multi-embed.md](multi-embed.md). Raw `/tmp/qtw-multi-live.json` saves after every load.
- Final bounded checkpoint: server stopped, browsers closed, inspected temporary screenshot removed. Shipping the measurement harness and docs now, without further test suites. Remaining: GPU/native memory unavailable, large/mobile/all-simultaneously-visible workloads untested, device recovery uses visible reload instructions rather than automatic restart. Existing global diagnostics remain unsuitable for identifying multiple runners; use the new per-element API.

## Step 3 fix: drag_controller deadlock (2026-10-09)

- Started 18:57 JST; 27-minute hard limit, ship/status checkpoint around 19:20 JST. Verification only: another watcher already pushed `dfb300d960824029a084a8d3e75b3f9dea5cd67f`; do not duplicate or rewrite its fix. Normal pushes require fetch and rebase first.
- Upstream worktree is clean and HEAD equals fetched origin/feat/tutorial-embed at that SHA (preceded by `83a9984`, the SDF test-placement clippy fix). Four PR #47 checks are running on workflow 37914566815; a bounded 16-minute watch runs concurrently with local verification and tutorial deployment.
- Root cause under audit: cold SVG fallback glyph allocation was performed inside `ctx.data_mut`, and `ctx.load_texture` re-entered the same egui context write lock. The native drag-preview/shift-copy snapshot tests render fallback glyphs without WebGPU/SDF setup, whereas the normal hardware browser path uses SDF and bypasses this allocation.
- Milestone 18:59 JST: confirmed `draw_circuit`/`draw_drag_preview` in `rendered_gate_bodies` reaches raster glyph allocation on a cold egui context. Fixed lookup/allocation/insertion are separate lock scopes. Audited all context data/memory closures added since `dd189d2`: SDF format closures only insert/retrieve copied values; SVG closures only access the map/handle ID. No other nested context acquisition found. Per-runner readback clones resources inside the renderer lock and releases it before awaiting GPU mapping. No additional upstream change is needed.
- On clean origin head `dfb300d960824029a084a8d3e75b3f9dea5cd67f`: **420/420 cargo test --lib passed**, including the nine drag-controller failures and new cold-allocation/reuse/context-isolation regressions; `cargo fmt --check` passed; wasm32 clippy with `-D warnings` passed. Logs `/tmp/qtw-fix-lib-tests.log`, `/tmp/qtw-fix-clippy.log`. No test suite beyond the requested library suite was run.
- Milestone 19:06 JST: tutorial pin/notes commit `e0ae56c2f80f28f60d078d599151718fce74e9f0` committed, fetched/rebased onto origin/main, and normally pushed. [Pages run 37914864268](https://github.com/qniapp/qni-tutorial-webgpu/actions/runs/37914864268) succeeded; verbose CI confirms Binaryen 123, bindgen 0.2.129 and unchanged optimizer flags. Live wasm has 9,854,812 decoded bytes; gzip HEAD length 4,932,373 B, last-modified 10:02:13 UTC, confirming the new deployment rather than the old fixture artifact.
- Live `/multi-7/` passed on hardware Chromium 152.0.7977.82 / AMD RDNA-3, same Vulkan flags. Actual pointer drag placed a second H from the palette: first vector changed from H superposition to approximately `[1,0,0,0,0,0,0,0]`. Actual Shift+click insertion copied H: vector returned to approximately `[0.7071,0,0.7071,0,0,0,0,0]`. No attribute replacement was used to simulate these edits.
- At all five stages (before, palette-drag held, placed, shift-copy held, committed), the other six vectors were compared as **raw Uint8Array bytes**, including signed-zero bits, and stayed identical. The final live verifier was rerun under **Node 22.23.2**. All seven readbacks together resolved in **4.7-6.4 ms** per stage; rAF counts advanced **61 → 93 → 112 → 129 → 152**. One GPUDevice, one wasm resource and one streaming instantiation throughout. Zero console/page errors; no Table.grow, RwLock or deadlock messages. Screenshots confirmed HH placement and the HHH insertion preview; no visible rendering defect. Raw evidence `/tmp/qtw-fix-live.json`, script `/tmp/qtw-fix-live.mjs`, logs `/tmp/qtw-fix-live.log` and `/tmp/qtw-fix-pages-ci.log`.
- PR checks on exact upstream head `dfb300d`: qiskit-backend passed (15s), tui passed (33s), web-preflight passed (24s); web still running. The bounded concurrent watch continues. No upstream fix was duplicated or changed.
- Milestone 19:10 JST: **all four #47 checks passed on exact head dfb300d**: qiskit-backend **15s**, tui **33s**, web-preflight **24s**, web **12m58s**. Workflow [37914566815](https://github.com/qniapp/qni-webgpu/actions/runs/37914566815) is successful; the bounded watch exited normally. This includes the long web job, not just local smoke checks.
- Completion: the existing upstream fix is verified without modification; tutorial pin is final at `dfb300d960824029a084a8d3e75b3f9dea5cd67f`. Publishing this results-only checkpoint after fetching/rebasing main. No remaining deadlock, lock-reentry audit finding or live failure. No local server was started; all verification browsers closed; inspected screenshots removed. The earlier Step 3 limitations (GPU memory unavailable, large/mobile workloads untested, device-loss recovery via reload) are unchanged.

## pi-bot final pinned-checkout verification

- Publication/resume entries above were added by the external orchestrator while this pi-bot session was checking the same worktrees. **This pi-bot session did not push, merge, open a PR, or start a remote CI run.** Existing publication commits were preserved rather than rewritten.
- Independently read successful Pages run 37909494860: actual CI Binaryen path `/home/runner/.cache/trunk/wasm-opt-version_123/bin/wasm-opt`, version 123; bindgen `/home/runner/.cache/trunk/wasm-bindgen-0.2.129/wasm-bindgen`, version 0.2.129. Same optimizer arguments as the local builds: `-Oz --enable-bulk-memory --enable-nontrapping-float-to-int` plus input/output paths. Filtered evidence: `/tmp/qtw-followup-pages-tools.txt`. The older successful run 37896006506 also downloaded these versions, but without the explicit pin.
- Rebuilt through `scripts/fetch-qni-webgpu.sh` against the **clean, committed** final upstream SHA `dd189d2f88efd96cf1a1df3944fa288242f71f20`. Local wasm still hashes to `90dc5defa96c8b95c009d9c6c52068e17f6e98085555b62e44cc5b0a3b5565d7`; no local size or runtime change. Build log: `/tmp/qtw-followup-pinned-build.log`.
- Reran tutorial typecheck, Astro build and **all 13 tutorial Playwright tests**, including real pinned-runner startup and one-wasm-request verification. Passed with no browser console/page errors. Log: `/tmp/qtw-followup-tutorial-tests.log`.
- Read the separately persisted live H-verification result `/tmp/qtw-live-verification.json`: the deployed, CI-built artifact also executed H on the AMD hardware adapter with zero console/page errors and one wasm request. This covers the small CI/local byte difference rather than assuming identical binaries.
- Final pin remains `dd189d2f88efd96cf1a1df3944fa288242f71f20`. All manual servers and browsers started by this pi-bot session are stopped; temporary inspected screenshots were removed. Remaining changes are measurement/verification notes only.
