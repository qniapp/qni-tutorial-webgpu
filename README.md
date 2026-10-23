# Qni Tutorial WebGPU

An Astro static-site experiment replacing old Qni Tutorial components with Qni WebGPU. The first migrated page is the Japanese H-gate tutorial. No iframes, WebGL fallback, or circuit saving.

Published URL: https://qniapp.github.io/qni-tutorial-webgpu/

「Qni で開く」 links target `https://qniapp.github.io/qni-webgpu/#` + `encodeURIComponent(circuitJson)` on the live qni-webgpu Pages build. They open the current committed circuit in the browser-local app. See [the URL contract](docs/open-in-qni-webgpu.md). The tutorial's `/app/` build is retained for tests and diagnostics.

## Local development

Use Node.js 22.12+ and pnpm 9.15.9. Building the embed also requires Rust/rustup, Trunk 0.21.14, and GNU coreutils (`env -C`, `realpath`). Use a clean qni-webgpu checkout at the commit in `qni-webgpu.ref`; the script verifies it and does not switch or fetch that checkout.

```sh
pnpm -C /path/to/qni-tutorial-webgpu install --frozen-lockfile
bash /path/to/qni-tutorial-webgpu/scripts/fetch-qni-webgpu.sh /path/to/qni-webgpu-checkout
pnpm -C /path/to/qni-tutorial-webgpu run build
pnpm -C /path/to/qni-tutorial-webgpu run preview --host 127.0.0.1 --port 4322 --ignore-lock
```

Open `http://127.0.0.1:4322/qni-tutorial-webgpu/h_gate/`. For development, use `pnpm -C /path/to/qni-tutorial-webgpu run dev --ignore-lock` instead of preview. The `--ignore-lock` flag keeps Astro in the foreground in agent environments. Stop foreground servers with Ctrl-C.

```sh
pnpm -C /path/to/qni-tutorial-webgpu run typecheck
pnpm -C /path/to/qni-tutorial-webgpu exec playwright install chromium
pnpm -C /path/to/qni-tutorial-webgpu test
```

Stop any manual server on port 4322 before testing. Playwright starts and stops its own preview server. Tests cover element lifecycle with mocks and the real pinned WebGPU bundle. The real GPU test explicitly skips if no adapter is available; Linux may require `xvfb-run -a`. Test launch flags use SwiftShader WebGPU, not a production CPU fallback.

## Isolated pinned-embed mobile acceptance

After building the real `public/qni-webgpu/` assets as above, keep the clean pinned upstream checkout at `.qni-webgpu-source/` (or set `QNI_WEBGPU_SOURCE`):

```sh
pnpm exec playwright install --with-deps chromium
node scripts/test-pinned-embed-mobile.mjs
```

The runner fetches the actual release selected by `qni-embed.ref` and verifies all GitHub attestations during an isolated Astro build. Install `gh` and authenticate it with `GH_TOKEN` for the build. No fixture verifier or relabeled bundled runtime is used. Preview sets `QNI_H_GATE_PREBUILT=0` only to avoid fetching again: it serves the already-built release-backed page, not a rebuilt bundled page. Temporary output is cleaned even on failure; the verified public cache is retained and reverified on each build.

`playwright.pinned-embed-mobile.config.ts` inherits the ordinary bundled Chromium/SwiftShader launch flags but uses one worker and a 390px touch/mobile viewport. Its only test requires artifact runtime requests, a running real circuit, finite `readStateVector()` GPU output, viewport-fitting circuit bounds, and no document horizontal overflow. Missing WebGPU fails this acceptance gate rather than skipping. It does not dismiss or swipe through the tutorial. This checks mobile emulation with software WebGPU, not physical phone GPU compatibility.

The ordinary Playwright config excludes this dedicated test. CI runs the runner in the **build** job after the normal Astro build/upload, with a separate temporary output. Both builds use the real release for `h_gate`; all other pages keep the bundled runtime.

## Pin and deployment

The `h_gate` release pilot is on by default; set `QNI_H_GATE_PREBUILT=0` for a bundled-only build. See [verification policy](docs/pinned-embed-pilot.md).

`qni-webgpu.ref` pins the bundled Rust/Trunk source checkout. The release fetcher uses the separate `qni-embed.ref`, currently `33366e270556c69201da901612cb522b4e18e2ee`. To update the bundle pin, prepare a clean checkout at its SHA, rebuild the bundle, and rerun the build/typecheck/browser tests. Do not commit `public/qni-webgpu/` or `dist/`.

