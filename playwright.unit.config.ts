import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './tests',
  testMatch: 'pinned-embed.unit.mjs',
  workers: 1,
  fullyParallel: false,
})
