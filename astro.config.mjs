import { defineConfig } from 'astro/config'
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { TutorialEmbed } from './scripts/tutorial-embed.mjs'

// Preview serves the choice baked into the completed build without fetching.
const embedDirectories = await TutorialEmbed.directories()
const migration = process.env.QNI_TUTORIAL_MIGRATION === '1'

export default defineConfig({
  site: 'https://qniapp.github.io',
  base: migration ? '/qni' : '/qni-tutorial-webgpu',
  output: 'static',
  trailingSlash: 'always',
  vite: {
    define: {
      'import.meta.env.PUBLIC_QNI_TUTORIAL_MIGRATION': JSON.stringify(migration),
    },
    plugins: [{
      name: 'tutorial-embed',
      resolveId(id) { if (id === 'virtual:tutorial-embed') return '\0virtual:tutorial-embed' },
      load(id) {
        if (id === '\0virtual:tutorial-embed') return `export const embedDirectories = ${JSON.stringify(embedDirectories)};`
      },
    }, {
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
