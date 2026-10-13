// Re-record the qni_intro GIFs (public/images/qni-intro/qni_live_programming.gif,
// qni_step_execution.gif) with Qni WebGPU, frame by frame and deterministically.
//
//   node scripts/record-qni-intro-gifs.mjs [live|step ...]
//
// Env: QTW_URL (page providing <qni-webgpu-circuit>), QTW_CHROMIUM_PATH, OUT_DIR
// (default ./qni-intro-gif-out), QNI_GIF_SETTLE_MS (extra wait per frame, default 60),
// QNI_GIF_SOFTWARE=1 (dry run without a GPU: SwiftShader Vulkan flags, software
// adapter accepted; never use its output).
// Headless by default; --headed or QTW_HEADLESS=0 shows the browser.
// Each frame advances the mouse script by one step, waits for rendering, then
// screenshots the canvas. Keyframes verify circuitJSON(), selectedStep() and the
// GPU state vector; any mismatch fails the run.
import {execFileSync} from 'node:child_process'
import {mkdir, readFile, rm, writeFile} from 'node:fs/promises'
import {resolve} from 'node:path'
import {chromium} from '@playwright/test'
import {circuitJSONEqual, verify} from './gpu-audit-helper.mjs'

const url = process.env.QTW_URL ?? 'https://qniapp.github.io/qni-tutorial-webgpu/qni_intro/'
const outDir = resolve(process.env.OUT_DIR ?? 'qni-intro-gif-out')
const settleMs = Number(process.env.QNI_GIF_SETTLE_MS ?? 60)
const headless = !process.argv.includes('--headed') && process.env.QTW_HEADLESS !== '0'
const software = process.env.QNI_GIF_SOFTWARE === '1'

// Canvas CSS px → GIF px. Gates are 40px (constants.rs GATE_SIZE); this makes
// them ~26px like the old Qni gates in the original GIFs. It also makes A's canvas
// 640px tall: the embed state panel sits bottom-aligned at height - 264 (8 + 64
// bottom margin + 160 viewport + 32 header, constants.rs) and only moves 16px
// below the circuit when they would overlap (docs/web-embed.md). While dragging,
// the extra wire puts the circuit bottom at 328 + 28 = 356, so a panel top of
// 376 keeps it still.
const SCALE = 0.6625
const canvasFor = ({width, height}) => ({width: Math.round(width / SCALE), height: Math.round(height / SCALE)})

// Layout of an embed canvas wider than 656px (content >= 640, no compact gutters),
// qni-webgpu 0ef550d (qni-webgpu.ref), paths relative to apps/web/src, CSS px:
// - app/embed.rs::preferred_height: CentralPanel margin 8 → content rect at (8, 8).
// - constants.rs: LINE_LEFT_OFFSET = 64+42+16 = 122; slot 0 centre = line left
//   + GATE_SIZE (layout/geometry.rs::layout_metrics); SLOT_SPACING = LINE_GAP = 56.
// - constants.rs: LINE_Y = 80+(40*2+8)+20+48+20 = 256. layout/palette.rs::
//   circuit_shift_y: a one-row restricted palette is 40+2*20 = 80 tall instead of
//   the full 128, so the circuit moves up 48 (app.rs::circuit_origin).
// - Palette: drag_controller.rs::CircuitInputGeometry: origin = screen min +
//   (palette_start_x, PALETTE_ROW_Y = 80); palette_start_x = round(w/2 - total/2),
//   one entry → total width 40.
// - Step preview/breakpoint: drag_controller.rs::step_at_cursor accepts the band
//   wire0 - 28 .. lastWire + 28 and |x - slot centre| <= 28. A press there outside
//   any gate sets the breakpoint (drag_controller/start.rs BreakpointStep).
// - Drag snap: drag_controller/preview.rs: gate centre within SNAP_DISTANCE (40)
//   of a wire snaps to it, then to the nearest free slot or insert point
//   (layout/snap.rs, insert points at slot centre ± 28).
function geometry(canvasWidth, palette) {
  const margin = 8, gate = 40, gap = 56
  const shift = palette.length ? 128 - (gate + 2 * 20) : 128
  const content = canvasWidth - 2 * margin
  if (content < 640) throw Error(`canvas ${canvasWidth}px would use compact gutters`)
  const lineY = margin + 256 - shift
  return {
    slot: column => margin + 122 + gate + gap * column,
    wire: index => lineY + gap * index,
    palette: index => ({x: margin + Math.round(content / 2 - (palette.length * 48 - 8) / 2) + 48 * index + gate / 2,
      y: margin + 80 + gate / 2}),
  }
}

