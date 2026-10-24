# Introduction migration build (phase 1 of qniapp/qni #637)

`QNI_TUTORIAL_MIGRATION=1` opts into `/qni/` assets and navigation. Without it, the experimental `/qni-tutorial-webgpu/` site and upstream default-on per-page prebuilt embeds are unchanged. Only introduction is intended for integration; do not copy the entire Astro output over the old site.

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
QNI_TUTORIAL_MIGRATION=1 QNI_EMBED_PREBUILT=0 QNI_H_GATE_PREBUILT=0 pnpm run build --outDir .astro/migration-dist
```

Use a same-filesystem output directory: Astro's asset rename fails with EXDEV when `/tmp` is a different filesystem. `QNI_EMBED_PREBUILT=0` selects the bundled runtime globally; `QNI_H_GATE_PREBUILT=0` also preserves the explicit H-page override used before reconciliation. Upstream #36 enables prebuilt introduction and other pages by default, so disabling only H no longer avoids the release fetch. Per-page overrides remain supported and unmodified. The ordinary build still fetches and verifies the default release through `gh`.

Pins: bundled source `4f4a7f597791868149e9bc3fd8740699190bd54a` (`qni-webgpu.ref`); default per-page release `33366e270556c69201da901612cb522b4e18e2ee` (`qni-embed.ref`). Dependencies are locked by `pnpm-lock.yaml`: Astro 7.3.8, Playwright 1.63.0, TypeScript 6.0.3, MathJax 3.2.2. Local evidence used Node 26.12.0, pnpm 9.15.9, Rust 1.94.1 and Trunk 0.21.14; upstream's toolchain selects `stable`, not an exact Rust version.

## Parent integration handoff

Output is `.astro/migration-dist/index.html` and its referenced assets. The introduction requires `_astro/`, `qni-webgpu/` (including dynamic `qni-embed-error.mjs`, JS and WASM), `favicon.svg`, and its referenced `images/`. Generate assets with the script, never reuse stale local public output. Phase 2 must collect the actual dependency closure, detect collisions, and preserve all legacy files except index. Other generated Astro page directories must not be published in this migration.

Both `/qni/` and `/qni/index.html` serve this index. Home points to `/qni/`, Next to `/qni/qpu.html`. All 67 legacy non-root TOC links were checked against read-only `qni/apps/tutorial/_data/navigation.yml` and the corresponding source files at old checkout HEAD `88fa11396e91b13a6545332600a7131a6c2ec491`. The seven new-only entries use existing inert `toc-unported` spans and the `未移植` badge in both sidebar copies. No old tutorial files are copied here.

## Evidence and limitations

- Initial build-output assertion failed on the missing `/qni/qpu.html` link before implementation, then passed.
- `pnpm run test:migration` passed: produced HTML asset URLs/files, legacy Next and home URLs, seven inert entries, desktop 1280px and mobile 390px entry points, no horizontal overflow, browser Next destination and history Back, and ordinary experimental-site URLs/new-only links. That ordinary-site assertion explicitly disables prebuilt embeds, so it tests navigation isolation, not the default-on release policy. The separate normal build and full upstream suite cover default-on prebuilt behavior.
- This standalone browser test intentionally observes a 404 at the legacy destination. It does not fabricate an old page. Actual old `qpu.html` and its backlink require the phase 2 composed preview. Its screenshot checks are static, not GPU validation.
- Screenshots: `test-results/migration/sidebar-1280.png` and `sidebar-390.png` after the targeted test. This session also retained copies in `.astro/migration-evidence/` before the full suite cleared test-results. Mobile screenshot inspected: unavailable entries remain legible and do not overflow.
- Before reconciliation, `pnpm run typecheck`, `pnpm run test:unit`, normal `pnpm run build`, and `pnpm test` passed on base `a34f38a` (638 browser tests). Real GPU evidence on the default build: adapter present, runner started, amplitudes `[1,0,0,0]`, no reported console errors, page errors or 404s. This is headless Chromium/SwiftShader, not physical mobile GPU acceptance or composed migration GPU acceptance.
- An initial full-suite invocation timed out and left its preview process, which was stopped. The next run had 636 passes and two failures because a bundled-only build was paired with default prebuilt test expectations. A normal prebuilt build followed by the final full suite passed all 638 tests; no test expectations were weakened.
- No lint script is configured. `git diff --check` passed. No publication, old checkout edits, deployment, or composed preview were performed. The existing workflow now runs migration regression checks as described below; its publication triggers are unchanged.

## CI regression gate

The existing `build` job in `.github/workflows/pages.yml` now runs `pnpm run test:migration` after the real pinned public assets are generated and Chromium is installed, after the isolated mobile acceptance results are uploaded. It uploads migration screenshots separately, then uploads the unchanged default `dist` for the upstream Playwright job. Main-push publication triggers, deploy dependencies, all upstream tests and the job's default-on `QNI_EMBED_PREBUILT=1` environment remain unchanged. The migration test explicitly overrides that environment for its temporary bundled builds and does not need a release-fetch token.

After this CI follow-up, these checks exited 0: typecheck; default build with `QNI_EMBED_PREBUILT=1`; focused migration regression with the same parent environment; unit tests; `actionlint .github/workflows/pages.yml`; and seven default footer/navigation/real-GPU browser tests. File-list and SHA-256 manifests of every `dist` file were identical before and after the migration regression. Parsed workflow checks confirmed prerequisite ordering, retained upstream build steps, and unchanged triggers/deploy job. Remote Actions execution has not been performed. The full 680-test run below was before this small CI/flag-expression follow-up, not a newly repeated full run.

## Baseline reconciliation

The worker was explicitly fast-forwarded from `1b54f90ae56a1ceecaeb7158ec94ad3c33b0c13c` to `a34f38ab00d58c0a9079f1618a13d92eb944825c` before implementation, adding upstream #30 (pinned embed fetcher and H-gate switch). Local main was not changed. The original 638-test result applies to that base.

The first final remote check found main advanced to `e8c59d5e63e702b92bc64f98bf5f3ed3c6f6371d`, merging #36 / `53181c9` (per-page embed switches and T2 acceptance). Implementation commit `b5da2078f09117fff69457a50c13aabfc90d63b7` was preserved and the worker initially reported blocked.

The supervisor then explicitly instructed merging that observed upstream commit on the worker branch, not rebasing/resetting. Config auto-merged; package/layout conflicts were resolved by retaining upstream embed selection/imports and unit coverage alongside the migration navigation helper and test command. No product policy changed. Focused migration checks now explicitly disable all prebuilt pages via upstream's global switch; ordinary builds retain the upstream default policy.

Post-reconciliation commands all exited 0:

- `pnpm run typecheck`
- `pnpm run test:migration` (build-output and static browser checks described above)
- `pnpm run test:unit` (Node URL/policy tests and 46 pinned-embed Playwright tests)
- `pnpm run build` (normal default-on release-backed build)
- `pnpm test`: **680 passed**, including upstream T2 runtime, measurement/selected-step, multi-circuit and real GPU coverage. This supersedes the earlier 638 count for the merged result.

The generated migration output and screenshots were refreshed after reconciliation. A screenshot-copy attempt immediately after unit tests found that Playwright had cleared test-results; rerunning the focused migration test refreshed the evidence. No test failure was hidden by that copy operation. Final remote main remained `e8c59d5` and is an ancestor of the merged worker result. Local main and siblings remain untouched. No push, deployment or landing occurred. This is phase 1 only, not completion of #637.
