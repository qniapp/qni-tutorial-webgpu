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
      name: 'pinned-qni-design-assets',
      resolveId(id) {
        if (['virtual:h-gate-icon', 'virtual:qni-measurement-design'].includes(id)) return '\0' + id
      },
      load(id) {
        if (!['\0virtual:h-gate-icon', '\0virtual:qni-measurement-design'].includes(id)) return
        const pin = readFileSync(resolve('qni-webgpu.ref'), 'utf8').trim()
        if (!/^[a-f0-9]{40}$/.test(pin)) throw new Error('Invalid qni-webgpu.ref')
        const source = process.env.QNI_WEBGPU_SOURCE ?? resolve('.qni-webgpu-source')
        if (id === '\0virtual:qni-measurement-design') {
          const files = ['design-system.css', ...['circuit-dropzone', 'h-gate', 's-dagger-gate', 'measurement-gate'].map(name => `components/${name}.js`)]
          const sources = Object.fromEntries(files.map(file => [file, execFileSync('git', ['-C', source, 'show', `${pin}:docs/design-system/${file}`], { encoding: 'utf8' })]))
          return `export const sources = ${JSON.stringify(sources)}; export const pin = ${JSON.stringify(pin)};`
        }
        const svg = execFileSync('git', ['-C', source, 'show', `${pin}:apps/web/assets/icons/h.svg`], { encoding: 'utf8' })
          .replace('<svg ', '<svg aria-hidden="true" focusable="false" ')
        return `export const svg = ${JSON.stringify(svg)}; export const pin = ${JSON.stringify(pin)};`
      },
    }],
  },
})