const k = Math.SQRT1_2
// Expected readback [[re, im], ...] for basis states with amplitude 1/√2 or 1.
const ket = (size, ...basis) => Array.from({length: size}, (_, i) =>
  basis.includes(i) ? [basis.length === 2 ? k : 1, 0] : [0, 0])
// Measurements may or may not collapse the readback; only |00> and |11> may remain.
const bellOutcomes = values => {
  const p = []
  for (let i = 0; i < values.length; i += 2) p.push(values[i] ** 2 + values[i + 1] ** 2)
  if (p.length !== 4 || p[1] + p[2] > 5e-5 || Math.abs(p[0] + p[3] - 1) > 5e-5) throw Error(`expected only |00>/|11>: ${p}`)
  return {probabilities: p}
}

const ease = t => t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2
// n positions from a (exclusive) to b (inclusive), eased.
const path = (a, b, n) => Array.from({length: n}, (_, i) => {
  const t = ease((i + 1) / n)
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]
})

// A: qni_live_programming.gif, 572x424, 68 frames, frame 53 is 500ms.
// Original: X comes from the palette, hovers next to q0's control, sits
// uncontrolled on q1 between H and •, snaps under • (CNOT), wiggles off and back,
// goes to a third wire (8 states) and returns to q1.
function liveProgramming() {
  const palette = ['H', 'X', 'Y', 'Z']
  const size = {width: 572, height: 424}, canvas = canvasFor(size)
  const g = geometry(canvas.width, palette)
  const X = g.slot, Y = g.wire, P = g.palette(palette.indexOf('X'))
  // 元 GIF と同じく Measure あり（ドラッグ中プレビューは測定後状態で可）。
  // The breakpoint stays at step 2, before the measurement column.
  const circuit = '{"cols":[["|0>","|0>"],["H"],["•"],["Measure","Measure"]]}'
  const cnot = '{"cols":[["|0>","|0>"],["H"],["•","X"],["Measure","Measure"]]}'
  const cnot3 = '{"cols":[["|0>","|0>"],["H"],["•",1,"X"],["Measure","Measure"]]}'
  const frames = []
  const at = (pos, extra = {}) => frames.push({pos, ...extra})
  // 0-5: from right of the breakpoint (above the step band) to the palette X.
  const start = [X(3) + 30, Y(0) - 40]
  at(start, {check: {json: circuit, step: 2, state: ket(4, 0, 1)}})
  for (const pos of path(start, [P.x, P.y], 5)) at(pos)
  // 6-9: hover the palette entry (old Qni showed its tooltip here).
  for (const d of [1, 1, 0, 0]) at([P.x + d, P.y])
  // 10-11: press, then leave the click-copy tolerance.
  at([P.x, P.y], {down: true})
  at([P.x - 4, P.y + 12])
  // 12-17: carry it above the H gate, outside every wire's snap radius (> 40).
  for (const pos of path([P.x - 4, P.y + 12], [X(1) + 2, Y(0) - 62], 6)) at(pos)
  // 18-21: hover above H, then approach q0.
  at([X(1) + 4, Y(0) - 60]); at([X(1) + 5, Y(0) - 60]); at([X(1) + 5, Y(0) - 59])
  at([X(1) + 8, Y(0) - 44])
  // 22-25: over q0 next to the control: insert point between H and • (X(2)-28).
  for (const d of [24, 22, 20, 18]) at([X(2) - d, Y(0)])
  // 26: on the way down (26px from q1, so q1 already).
  at([X(2) - 20, Y(0) + 30])
  // 27-31: uncontrolled X on q1 at the insert point (state |10>,|11>).
  for (const d of [24, 23, 22, 22, 21]) at([X(2) - d, Y(1)])
  // 32-33: snap under • (CNOT) and drop.
  at([X(2) - 2, Y(1)])
  at([X(2) - 2, Y(1)], {up: true, check: {json: cnot, step: 2, state: ket(4, 0, 3)}})
  // 34-37: hover the placed X (grab cursor).
  for (const d of [0, 1, 2, 2]) at([X(2) + d, Y(1) + 3])
  // 38-43: pick it up, off to the insert point, back under •, drop.
  at([X(2) + 2, Y(1) + 3], {down: true})
  for (const d of [10, 18, 22]) at([X(2) + 2 - d, Y(1) + 3])
  at([X(2) + 2, Y(1) + 3])
  at([X(2) + 2, Y(1) + 3], {up: true, check: {json: cnot, step: 2, state: ket(4, 0, 3)}})
  // 44-46: hover.
  for (const d of [3, 3, 2]) at([X(2) + d, Y(1) + 4])
  // 47-53: pick up and move to the third wire (live 8-state preview), drop on
  // the 500ms frame.
  at([X(2) + 2, Y(1) + 4], {down: true})
  at([X(2) + 2, Y(1) + 34]) // gate centre 30 below q1 → 26 from the third wire
  at([X(2) + 2, Y(2) + 4])
  for (const d of [3, 3, 2]) at([X(2) + d, Y(2) + 5])
  at([X(2) + 2, Y(2) + 5], {up: true, check: {json: cnot3, step: 2, state: ket(8, 0, 5)}})
  // 54-55: look under and back onto the gate.
  at([X(2) - 6, Y(2) + 24]); at([X(2) + 1, Y(2) + 6])
  // 56-62: carry it back to q1 (CNOT again) and drop.
  at([X(2) + 1, Y(2) + 6], {down: true})
  at([X(2) + 1, Y(2) - 6]); at([X(2) + 1, Y(2) - 18])
  at([X(2) + 1, Y(1) + 10]); at([X(2) + 2, Y(1) + 6]); at([X(2) + 2, Y(1) + 6])
  at([X(2) + 2, Y(1) + 6], {up: true, check: {json: cnot, step: 2, state: ket(4, 0, 3)}})
  // 63-67: rest on the gate.
  for (const d of [2, 3, 3, 4]) at([X(2) + d, Y(1) + 7])
  at([X(2) + 4, Y(1) + 7], {check: {json: cnot, step: 2, state: ket(4, 0, 3)}})
  return {
    name: 'qni_live_programming', canvas, size,
    attributes: {palette: JSON.stringify(palette), 'max-wire-count': '3', circuit},
    // The original breakpoint sits right after the • column.
    initialStep: 2,
    frames, delays: frames.map((_, i) => i === 53 ? 500 : 100),
  }
}

