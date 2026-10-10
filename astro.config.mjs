import { defineConfig } from 'astro/config'
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

export default defineConfig({
  site: 'https://qniapp.github.io',
  base: '/qni-tutorial-webgpu',
  output: 'static',
  trailingSlash: 'always',
  vite: {
    plugins: [{
      name: 'pinned-h-gate-icon',
      resolveId(id) { if (id === 'virtual:h-gate-icon') return '\0virtual:h-gate-icon' },
      load(id) {
        if (id !== '\0virtual:h-gate-icon') return
        const pin = readFileSync(resolve('qni-webgpu.ref'), 'utf8').trim()
        if (!/^[a-f0-9]{40}$/.test(pin)) throw new Error('Invalid qni-webgpu.ref')
        const source = process.env.QNI_WEBGPU_SOURCE ?? resolve('.qni-webgpu-source')
        const svg = execFileSync('git', ['-C', source, 'show', `${pin}:apps/web/assets/icons/h.svg`], { encoding: 'utf8' })
          .replace('<svg ', '<svg aria-hidden="true" focusable="false" ')
        return `export const svg = ${JSON.stringify(svg)}; export const pin = ${JSON.stringify(pin)};`
      },
    }],
  },
})
