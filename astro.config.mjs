import { defineConfig } from 'astro/config'
import { readFileSync } from 'node:fs'
import { TutorialEmbed } from './scripts/tutorial-embed.mjs'

// Preview uses the same immutable directory without fetching again.
const embedDirectory = await TutorialEmbed.directory()

export default defineConfig({
  site: 'https://qniapp.github.io',
  base: '/qni-tutorial-webgpu',
  output: 'static',
  trailingSlash: 'always',
  vite: {
    plugins: [{
      name: 'tutorial-embed',
      resolveId(id) { if (id === 'virtual:tutorial-embed') return '\0virtual:tutorial-embed' },
      load(id) {
        if (id === '\0virtual:tutorial-embed') return `export const embedDirectory = ${JSON.stringify(embedDirectory)};`
      },
    }, {
      name: 'pinned-h-gate-icon',
      resolveId(id) { if (id === 'virtual:h-gate-icon') return '\0virtual:h-gate-icon' },
      load(id) {
        if (id !== '\0virtual:h-gate-icon') return
        const pin = readFileSync('qni-embed.ref', 'utf8').trim()
        const svg = readFileSync(`public/${embedDirectory}h.svg`, 'utf8')
          .replace('<svg ', '<svg aria-hidden="true" focusable="false" ')
        return `export const svg = ${JSON.stringify(svg)}; export const pin = ${JSON.stringify(pin)};`
      },
    }],
  },
})
