import { chromium, defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './tests',
  workers: 1,
  timeout: 60_000,
  use: {
    baseURL: 'http://127.0.0.1:4322',
    viewport: { width: 1280, height: 900 },
    headless: true,
    launchOptions: {
      executablePath: chromium.executablePath(),
      args: [
        '--enable-features=WebGPU,WebGPUDeveloperFeatures,WebGPUService,Vulkan',
        '--enable-unsafe-webgpu',
        '--enable-dawn-features=allow_unsafe_apis,enable_immediate_error_handling',
        '--ignore-gpu-blocklist',
        '--disable-gpu-sandbox',
        '--no-sandbox',
        '--use-gl=angle',
        '--use-angle=swiftshader',
        '--use-vulkan=swiftshader',
      ],
    },
  },
  webServer: {
    command: 'pnpm run preview --host 127.0.0.1 --port 4322 --ignore-lock',
    url: 'http://127.0.0.1:4322/qni-tutorial-webgpu/',
    reuseExistingServer: false,
  },
})