// B: qni_step_execution.gif, 576x420, 72 frames of 100ms. Bell circuit with
// both measurements (the editor example on qni_intro). Breakpoint at step 0;
// hover steps 1, 2, 4 and the q1 measurement, click step 2, then hover 4, 2, 1.
function stepExecution() {
  const palette = ['H', 'X', 'Y', 'Z']
  const size = {width: 576, height: 420}, canvas = canvasFor(size)
  const g = geometry(canvas.width, palette)
  const X = g.slot, Y = g.wire
  const circuit = '{"cols":[["|0>","|0>"],["H"],["•","X"],["Measure"],[1,"Measure"]]}'
  // Below the q1 gates (gate bottom +20) but inside the step band (+28).
  const hy = Y(1) + 24
  const frames = []
  const at = (pos, extra = {}) => frames.push({pos, ...extra})
  const idle = ({json: circuit, step: 0, state: ket(4, 0)})
  // 0-12: idle below the step band.
  at([X(4) + 40, Y(1) + 62], {check: idle})
  for (const d of [0, 1, 1, 2, 2, 2, 3, 3]) at([X(4) + 40 - d, Y(1) + 62])
  for (const d of [0, 1, 1]) at([X(3) + 10 - d, Y(1) + 66])
  at([X(3) + 8, Y(1) + 66])
  // 13: entering.
  at([X(2) - 4, Y(1) + 46])
  // 14-21: hover step 1 (after H).
  for (const d of [10, 8, 6, 4, 2, 0, -2]) at([X(1) + d, hy])
  frames[17].check = {json: circuit, step: 0, state: ket(4, 0, 1)}
  at([X(1) + 22, hy - 4])
  // 22-27: hover step 2 (after CNOT).
  for (const d of [-4, 0, 3, 5, 6, 16]) at([X(2) + d, hy])
  frames[25].check = {json: circuit, step: 0, state: ket(4, 0, 3)}
  // 28-33: hover the last step (after both measurements).
  for (const d of [-10, -8, -6, -4, -2, 0]) at([X(4) + d, hy + 2])
  frames[31].check = {json: circuit, step: 0, state: bellOutcomes}
  // 34-36: on the q1 measurement gate.
  for (const d of [6, 6, 7]) at([X(4) + d, Y(1) + 8])
  frames[35].check = {json: circuit, step: 0, state: bellOutcomes}
  // 37-41: back below it, drifting left within the last step.
  for (const d of [6, 10, 14, 18, 22]) at([X(4) - d, hy + 2])
  // 42-47: hover step 2.
  for (const d of [16, 15, 14, 12, 11, 10]) at([X(2) + d, hy])
  // 48-49: click step 2 → breakpoint (dark line) after the CNOT.
  at([X(2) + 10, hy], {down: true})
  at([X(2) + 10, hy], {up: true, check: {json: circuit, step: 2, state: ket(4, 0, 3)}})
  // 50-52: stay.
  for (const d of [0, 1, 1]) at([X(2) + 10, hy + d])
  // 53-56: leave the band; the breakpoint state stays.
  at([X(2) + 12, Y(1) + 58]); at([X(1) + 4, Y(1) + 64]); at([X(1) - 2, Y(1) + 66])
  frames[55].check = {json: circuit, step: 2, state: ket(4, 0, 3)}
  at([X(2) + 30, Y(1) + 54])
  // 57-60: hover the last step against the breakpoint.
  for (const d of [-22, -18, -14, -10]) at([X(4) + d, hy])
  // 61-63: on the q1 measurement gate; 64 just under it.
  for (const d of [2, 4, 6]) at([X(4) + d, Y(1) + 8])
  frames[62].check = {json: circuit, step: 2, state: bellOutcomes}
  at([X(4) - 6, Y(1) + 24])
  // 65-67: drift left within the last step; 68-69 on the breakpoint step.
  for (const d of [-14, -18, -22]) at([X(4) + d, hy])
  at([X(2) + 20, hy]); at([X(2) - 8, hy + 4])
  // 70-71: hover step 1, left of the breakpoint.
  at([X(1) + 14, hy + 4])
  at([X(1) + 8, hy + 4], {check: {json: circuit, step: 2, state: ket(4, 0, 1)}})
  return {
    name: 'qni_step_execution', canvas, size,
    attributes: {palette: JSON.stringify(palette), 'max-wire-count': '2', circuit},
    initialStep: 0,
    frames, delays: frames.map(() => 100),
  }
}

