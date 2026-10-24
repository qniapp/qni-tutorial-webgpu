# Sidebar CI failure: embed startup geometry

## Reproduction and cause

Hosted run `40064095335` at `17dfa8b2e073a07751739e2bbda313aca7405962` passed build/deploy but failed the experimental H-page mobile drawer test: `main` grew from 3995.921875px to 4019.921875px after the baseline measurement. Its x/y/width, drawer visibility and focus assertions passed. The uploaded artifact `12548613208` contained an error context, not a trace or screenshot. These were inspected read-only; no hosted retry was issued.

The unchanged test reproduced locally with:

```sh
pnpm exec playwright test tests/sidebar.spec.ts -g 'narrow screens' --repeat-each=20 --trace retain-on-failure
```

Result before the fix: 19 passed, one failed with the same +24px growth. The local main heights differed from CI because the host fonts differ. Its retained trace is `.astro/sidebar-diagnosis/original-failure-trace.zip`.

Ranked hypotheses were native embed startup, late MathJax/assets, and dialog CSS. Holding network delivery of the unchanged real `qni-embed.mjs` until after the baseline made the race deterministic. Child-bound measurements showed only the circuit element changing: loading height 572px, running height 596px. Main grew by the same 24px. Releasing startup without opening the drawer reproduced it too, ruling out the modal as the source. MathJax had completed and the other direct content children retained their heights.

The final public-browser regression failed all six local runs before the fix (both open/closed cases repeated three times). In the exact hosted Playwright container, it failed all four runs and reproduced the hosted values exactly: 3995.921875px to 4019.921875px. This is a startup layout defect, not a tolerance adjustment or a presumed harmless flake.

`qni-embed-height.ts` used `lastLine + 28 + blockOutset` for the circuit bottom. Both pinned native runtimes use `lastLine + max(STEP_OUTSET_Y, LINE_GAP / 2 + blockOutset)`, where `STEP_OUTSET_Y = 20 + 32 = 52` and `LINE_GAP / 2 = 28`. The estimate omitted that 52px minimum. Correcting the expression reserves the final geometry from startup instead of increasing it after `startEmbed` resolves. The runner still owns dynamic geometry after edits. No pins or native source were changed.

Source references: `apps/web/src/app/embed.rs` (`preferred_height`) and `apps/web/src/constants.rs` at bundled pin `4f4a7f597791868149e9bc3fd8740699190bd54a` and release pin `33366e270556c69201da901612cb522b4e18e2ee`.

## Regression and checks

`tests/sidebar-startup.spec.ts` gates network delivery, not runtime behavior, then asserts exact document and circuit geometry across actual GPU startup with the drawer open and closed. It also asserts focus, close behavior and geometry after dismissal. A missing adapter is explicitly skipped, not simulated; none of the recorded passing runs skipped. The original strict `tests/sidebar.spec.ts` assertion is unchanged. The existing QFT/Probability span estimates were updated from 556 to 580 to include the native 52px outset. No sleep, relaxed tolerance, mocked runner or ignored assertion was added.

Checks after the fix, all exit 0:

- `pnpm run typecheck`
- Normal `pnpm run build`, with default-on attested prebuilt embeds
- `pnpm exec playwright test tests/sidebar-startup.spec.ts tests/sidebar.spec.ts --repeat-each=10`: 90 passed locally
- Same 90 checks in `mcr.microsoft.com/playwright:v1.63.0-noble`: 90 passed
- Bundled-only build (`QNI_EMBED_PREBUILT=0 QNI_H_GATE_PREBUILT=0`), then the startup regression and existing startup-estimate checks repeated five times: 25 passed
- `pnpm run test:migration`: passed, retaining migration/default navigation and header/icon checks
- `pnpm run test:unit`: passed
- Restored normal prebuilt build, then the entire suite in the CI container: **682 passed**, including real GPU coverage; adapter present, runner started, readback `[1,0,0,0]`, no reported console/page errors or 404s in the real H-page test
- `actionlint .github/workflows/pages.yml` and `git diff --check`: passed

Container image digest: `sha256:eff16c30e6f3f4af0a03fa4b706120d5e9b0891c344a27d64559aff5900a4a27`. It supplied Node 24.20.0 and Playwright's bundled browsers. Invocation from the worker checkout used the same production `dist`, one worker and the unchanged Chromium/SwiftShader flags in `playwright.config.ts`:

```sh
docker run --rm --user "$(id -u):$(id -g)" --network host --ipc host \
  -e QNI_TEST_PORT=4337 -e COREPACK_HOME=/tmp/corepack \
  -v "$PWD:/work" -w /work mcr.microsoft.com/playwright:v1.63.0-noble \
  bash -lc 'mkdir -p /tmp/qni-bin; corepack enable --install-directory /tmp/qni-bin; export PATH="/tmp/qni-bin:$PATH"; pnpm exec playwright test'
```

The temporary Corepack shim is needed because the image has Corepack but no `pnpm` executable; it uses the repository's pinned pnpm version. This is CI-like local execution, not an actual GitHub Actions run or a physical GPU/device result. Source/assets were built locally from the existing pins. Logs retained in `.astro/sidebar-diagnosis/` distinguish before/after and bundled/prebuilt cases. The final real H-page screenshot was visually inspected. No old-shell/sibling edits, push, landing, deployment or hosted rerun were performed.
