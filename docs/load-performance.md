# H-gate load performance

Measured on 2026-10-09. Initial local measurements were completed before pushing. The optimized site was subsequently deployed with authorization and measured live; see the live results below and [the progress/safety notes](perf-notes.md).

## Method

```sh
node /path/to/qni-tutorial-webgpu/scripts/measure-load.mjs URL /tmp/results.json 5
```

Each of five runs creates a fresh Chromium context (empty HTTP cache), navigates once for cold results, then reloads in the same context for warm results. One browser process is shared, so OS/driver and engine caches are not reset. Browser: `/usr/bin/chromium`, headless, flags `--enable-unsafe-webgpu --enable-features=Vulkan --use-angle=vulkan`. Hardware adapter info: vendor `amd`, architecture `rdna-3`; device and description were empty. PCI reports AMD Strix Halo Radeon 8050S/8060S graphics. No SwiftShader was used for measurements.

The script injects Performance API marks/measures around actual WebGPU acquisition and shader/pipeline methods, plus `WebAssembly.instantiateStreaming`, before page scripts execute. The embed also publishes stable wasm-fetch, wasm-instantiated and runner marks. The baseline live deployment lacked those embed marks; injected instrumentation still measured the live APIs and ready state.

Definitions and limitations:

- Download: Resource Timing `requestStart` to `responseEnd`, including server wait.
- Compile/instantiate: duration of `instantiateStreaming`, overlapping download. Not an exclusive CPU compilation time. `postDownloadInit` separately measures response-end to wasm-bindgen init completion when embed marks are available.
- Adapter/device: last adapter acquisition plus device acquisition, excluding the speculative early adapter. Raw acquisition calls are retained in after JSON.
- Shader/pipeline calls: sum of JS API call durations. Span: first shader/pipeline call start to last call completion. Driver compilation may be deferred to submission; these are not exclusive GPU execution timings.
- First frame: first GPU queue submission followed by two animation frames, a presentation proxy, not an exact hardware display timestamp.
- Ready: navigation start to the custom element's `running` state (loading indicator hidden). As before, this precedes the first-frame presentation proxy.
- Every measured navigation used streaming instantiation and exactly one wasm Resource Timing entry. Preloading is reused, not double-downloaded.

Local runs used the same temporary static server rooted at `dist/`, under `/qni-tutorial-webgpu/`, raw on port 4322 and gzip level 6 on port 4323. Gzip is generated per request before headers, so cold download timings include server compression CPU time; do not interpret them as CDN network throughput. The server advertises `max-age=600`, with no ETag. Ordinary reload still transferred the baseline dynamically fetched wasm; early preloads allowed warm cache reuse after optimization. This cache difference is part of observed reload behavior, not a simulated cache hit. Use the same serving policy for comparisons.

## Baseline artifacts

Instrumentation was committed before the baseline: upstream `e33ee46`, tutorial `31a867f`. Local baseline retains the original release build and existing `wasm-opt -Oz`, with no optimization changes.

- `/tmp/qtw-perf-before.json`: local raw baseline.
- `/tmp/qtw-perf-before-gzip.json`: local gzip baseline.
- `/tmp/qtw-perf-before-live.json`: pre-optimization Pages deployment.
- `/tmp/qtw-perf-after-live.json`: deployed optimized Pages results, five cold/warm pairs.
- `/tmp/qtw-perf-after-local.json`: final local raw results.
- `/tmp/qtw-perf-after-local-gzip.json`: final local gzip results.
- `/tmp/qtw-perf-O3-webgpu-only-local.json`: final feature graph with `-O3`.
- `/tmp/qtw-size-report.json`: exact compressed-size comparisons.
- `/tmp/qtw-twiggy-top.txt`, `/tmp/qtw-twiggy-symbols.txt`: size attribution.

## Baseline Pages compression

```sh
curl -sI -H 'Accept-Encoding: gzip, br, zstd' https://qniapp.github.io/qni-tutorial-webgpu/qni-webgpu/qni-web_bg.wasm
```

Pages served `Content-Type: application/wasm`, `Content-Encoding: gzip`, `Content-Length: 6787954`, `Vary: Accept-Encoding`, `Cache-Control: max-age=600`. Browser Resource Timing: transfer size **6,788,254 B**, encoded body **6,787,954 B**, decoded body **13,365,301 B** (cold and reload). Brotli/zstd were offered but gzip was selected. Live cold/warm median ready: **3,212.1 / 2,836.5 ms**; wasm download: **2,201.5 / 2,731.5 ms**. Network variability is substantial. The rebuilt local baseline is 17,676 B larger raw than the deployed binary, so live and local binaries are not byte-identical. The deployed optimized results are recorded below.

## Wasm variants

