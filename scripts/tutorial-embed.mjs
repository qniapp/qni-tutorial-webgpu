import { readFileSync } from 'node:fs'
import { PinnedEmbed } from './fetch-qni-embed.mjs'

/** Every tutorial uses one release directory and one module identity. */
export class TutorialEmbed {
  static async directory(preview = process.argv.includes('preview')) {
    const sha = readFileSync('qni-embed.ref', 'utf8').trim()
    if (!/^[a-f0-9]{40}$/.test(sha)) throw new Error('Pinned embed: invalid qni-embed.ref (expected full 40-character SHA)')
    if (!preview) await PinnedEmbed.fetch()
    return `qni-webgpu-prebuilt/embed-${sha}/`
  }
}