// Headless screenshots omit the system cursor, so draw one over the canvas.
// Shape follows the CSS cursor egui sets (drag_controller/hover.rs set_cursor_icon).
const cursors = {
  arrow: {hot: [1, 1], svg: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="24" viewBox="0 0 20 24"><path d="M1.5 1.5v18l4.6-4.4 3 7 3-1.3-3-6.8h6.3z" fill="#000" stroke="#fff" stroke-width="1.5" stroke-linejoin="round"/></svg>'},
  grab: {hot: [10, 10], svg: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="22" viewBox="0 0 20 22"><path d="M5 11V5.5a1.5 1.5 0 0 1 3 0V10V3.5a1.5 1.5 0 0 1 3 0V10V4.5a1.5 1.5 0 0 1 3 0V10V7a1.5 1.5 0 0 1 3 0v7c0 4-2.5 6.5-6 6.5H10c-2.5 0-4-1.2-5.5-3.2L2.3 14a1.5 1.5 0 0 1 2.4-1.8z" fill="#fff" stroke="#000" stroke-width="1.2" stroke-linejoin="round"/></svg>'},
  grabbing: {hot: [10, 10], svg: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="22" viewBox="0 0 20 22"><path d="M5 12V9a1.5 1.5 0 0 1 3 0v1V8a1.5 1.5 0 0 1 3 0v2V8.5a1.5 1.5 0 0 1 3 0V10V9.5a1.5 1.5 0 0 1 3 0v4.5c0 4-2.5 6.5-6 6.5H10c-2.5 0-4-1.2-5.5-3.2L3 15a1.5 1.5 0 0 1 2-2.2z" fill="#fff" stroke="#000" stroke-width="1.2" stroke-linejoin="round"/></svg>'},
}

async function setup(page, spec) {
  // Keep the page's own embeds from starting: only one runner may own the
  // thread-local GPU/texture state (qni-webgpu docs/web-embed.md 未対応事項).
  await page.route(url, async route => {
    if (route.request().resourceType() !== 'document') return route.continue()
    const response = await route.fetch()
    const html = (await response.text()).replace(/(<\/?)qni-webgpu-circuit\b/g, '$1qni-webgpu-circuit-off')
    await route.fulfill({response, body: html})
  })
  await page.goto(url)
  await page.evaluate(() => Promise.race([customElements.whenDefined('qni-webgpu-circuit'),
    new Promise((_, reject) => setTimeout(() => reject(Error('qni-webgpu-circuit is not defined')), 30000))]))
  const adapter = await page.evaluate(async () => {
    const a = await navigator.gpu?.requestAdapter()
    return a && {fallback: !!a.isFallbackAdapter, info: {...(a.info && {vendor: a.info.vendor, architecture: a.info.architecture, device: a.info.device, description: a.info.description})}}
  })
  if (!adapter) throw Error('No WebGPU adapter')
  console.log(`WebGPU adapter: ${JSON.stringify(adapter)}`)
  if ((adapter.fallback || adapter.info.architecture === 'swiftshader') && !software) throw Error('Software WebGPU adapter; QNI_GIF_SOFTWARE=1 allows it for a dry run')
  // Replace the page with one white stage holding one embed. The element's frame
  // has a 2px border and a 44px 「Qniで開く」 tab below; the canvas is the inside.
  await page.evaluate(({canvas, attributes, cursors}) => {
    document.documentElement.style.background = '#fff'
    document.body.replaceChildren()
    document.body.style.cssText = 'margin:0;background:#fff'
    const stage = document.createElement('div')
    stage.style.cssText = `position:absolute;left:0;top:0;padding:16px;background:#fff`
    const embed = document.createElement('qni-webgpu-circuit')
    embed.style.margin = '0'
    embed.setAttribute('width', String(canvas.width + 4))
    embed.setAttribute('height', String(canvas.height + 4 + 44))
    for (const [name, value] of Object.entries(attributes)) embed.setAttribute(name, value)
    stage.append(embed)
    const cursor = document.createElement('div')
    cursor.id = 'gif-cursor'
    cursor.style.cssText = 'position:fixed;left:0;top:0;z-index:10;pointer-events:none;line-height:0'
    cursor.dataset.svgs = JSON.stringify(cursors)
    document.body.append(stage, cursor)
  }, {canvas: spec.canvas, attributes: spec.attributes, cursors})
  await page.waitForFunction(() => {
    const state = document.querySelector('qni-webgpu-circuit')?.dataset.state
    if (state === 'error' || state === 'unsupported') throw Error(`embed state ${state}`)
    return state === 'running'
  }, null, {timeout: 60000})
  const box = await page.evaluate(() => {
    const canvas = document.querySelector('qni-webgpu-circuit').shadowRoot.querySelector('canvas')
    const r = canvas.getBoundingClientRect()
    return {x: r.x, y: r.y, width: r.width, height: r.height, backing: [canvas.width, canvas.height]}
  })
  if (box.width !== spec.canvas.width || box.height !== spec.canvas.height || box.backing[0] !== box.width || box.backing[1] !== box.height) {
    throw Error(`unexpected canvas box ${JSON.stringify(box)}; expected ${JSON.stringify(spec.canvas)} at DPR 1`)
  }
  if (spec.initialStep !== 0) {
    await page.evaluate(async step => {
      const runner = document.querySelector('qni-webgpu-circuit').runner
      runner.selectStep(step)
      await runner.readStateVector()
    }, spec.initialStep)
  }
  return box
}

// One mouse step per frame, then: rAF, GPU readback (rejected while dragging),
// two rAFs, and a short settle for the live-drag GPU plan rebuild.
async function settle(page) {
  await page.evaluate(async () => {
    const raf = () => new Promise(resolve => requestAnimationFrame(() => resolve()))
    await raf()
    try { await document.querySelector('qni-webgpu-circuit').runner.readStateVector() } catch {}
    await raf(); await raf()
  })
  if (settleMs > 0) await page.waitForTimeout(settleMs)
}

async function placeCursor(page, box, pos) {
  return page.evaluate(({x, y}) => {
    const canvas = document.querySelector('qni-webgpu-circuit').shadowRoot.querySelector('canvas')
    const css = getComputedStyle(canvas).cursor
    const kind = css === 'grabbing' ? 'grabbing' : css === 'grab' ? 'grab' : 'arrow'
    const cursor = document.getElementById('gif-cursor')
    const shape = JSON.parse(cursor.dataset.svgs)[kind]
    if (cursor.dataset.kind !== kind) { cursor.innerHTML = shape.svg; cursor.dataset.kind = kind }
    cursor.style.transform = `translate(${x - shape.hot[0]}px, ${y - shape.hot[1]}px)`
    return kind
  }, {x: box.x + pos[0], y: box.y + pos[1]})
}

async function check(page, frame, index, expected) {
  const actual = await page.evaluate(async () => {
    const runner = document.querySelector('qni-webgpu-circuit').runner
    return {json: runner.circuitJSON(), step: runner.selectedStep(), state: Array.from(await runner.readStateVector())}
  })
  const where = `frame ${index}`
  if (!circuitJSONEqual(actual.json, expected.json)) throw Error(`${where}: circuitJSON ${actual.json}, expected ${expected.json}`)
  if (actual.step !== expected.step) throw Error(`${where}: selectedStep() ${actual.step}, expected ${expected.step}`)
  try {
    typeof expected.state === 'function' ? expected.state(actual.state) : verify(actual.state, expected.state)
  } catch (error) { throw Error(`${where}: ${error.message}`) }
  console.log(`  ✓ ${where}: ${actual.json} step=${actual.step}`)
}

async function record(browser, spec) {
  const dir = `${outDir}/frames/${spec.name}`
  await rm(dir, {recursive: true, force: true})
  await mkdir(dir, {recursive: true})
  const context = await browser.newContext({viewport: {width: spec.canvas.width + 64, height: spec.canvas.height + 120}, deviceScaleFactor: 1})
  const page = await context.newPage()
  const errors = []
  page.on('pageerror', e => errors.push(e.message))
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()) })
  try {
    console.log(`${spec.name}: ${spec.frames.length} frames, canvas ${spec.canvas.width}x${spec.canvas.height} → ${spec.size.width}x${spec.size.height}`)
    const box = await setup(page, spec)
    const mouse = page.mouse
    await mouse.move(box.x + spec.frames[0].pos[0], box.y + spec.frames[0].pos[1])
    await settle(page)
    let down = false
    for (const [index, frame] of spec.frames.entries()) {
      const [x, y] = [box.x + frame.pos[0], box.y + frame.pos[1]]
      // egui handles press and release on separate frames; moves in a few steps
      // so drags see intermediate pointer positions.
      await mouse.move(x, y, {steps: down ? 4 : 2})
      if (frame.down) { await mouse.down(); down = true }
      if (frame.up) { await mouse.up(); down = false }
      await settle(page)
      const kind = await placeCursor(page, box, frame.pos)
      await page.screenshot({path: `${dir}/${String(index).padStart(3, '0')}.png`, clip: {x: box.x, y: box.y, width: box.width, height: box.height}})
      if (frame.check) await check(page, frame, index, frame.check)
      if (process.env.QNI_GIF_VERBOSE) console.log(`  frame ${index} (${frame.pos.map(Math.round)}) cursor=${kind}${frame.down ? ' down' : ''}${frame.up ? ' up' : ''}`)
    }
    if (errors.length) throw Error(`browser errors: ${JSON.stringify(errors)}`)
  } finally {
    await context.close()
  }
  return dir
}