Exact bytes. Gzip level 9, Brotli quality 11. All fat-LTO experiments use codegen-units=1 and strip=true. The first eight rows keep the original feature graph. Stripped profile experiments required explicit Binaryen feature enablement (`--all-features` for the exploratory rows); the final Trunk build enables only bulk memory and nontrapping float-to-int, matching emitted Rust instructions. Binaryen version 123 was already cached by Trunk. The intermediate font-only rows precede removal of the unused WebGL backend.

| Variant | Raw B | Gzip B | Brotli B |
| --- | ---: | ---: | ---: |
| Baseline release / Oz | 13,382,977 | 6,771,056 | 5,343,409 |
| Baseline release / O3 | 13,631,170 | 6,799,008 | 5,355,437 |
| opt=3, fat / Oz | 12,568,820 | 6,535,026 | 5,200,858 |
| opt=3, fat / O3 | 12,868,478 | 6,553,448 | 5,203,725 |
| opt=s, fat / Oz | 13,029,169 | 6,523,670 | 5,157,061 |
| opt=s, fat / O3 | 13,478,954 | 6,571,062 | 5,180,242 |
| opt=z, fat / Oz | 12,837,344 | 6,402,859 | 5,091,596 |
| opt=z, fat / O3 | 13,310,884 | 6,448,779 | 5,103,240 |
| opt=z, fat, no default fonts / Oz | 11,585,514 | 5,614,133 | 4,399,687 |
| opt=z, fat, no default fonts / O3 | 11,926,666 | 5,665,656 | 4,428,109 |
| **Chosen: opt=z, fat, no default fonts, WebGPU-only / Oz** | **9,874,155** | **4,929,252** | **3,897,050** |
| opt=z, fat, no default fonts, WebGPU-only / O3 | 10,143,135 | 4,971,398 | 3,916,544 |

Chosen variant reduces raw size by **26.2%**, gzip by **27.2%**, Brotli by **27.1%** versus the rebuilt baseline. Final O3 ready medians were 91.2 ms cold / 123.1 ms warm, compared with the final Oz run's 73.3 / 101.3 ms. No measured startup advantage justified O3's larger payload. This is a startup comparison, not a deep-circuit runtime benchmark.

`twiggy top` on the baseline reports data segments of 3,560,452 B (26.60%), 855,935 B, 407,391 B, 307,289 B, then two 275,143 B segments. Embedded font data is the leading component. The retained Japanese font asset alone is 3,747,064 B. Symbol-bearing compiler output identifies leading code in epaint text layout, naga WGSL parsing/validation and GLSL writing, wgpu-core render encoding, skrifa font hinting, and Qni UI layout. Cargo's feature tree traced WebGL/wgpu-core to `eframe/wgpu -> egui-wgpu/default -> wgpu/webgl`. Switching to `eframe/wgpu_no_default_features` with explicit `wgpu/webgpu` removes that unused backend without adding a fallback.

## Local phase medians

Milliseconds; five cold/warm pairs each. Phases overlap and must not be summed.

| Phase | Before cold | After cold | Before warm | After warm |
| --- | ---: | ---: | ---: | ---: |
| Wasm download (raw server) | 19.7 | 28.6 | 23.9 | 15.4 |
| Streaming compile/instantiate | 33.1 | 20.3 | 32.2 | 23.4 |
| Post-download init tail | 19.5 | 9.6 | 19.4 | 13.9 |
| Runner adapter + device | 58.5 | 1.8 | 56.1 | 1.6 |
| Shader/pipeline API calls | 0.5 | 0.3 | 0.5 | 0.4 |
| Shader/pipeline span | 58.5 | 55.4 | 18.2 | 19.8 |
| First-frame proxy from navigation | 225.0 | 134.8 | 225.1 | 183.4 |
| Ready from navigation | 152.9 | 73.3 | 149.8 | 101.3 |

| Gzip server phase | Before cold | After cold | Before warm | After warm |
| --- | ---: | ---: | ---: | ---: |
| Wasm download | 440.9 | 286.9 | 435.7 | 29.0 |
| Streaming compile/instantiate | 60.4 | 38.5 | 58.5 | 32.6 |
| Runner adapter + device | 54.5 | 2.1 | 53.8 | 3.0 |
| Shader/pipeline span | 65.7 | 51.2 | 16.5 | 20.6 |
| First-frame proxy | 631.5 | 376.2 | 608.3 | 158.0 |
| Ready | 566.3 | 323.6 | 532.2 | 75.9 |

## Changes and checks

