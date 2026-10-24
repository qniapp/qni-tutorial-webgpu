# Introduction migration build (phase 1 of qniapp/qni #637)

`QNI_TUTORIAL_MIGRATION=1` opts into `/qni/` assets and navigation. Without it, the experimental `/qni-tutorial-webgpu/` site and default-on prebuilt H-gate pilot are unchanged. Only introduction is intended for integration; do not copy the entire Astro output over the old site.

## Reproduce

From this checkout, using Node 22.12+ and pnpm 9.15.9:

```sh
pnpm install --frozen-lockfile
git clone https://github.com/qniapp/qni-webgpu.git .qni-webgpu-source
git -C .qni-webgpu-source checkout "$(tr -d '\n' < qni-webgpu.ref)"
bash scripts/fetch-qni-webgpu.sh .qni-webgpu-source
pnpm run typecheck
pnpm exec playwright install chromium
pnpm run test:migration
pnpm run test:unit
pnpm run build
pnpm test
mkdir -p .astro/migration-dist
QNI_TUTORIAL_MIGRATION=1 QNI_H_GATE_PREBUILT=0 pnpm run build --outDir .astro/migration-dist
```

Use a same-filesystem output directory: Astro's asset rename fails with EXDEV when `/tmp` is a different filesystem. `QNI_H_GATE_PREBUILT=0` avoids the unrelated H-page release fetch for migration builds. The ordinary build still fetches and verifies the default release through `gh`.

Pins: bundled source `4f4a7f597791868149e9bc3fd8740699190bd54a` (`qni-webgpu.ref`); default H-page release `33366e270556c69201da901612cb522b4e18e2ee` (`qni-embed.ref`). Dependencies are locked by `pnpm-lock.yaml`: Astro 7.3.8, Playwright 1.63.0, TypeScript 6.0.3, MathJax 3.2.2. Local evidence used Node 26.12.0, pnpm 9.15.9, Rust 1.94.1 and Trunk 0.21.14; upstream's toolchain selects `stable`, not an exact Rust version.

## Parent integration handoff

Output is `.astro/migration-dist/index.html` and its referenced assets. The introduction requires `_astro/`, `qni-webgpu/` (including dynamic `qni-embed-error.mjs`, JS and WASM), `favicon.svg`, and its referenced `images/`. Generate assets with the script, never reuse stale local public output. Phase 2 must collect the actual dependency closure, detect collisions, and preserve all legacy files except index. Other generated Astro page directories must not be published in this migration.

Both `/qni/` and `/qni/index.html` serve this index. Home points to `/qni/`, Next to `/qni/qpu.html`. All 67 legacy non-root TOC links were checked against read-only `qni/apps/tutorial/_data/navigation.yml` and the corresponding source files at old checkout HEAD `88fa11396e91b13a6545332600a7131a6c2ec491`. The seven new-only entries use existing inert `toc-unported` spans and the `未移植` badge in both sidebar copies. No old tutorial files are copied here.

## Evidence and limitations

- Initial build-output assertion failed on the missing `/qni/qpu.html` link before implementation, then passed.
- `pnpm run test:migration` passed: produced HTML asset URLs/files, legacy Next and home URLs, seven inert entries, desktop 1280px and mobile 390px entry points, no horizontal overflow, browser Next destination and history Back, and default-build URLs/new-only links.
- This standalone browser test intentionally observes a 404 at the legacy destination. It does not fabricate an old page. Actual old `qpu.html` and its backlink require the phase 2 composed preview. Its screenshot checks are static, not GPU validation.
- Screenshots: `test-results/migration/sidebar-1280.png` and `sidebar-390.png` after the targeted test. This session also retained copies in `.astro/migration-evidence/` before the full suite cleared test-results. Mobile screenshot inspected: unavailable entries remain legible and do not overflow.
- `pnpm run typecheck`, `pnpm run test:unit`, normal `pnpm run build`, and final `pnpm test` passed (638 browser tests). Real GPU evidence on the default build: adapter present, runner started, amplitudes `[1,0,0,0]`, no reported console errors, page errors or 404s. This is headless Chromium/SwiftShader, not physical mobile GPU acceptance or composed migration GPU acceptance.
- An initial full-suite invocation timed out and left its preview process, which was stopped. The next run had 636 passes and two failures because a bundled-only build was paired with default prebuilt test expectations. A normal prebuilt build followed by the final full suite passed all 638 tests; no test expectations were weakened.
- No lint script is configured. `git diff --check` passed. No publication or workflow changes, old checkout edits, deployment, or composed preview were performed.

## Baseline blocker

The worker was explicitly fast-forwarded from `1b54f90ae56a1ceecaeb7158ec94ad3c33b0c13c` to `a34f38ab00d58c0a9079f1618a13d92eb944825c` before implementation, adding upstream #30 (pinned embed fetcher and H-gate switch). Local main was not changed. All above tests apply to that base.

The final remote check found main advanced to `e8c59d5e63e702b92bc64f98bf5f3ed3c6f6371d`, merging #36 / `53181c9` (per-page embed switches and T2 acceptance). It overlaps config, layout and package files. No merge/rebase or main reconciliation was attempted. Reconciliation and retesting against that new baseline need direction before this branch can be declared ready. This is not completion of #637.