The Pages workflow checks out that SHA, uses upstream `rust-toolchain.toml`, installs the wasm32 target, restores the Cargo cache, and downloads a cached, checksum-verified Trunk binary and caches Trunk's helper tools. It builds the embed into `public/qni-webgpu/`, then uses the official `withastro/action` to build/upload the site and `actions/deploy-pages` to deploy. Set repository Pages source to **GitHub Actions**. The workflow itself has not yet run remotely.

All internal links and assets use Astro's `BASE_URL`. `qni-webgpu-circuit` creates a shadow-DOM canvas and destroys its runner on disconnect. Circuit pages preload the modules/wasm and start streaming compilation and an adapter warm-up in the head; element connection reuses that initialization. Japanese loading progress shows percentages only for known uncompressed totals, otherwise downloaded MB and initialization stages. Attributes: `circuit` (JSON), `width`/`height` (pixels), and `show-state-panel="false"`. Height is automatic by default: a circuit-based estimate is used before startup, then the runner's `preferredHeight(canvasCssWidth)` is queried on width changes and every 250ms while running to follow edits. The host adds 48px for its border and attached link. `height` remains an explicit pixel override; CSS can size the host or use `--qni-webgpu-circuit-width` and `--qni-webgpu-circuit-height` when the corresponding attributes are absent. The qni_intro and h_gate pages use automatic height; the multi-embed stress route retains its explicit height.

## Load measurement

Run from the repo root:

```sh
node scripts/measure-load.mjs https://qniapp.github.io/qni-tutorial-webgpu/h_gate/ qtw-live.json 5
```

The same command accepts a local preview URL. Each run uses a fresh browser context for cold load and a reload for warm load. Defaults use system `/usr/bin/chromium` with hardware Vulkan WebGPU; `QTW_HEADED=1` enables headed mode and `QTW_SWIFTSHADER=1` explicitly selects SwiftShader when hardware is unavailable. Use the same flags before and after. JSON includes Resource Timing sizes, startup phases, adapter info, and medians. First-frame timing is a submit/animation-frame proxy, not an exact display timestamp. See [the measurements and build comparisons](docs/load-performance.md) for results, caveats, and check outcomes.

## Migration scope

The Japanese prose, section order, Bloch rotation image/credit, and review questions are retained. These old features are not reproduced yet:

- `qubit_circle`, animated transition arrows, and decorative `<h-gate>` icons: static formulas or textual amplitude values replace them.
- The H/X-only palette, one-wire/five-step constraints, and old inspector: the current unrestricted WebGPU editor replaces them.
- Links to unmigrated X/PHASE pages: plain-text navigation replaces them.

Review questions use the original Orbit embed: each page keeps the unchanged `<orbit-reviewarea>`/`<orbit-prompt>` markup and loads `https://js.withorbit.com/orbit-web-component.js`, which renders the prompts inside a withorbit.com iframe. Attachment URLs must therefore be absolute (`basic_quantum_circuit.png` is served from this site's `public/images/` as `https://qniapp.github.io/qni-tutorial-webgpu/images/basic_quantum_circuit.png`). Orbit displays the images inside its iframe, so they cannot be given alt text; the alt mechanism added in #6/#7 has been removed. [The self-graded quiz spec](docs/quiz-spec.md) is kept for reference but is not used on this site. New or edited prompts must follow [the Orbit prompt-writing rules](docs/orbit-prompts.md).

Margin notes use `src/components/Sidenote.astro`, ported from the original tutorial's CSS and Liquid tags. Supply a page-unique `id` and use `numbered` for automatic superscript numbering. Place the component inside a prose paragraph, or inside a figure before its image for an image credit, as in the original tutorial. Notes appear in the right margin from 640px; below that width, tap the blue-backed number or ellipsis to open/close the note. This works without JavaScript. The reserved margin starts at 640px rather than the original 768px to avoid overflow between those breakpoints. `tests/sidenote.spec.ts` covers placement, typography, breakpoint behavior, and toggling.

Multiple simultaneous embeds, shared GPUDevice, device-loss recovery, and per-instance caches remain upstream follow-ups. This scaffold contains only one embed. Target browser/device testing is still required.

Tutorial prose and the image were copied from `qni/apps/tutorial/h_gate.html`; the original MIT notice is in `LICENSE.qni`. The image retains its original Physics Stack Exchange credit. `docs/modernization-proposal.ja.md` is a proposal, not a plan already implemented.
