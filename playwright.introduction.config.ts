import { defineConfig } from '@playwright/test'
import desktop from './playwright.config'

const port = Number(process.env.QNI_TEST_PORT ?? 4335)
const base =
  process.env.QNI_TUTORIAL_MIGRATION === '1' ? '/qni/' : '/qni-tutorial-webgpu/'

// Run the same authored-page contract against either completed Astro build.
export default defineConfig({
  ...desktop,
  testMatch: 'introduction-step.spec.ts',
  use: { ...desktop.use, baseURL: `http://127.0.0.1:${port}` },
  webServer: {
    command: `pnpm exec astro preview --host 127.0.0.1 --port ${port} --ignore-lock`,
    url: `http://127.0.0.1:${port}${base}`,
    reuseExistingServer: false,
  },
})
