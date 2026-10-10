import { cpSync, mkdirSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, resolve } from 'node:path'

const require = createRequire(import.meta.url)
const source = dirname(require.resolve('mathjax/package.json'))
const target = resolve('public/mathjax')
mkdirSync(target, { recursive: true })
cpSync(resolve(source, 'es5'), target, { recursive: true })
cpSync(resolve(source, 'LICENSE'), resolve(target, 'LICENSE'))
