import { defineConfig } from '@playwright/test'
import desktop from './playwright.config'

const outDir = process.env.QNI_MOBILE_OUT_DIR ?? 'dist-pinned-embed'

// Keep the bundled Chromium + SwiftShader flags identical to the desktop suite.
export default defineConfig(desktop, {
  testMatch: 'pinned-embed-mobile.spec.ts',
  testIgnore: [],
  workers: 1,
  outputDir: 'test-results/pinned-embed-mobile',
  use: {
    ...desktop.use,
    baseURL: 'http://127.0.0.1:4323',
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    isMobile: true,
  },
  webServer: {
    command: `pnpm exec astro preview --outDir ${JSON.stringify(outDir)} --host 127.0.0.1 --port 4323 --ignore-lock`,
    url: 'http://127.0.0.1:4323/qni-tutorial-webgpu/h_gate/',
    reuseExistingServer: false,
  },
})