function encode(spec, dir) {
  // ffconcat with framerate 10: per-frame durations land exactly on the GIF's
  // centisecond delays, and the last frame keeps its 0.1s without the usual
  // repeated-last-entry trick (which would add a frame).
  const list = ['ffconcat version 1.0']
  spec.delays.forEach((ms, i) => list.push(`file '${dir}/${String(i).padStart(3, '0')}.png'`, 'option framerate 10', `duration ${ms / 1000}`))
  const listPath = `${outDir}/${spec.name}.ffconcat`
  const gif = `${outDir}/${spec.name}.gif`
  return writeFile(listPath, list.join('\n') + '\n').then(() => {
    const {width, height} = spec.size
    execFileSync('ffmpeg', ['-v', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', listPath,
      '-filter_complex', `[0:v]scale=${width}:${height}:flags=lanczos,split[a][b];[a]palettegen=stats_mode=full[p];[b][p]paletteuse=dither=sierra2_4a:diff_mode=rectangle`,
      '-fps_mode', 'passthrough', '-loop', '0', gif], {stdio: 'inherit'})
    return gif
  })
}

// Minimal GIF reader (what PIL reports): logical size, loop count, frame delays.
function parseGif(buffer) {
  if (buffer.toString('latin1', 0, 3) !== 'GIF') throw Error('not a GIF')
  const width = buffer.readUInt16LE(6), height = buffer.readUInt16LE(8)
  let p = 13
  const skipTable = flags => { if (flags & 0x80) p += 3 * 2 ** ((flags & 7) + 1) }
  skipTable(buffer[10])
  const skipBlocks = () => { while (buffer[p]) p += buffer[p] + 1; p++ }
  const delays = []
  let loop = null, delay = 0
  while (p < buffer.length) {
    const introducer = buffer[p++]
    if (introducer === 0x3b) break
    if (introducer === 0x21) {
      const label = buffer[p++]
      if (label === 0xf9) delay = buffer.readUInt16LE(p + 2) * 10
      if (label === 0xff && buffer.toString('latin1', p + 1, p + 12) === 'NETSCAPE2.0') loop = buffer.readUInt16LE(p + 14)
      skipBlocks()
    } else if (introducer === 0x2c) {
      const flags = buffer[p + 8]
      p += 9
      skipTable(flags)
      p++ // LZW minimum code size
      skipBlocks()
      delays.push(delay)
      delay = 0
    } else throw Error(`bad GIF block 0x${introducer.toString(16)} at ${p - 1}`)
  }
  return {width, height, loop, delays}
}

