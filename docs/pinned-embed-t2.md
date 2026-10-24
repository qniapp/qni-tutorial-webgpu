# T2 local acceptance

Pin: `33366e270556c69201da901612cb522b4e18e2ee`.
Baseline: `a34f38ab00d58c0a9079f1618a13d92eb944825c` (T1).

All builds, Playwright runs and screenshot browsers were run serially.
Chromium uses SwiftShader WebGPU; this is not physical-phone certification.
The new GPU acceptance tests fail, rather than skip, without an adapter.

## Results

- Dependency installation and TypeScript check: passed.
- Default Astro build and isolated mobile build: passed; real GitHub
  attestations verified for all ten release files on each build.
- Unit tests: 34 Node tests and 46 release-verification tests passed.
- Existing circuit, selected-step/edit, restart, QFT, BB84 and real-GPU
  regression tests: 75 passed, zero skipped.
- Existing automatic-height tests: 141 passed.
- T2 acceptance: 42 passed. All 29 routes request exactly one of each runtime
  asset from the same release directory, including `qni-embed-error.mjs`.
  Every embed supplies finite normalized per-runner GPU readback. All eleven
  QFT runners are individually selected and edited, with the other ten
  vectors/JSON/selections compared after each change. Multi-7 checks seven
  signed final vectors. Seven selected-step pages retain their authored
  selection and signed amplitudes. Measurement checks real pointer edits,
  pointer/Enter/Space restart, deterministic zero/one samples, and both fair
  sampled outcomes across restarts. No global GPU readback is used.
- Mobile acceptance: 4 passed at 390px, with real GPU computation, no document
  overflow, horizontal swipe revealing later columns, touch gate drag verified
  by exported JSON, native vertical article scrolling and subsequent tapping.
- Baseline vs T2 build: `diff -u` returned no differences for
  `phase_gate/index.html`, `x_gate/index.html`, and `multi-1/index.html`;
  `diff -qr` returned no differences for the entire `_astro` asset directory.

## Fallback comparison and known legacy limitation

A separate mixed build explicitly switched `h_gate`, `measurement_operation`,
`multi-7` and `inside_the_qft` off (using `0`, `off` and `false`), leaving other
T2 pages prebuilt. Ten targeted checks passed: exact bundled runtime requests,
QFT runner independence, all seven multi runners, edited deterministic samples,
and pointer/keyboard restart. The additional fair-sampling-across-restarts
check **failed** on the old measurement bundle: all 32 shots returned zero.
The assertion is retained, not loosened or skipped.

This is an existing difference between the independent pins: the release
includes upstream `fe2bf57d8732b89733f88522af37ce5864dc4188` (resampling when
embeds restart), while the old source pin `4f4a7f5` does not. The release-backed
42-test run, including this check, passes. T2 deliberately does not repin or
rewrite the compiled runtime to hide that legacy behavior. An exploratory
mixed-runtime run also had one transient readback timeout on
`cascading_teleportation`; the release-backed acceptance passed on that route.

Rust/Trunk, the source checkout, standalone app, compiled runtime and all
switches remain. Remaining-page migration and retirement of those paths belong
to T3; see the [selection policy and scope](pinned-embed-pilot.md).
