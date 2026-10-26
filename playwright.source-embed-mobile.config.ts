import { defineConfig } from '@playwright/test'
import mobile from './playwright.pinned-embed-mobile.config'

const port = Number(process.env.QNI_TEST_PORT ?? 4334)

// Exercise the same touch contract against freshly compiled source, not a release.
export default defineConfig({
  ...mobile,
  metadata: { sourceEmbed: true },
  outputDir: 'test-results/source-embed-mobile',
  use: { ...mobile.use, baseURL: `http://127.0.0.1:${port}` },
  webServer: {
    command: `pnpm exec astro preview --host 127.0.0.1 --port ${port} --ignore-lock`,
    url: `http://127.0.0.1:${port}/qni-tutorial-webgpu/h_gate/`,
    reuseExistingServer: false,
    env: { QNI_EMBED_PREBUILT: '0' },
  },
})