async function inspect(spec, gif) {
  const probe = JSON.parse(execFileSync('ffprobe', ['-v', 'error', '-count_frames', '-select_streams', 'v:0',
    '-show_entries', 'stream=width,height,nb_read_frames:format=duration', '-of', 'json', gif]))
  const stream = probe.streams[0]
  const parsed = parseGif(await readFile(gif))
  const total = parsed.delays.reduce((a, b) => a + b, 0)
  const expectedTotal = spec.delays.reduce((a, b) => a + b, 0)
  console.log(`${gif}: ffprobe ${stream.width}x${stream.height} frames=${stream.nb_read_frames} duration=${probe.format.duration}s; ` +
    `parsed ${parsed.width}x${parsed.height} frames=${parsed.delays.length} total=${total}ms loop=${parsed.loop}`)
  const problems = []
  if (parsed.width !== spec.size.width || parsed.height !== spec.size.height || stream.width !== spec.size.width || stream.height !== spec.size.height) problems.push('size')
  if (parsed.delays.length !== spec.delays.length || Number(stream.nb_read_frames) !== spec.delays.length) problems.push('frame count')
  if (parsed.delays.some((d, i) => d !== spec.delays[i])) problems.push(`delays ${JSON.stringify(parsed.delays)}`)
  if (total !== expectedTotal) problems.push(`total ${total}ms != ${expectedTotal}ms`)
  if (parsed.loop !== 0) problems.push(`loop ${parsed.loop}`)
  if (problems.length) throw Error(`${gif}: ${problems.join(', ')}`)
}