- Immediate head script on circuit pages starts modulepreloads, a reusable wasm fetch preload, and `prepareEmbed()`. Unsupported browsers and the index do not eagerly load wasm.
- An early adapter request warms the driver in parallel with download. It is not passed into Rust/wgpu; no speculative device is allocated. Rust retains its own adapter/device acquisition.
- Fetch progress is streamed into a Response and then wasm-bindgen. Same-origin identity responses show percentage; compressed/unknown/CORS totals show decoded MB. Japanese stages: ダウンロード中, コンパイル中, GPU 初期化中, 準備中. Stale lifecycle callbacks are ignored.
- Shared initialization can retry after failure; new regression tests cover single fetch, compression accounting, retry, UI stages, and real preload reuse.
- Normal release profile unchanged. Japanese/Geist/Hack fonts and screen reader remain. No persistence/image codec features were removed. `rustc --target wasm32-unknown-unknown --print cfg` already reports `panic="abort"`; no new panic policy was introduced. Native unit tests still pass. The follow-up scopes the eframe reduction to wasm32 and preserves the original native graphics/default-font features; native GUI startup was not claimed as verified.
- Passed: Rust fmt; wasm32 clippy with `-D warnings`; 417 library tests; no pending snapshots; standalone Trunk release build; optimized embed build; 188 Node preflight tests after the follow-up plus 3 loader tests; 63 GPU kernel tests; typechecks; 6 BDD scenarios; all 294 upstream Playwright tests (including 5 embed tests); all 13 tutorial Playwright tests; upstream documentation lint; diff whitespace checks.
- Hardware Chromium also rendered the standalone release with `__eguiReady=true` and no page errors. Tutorial and standalone screenshots were visually checked and removed.
- One denied-adapter test expected a removed WebGL surface error. It now verifies the actual WebGPU-only adapter error, not a weakened alternative match.
- One Node 26.10 V8 compilation crash occurred during preflight. The final preflight passes under the documented Node 22 LTS toolchain (22.23.2); use Node 22 for these checks.
- Independent reviews were attempted but the delegation tool required unavailable Herdr environment variables. A manual correctness/coverage/complexity review was completed instead. The referenced `agent-kit/AGENTS.MD` is also absent from this workspace.

Upstream commits: `e33ee46` (instrumentation), `761fcfa1929f4ce0ce8f436500c507f8eb0b49c5` (optimized loader/build), `dd189d2f88efd96cf1a1df3944fa288242f71f20` (Binaryen pin and wasm32-only scope). The final pin is `dd189d2f88efd96cf1a1df3944fa288242f71f20`. Both branches were published with authorization; Pages deployment and live verification succeeded. All manually started servers and browsers are stopped. No protected checkout was modified.

## Deployed live results - 2026-10-09

[Pages run 37909494860](https://github.com/qniapp/qni-tutorial-webgpu/actions/runs/37909494860) deployed tutorial commit `7292ae86d4d9b7cf4e8feaf411f1c9e70da012c9`, using the final upstream pin above. CI build took 1m49s and deploy took 11s. The same measurement script ran five cold/warm pairs against `https://qniapp.github.io/qni-tutorial-webgpu/h_gate/`, with the same hardware Chromium/Vulkan flags and AMD RDNA-3 adapter as the live baseline.

Pages serves `Content-Type: application/wasm`, **`Content-Encoding: gzip`**, **`Content-Length: 4927724`**, `Cache-Control: max-age=600`. Raw CI wasm is **9,845,787 B**, versus local **9,874,155 B**; the small compiler/environment difference has not been isolated, and these binaries are not assumed byte-identical.

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

Sizes and phases are medians, with the overlap/proxy caveats from the method section. The live gzip body shrank **27.4%**, raw body **26.3%**. Observed ready medians fell **83.3% cold / 97.2% warm**. Network variation contributes to the cold difference; it cannot all be attributed to wasm shrinkage. Early preloads now reuse the browser cache on reload (transfer size zero), whereas baseline reloads transferred the full wasm.

Every measured load had one wasm resource entry and one streaming instantiation. A separate live verification collected **zero console/page errors and no Table.grow error**, then changed the real GPU amplitudes from `[1,0,0,0]` to `[0.7071067690849304,0,0.7071067690849304,0]` using H. The H/restart check also reused one wasm download. Readback was test-only.

CI verbose logs confirm Binaryen **123** at `/home/runner/.cache/trunk/wasm-opt-version_123/bin/wasm-opt`, using `-Oz --enable-bulk-memory --enable-nontrapping-float-to-int`, and wasm-bindgen **0.2.129** at `/home/runner/.cache/trunk/wasm-bindgen-0.2.129/wasm-bindgen`. Bindgen uses `--target=web --no-typescript`; no explicit reference-types/weak-refs options are added. Tool provenance, #4228 evidence, native feature preservation, and the old-PATH rejection probe are detailed in [perf-notes.md](perf-notes.md).

Evidence: `/tmp/qtw-perf-after-live.json`, `/tmp/qtw-after-live-headers.txt`, `/tmp/qtw-pages-ci.log`, `/tmp/qtw-live-verification.json`. The final measurement update is docs-only and does not change the upstream pin.
