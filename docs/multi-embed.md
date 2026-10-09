# Multiple WebGPU embeds

Deployed 2026-10-09: `/multi-1/`, `/multi-3/`, `/multi-7/`. Circuits cover H, X, Bell (H+CNOT), Y, Z, S and T with 2-3 qubits. Upstream pin: `173cabc1b149e706f3a9437778a82607e7347259`; tutorial fixture commit: `cb4103c07389ad0f057b4d8ff9115ef8c7098cf9`. [Pages run](https://github.com/qniapp/qni-tutorial-webgpu/actions/runs/37913185656) succeeded.

Each embed owns its app, input, egui context, textures, renderer resources and state buffers. Only wasm initialization and the WebGPU instance/adapter/device/queue are shared. Startup is serialized to prevent first-device races. Glyph texture/format caches now belong to egui contexts. Element `readStateVector()` is explicitly requested test-only GPU readback, never production rendering. Existing global diagnostics are for single-runner tests only.

## Live measurements

Three cold/warm pairs each, hardware Chromium 152.0.7977.82, AMD RDNA-3; flags `--enable-unsafe-webgpu --enable-features=Vulkan --use-angle=vulkan`. One shared browser process; fresh context per pair, normal reload for warm. Viewport 1280×900, so later embeds are below the fold. Raw checkpointed results: `/tmp/qtw-multi-live.json`.

| Embeds | All ready cold ms | All ready warm ms | JS heap cold/warm MiB | Wasm memory MiB | Idle/drag rAF median ms |
| --- | ---: | ---: | --- | ---: | --- |
| 1 | 592.4 | 95.8 | 2.76 / 4.99 | 9.31 | 16.7 / 16.7 |
| 3 | 537.3 | 79.9 | 3.23 / 4.26 | 11.63 | 16.7 / 16.7 |
| 7 | 540.8 | 81.0 | 2.59 / 3.32 | 16.19 | 16.7 / 16.7 |

| Embeds | Per-embed cold ready medians ms | Per-embed warm ready medians ms |
| --- | --- | --- |
| 1 | 592.4 | 95.8 |
| 3 | 536.7, 537.2, 537.3 | 79.3, 79.9, 79.9 |
| 7 | 540.8, 538.6, 540.0, 539.5, 538.1, 539.0, 540.8 | 79.2, 79.6, 80.0, 80.3, 80.7, 81.0, 81.0 |

rAF intervals sampled for two seconds idle and two seconds of pointer dragging on the first canvas; p95 medians were 16.7-16.8 ms. These are browser cadence proxies, not exclusive GPU frame durations. JS heap is CDP `Performance.getMetrics` at readiness; wasm is linear-memory capacity sampled separately. GC/reload effects make JS heap noisy and non-monotonic. Neither measures process RSS, native allocations or GPU memory. GPU memory was not obtainable; `measureUserAgentSpecificMemory` requires isolation unavailable on this Pages origin. Network/driver caching explains why these small samples do not show monotonic startup cost.

All 18 live loads had **one wasm resource, one streaming instantiation and one GPUDevice**, zero console/page errors and no Table.grow failure. Pointer activity followed by replacing only the first circuit changed its GPU state while all other GPU readbacks stayed byte-for-byte unchanged. Local seven-embed testing additionally destroyed the real shared GPUDevice: one console loss diagnostic and visible reload instructions appeared in all seven affected embeds. Recovery requires reloading; no CPU/WebGL fallback or production readback was added. Binaryen 123 remains pinned.

Reproduce: `node scripts/measure-multi.mjs https://qniapp.github.io/qni-tutorial-webgpu/ /tmp/qtw-multi-live.json 3`. Remaining limitations: per-renderer pipelines/state buffers still scale with embed count; mobile/large-circuit and simultaneous-all-visible behavior need separate testing. Single-runner global diagnostic APIs must not be used to identify individual embeds.