const specs = [liveProgramming(), stepExecution()]
const only = process.argv.slice(2).filter(x => !x.startsWith('--'))
const selected = specs.filter(s => !only.length || only.some(o => s.name.includes(o)))
for (const spec of specs) {
  if (spec.frames.length !== spec.delays.length || spec.frames.length !== (spec.name === 'qni_live_programming' ? 68 : 72)) throw Error(`${spec.name}: ${spec.frames.length} frames`)
}
const browser = await chromium.launch({
  headless,
  executablePath: process.env.QTW_CHROMIUM_PATH || undefined,
  // Same WebGPU flags as gpu-audit-helper.mjs::audit. Chromium's default
  // SwiftShader WebGPU loses its device on Qni; the Vulkan SwiftShader path works.
  args: software
    ? ['--enable-unsafe-webgpu', '--enable-features=Vulkan', '--use-vulkan=swiftshader', '--use-angle=swiftshader', '--disable-vulkan-surface', '--no-sandbox']
    : ['--enable-unsafe-webgpu', '--enable-features=Vulkan', '--use-angle=vulkan', '--no-sandbox'],
})
try {
  await mkdir(outDir, {recursive: true})
  for (const spec of selected) {
    const dir = await record(browser, spec)
    const gif = await encode(spec, dir)
    await inspect(spec, gif)
  }
} finally {
  await browser.close()
}
