import { defineConfig } from 'astro/config'

export default defineConfig({
  site: 'https://qniapp.github.io',
  base: '/qni-tutorial-webgpu',
  output: 'static',
  trailingSlash: 'always',
})
