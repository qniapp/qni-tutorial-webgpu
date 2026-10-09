import { chromium } from '@playwright/test'
import { writeFile } from 'node:fs/promises'

const [url, output = '/tmp/qtw-measure.json', count = '5'] = process.argv.slice(2)
if (!url || !Number.isInteger(Number(count)) || Number(count) < 1) {
  throw new Error('Usage: node scripts/measure-load.mjs URL OUTPUT [RUNS]')
}
const flags = process.env.QTW_SWIFTSHADER === '1'
  ? ['--enable-unsafe-webgpu', '--use-angle=swiftshader', '--enable-features=Vulkan']
  : ['--enable-unsafe-webgpu', '--enable-features=Vulkan', '--use-angle=vulkan']
const browser = await chromium.launch({ executablePath: '/usr/bin/chromium', headless: process.env.QTW_HEADED !== '1', args: flags })
const runs = []
try {
  for (let run = 0; run < Number(count); run++) {
    // A new context has no HTTP cache. Reload preserves the cache within the pair.
    const context = await browser.newContext()
    await context.addInitScript(() => {
      window.__qtw = { adapter: null, calls: {}, streaming: 0, firstFrame: null }
      const wrap = (proto, name, label, async = false) => {
        if (!proto?.[name]) return
        const original = proto[name]
        proto[name] = function (...args) {
          const start = performance.now()
          const record = value => {
            const end = performance.now()
            ;(window.__qtw.calls[label] ??= []).push({ start, end })
            performance.mark(`qni:${label}`, { startTime: end })
            performance.measure(`qni:${label}-duration`, { start, end })
            if (label === 'adapter' && value) {
              const i = value.info
              window.__qtw.adapter = { vendor: i.vendor, architecture: i.architecture, device: i.device, description: i.description, isFallbackAdapter: value.isFallbackAdapter }
            }
            if (label === 'submit' && window.__qtw.firstFrame === null) {
              // Presentation proxy: first submit followed by two animation frames.
              window.__qtw.firstFrame = -1
              requestAnimationFrame(() => requestAnimationFrame(() => {
                window.__qtw.firstFrame = performance.now()
                performance.mark('qni:first-frame')
              }))
            }
            return value
          }
          const result = original.apply(this, args)
          return async ? result.then(record) : record(result)
        }
      }
      wrap(globalThis.GPU?.prototype, 'requestAdapter', 'adapter', true)
      wrap(globalThis.GPUAdapter?.prototype, 'requestDevice', 'device', true)
      for (const name of ['createShaderModule', 'createComputePipeline', 'createRenderPipeline']) wrap(globalThis.GPUDevice?.prototype, name, 'pipeline')
      for (const name of ['createComputePipelineAsync', 'createRenderPipelineAsync']) wrap(globalThis.GPUDevice?.prototype, name, 'pipeline', true)
      wrap(globalThis.GPUQueue?.prototype, 'submit', 'submit')
      const original = WebAssembly.instantiateStreaming
      WebAssembly.instantiateStreaming = function (...args) {
        window.__qtw.streaming++
        performance.mark('qni:compile-start')
        return original.apply(this, args).then(result => {
          performance.mark('qni:compile-end')
          return result
        })
      }
      new MutationObserver(() => {
        if (!performance.getEntriesByName('qni:ready').length && document.querySelector('qni-webgpu-circuit[data-state="running"]')) performance.mark('qni:ready')
      }).observe(document, { subtree: true, attributes: true, childList: true })
    })
    const page = await context.newPage()
    await page.bringToFront()
    for (const cache of ['cold', 'warm']) {
      if (cache === 'cold') await page.goto(url)
      else await page.reload()
      await page.waitForSelector('qni-webgpu-circuit[data-state="running"]', { timeout: 120000 })
      await page.waitForFunction(() => window.__qtw.firstFrame > 0, { timeout: 120000 })
      const result = await page.evaluate(() => {
        const mark = name => performance.getEntriesByName(name).at(-1)?.startTime ?? null
        const resources = performance.getEntriesByType('resource').filter(r => r.name.endsWith('.wasm'))
        const r = resources[0]
        const calls = window.__qtw.calls
        const sum = key => calls[key]?.reduce((n, c) => n + c.end - c.start, 0) ?? null
        const pipelines = calls.pipeline
        if (pipelines?.length) performance.mark('qni:pipelines-ready', { startTime: pipelines.at(-1).end })
        return {
          adapter: window.__qtw.adapter, streaming: window.__qtw.streaming,
          gpuCalls: { adapter: calls.adapter ?? [], device: calls.device ?? [] },
          wasmRequests: resources.length,
          wasm: r ? { duration: r.responseEnd - r.requestStart, transferSize: r.transferSize, encodedBodySize: r.encodedBodySize, decodedBodySize: r.decodedBodySize } : null,
          phases: {
            download: r ? r.responseEnd - r.requestStart : null,
            compileInstantiate: mark('qni:compile-end') === null ? null : mark('qni:compile-end') - mark('qni:compile-start'),
            postDownloadInit: mark('qni:wasm-instantiated') === null || !r ? null : mark('qni:wasm-instantiated') - r.responseEnd,
            adapterDevice: calls.adapter?.length ? calls.adapter.at(-1).end - calls.adapter.at(-1).start + (sum('device') ?? 0) : null,
            shaderPipelineCalls: sum('pipeline'),
            shaderPipelineSpan: pipelines?.length ? pipelines.at(-1).end - pipelines[0].start : null,
            firstFrame: window.__qtw.firstFrame, ready: mark('qni:ready'),
          }, marks: performance.getEntriesByType('mark').map(m => ({ name: m.name, startTime: m.startTime })),
        }
      })
      runs.push({ run, cache, ...result })
      console.log(cache, run, JSON.stringify(result.phases), JSON.stringify(result.adapter))
      if (process.env.QTW_SCREENSHOT && run === 0 && cache === 'cold') await page.screenshot({ path: process.env.QTW_SCREENSHOT, fullPage: true })
    }
    await context.close()
  }
} finally {
  await browser.close()
}
const median = values => {
  const sorted = values.filter(v => v !== null).sort((a, b) => a - b)
  if (!sorted.length) return null
  return (sorted[Math.floor((sorted.length - 1) / 2)] + sorted[Math.floor(sorted.length / 2)]) / 2
}
const medians = Object.fromEntries(['cold', 'warm'].map(cache => [cache, Object.fromEntries(Object.keys(runs[0].phases).map(key => [key, median(runs.filter(r => r.cache === cache).map(r => r.phases[key]))]))]))
await writeFile(output, JSON.stringify({ url, flags, headless: process.env.QTW_HEADED !== '1', runs, medians, notes: ['compileInstantiate includes download overlap with streaming, not exclusive CPU compile time', 'firstFrame is first GPU queue submit + two animation frames, not a hardware presentation timestamp', 'pipeline timings are JS API call durations; deferred driver compilation may occur during submit'] }, null, 2))
console.log(JSON.stringify(medians, null, 2))
