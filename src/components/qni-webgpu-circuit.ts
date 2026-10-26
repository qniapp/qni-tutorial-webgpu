import { embedDirectory } from 'virtual:tutorial-embed'
import { buildQniAppUrl } from './qni-webgpu-app-url'
import { estimateEmbedHeight } from './qni-embed-height'

const embedBase = `${import.meta.env.BASE_URL}${embedDirectory}`

type EmbedHandle = { destroy(): void; circuitJSON(): string; preferredHeight(widthCssPx: number): number; readStateVector(): Promise<Float32Array>; selectStep(n: number): void; selectedStep(): number | null; stepCount(): number }
type LoadProgress = { stage: string; loaded: number; total: number | null }
type EmbedModule = {
  startEmbed(
    canvas: HTMLCanvasElement,
    circuit: string,
    settings: { showStatePanel: boolean; palette?: string[]; maxWireCount?: number; showRestartButton?: boolean; onRestart?: () => void; onProgress?: (progress: LoadProgress) => void; onDeviceLost?: (error: unknown) => void },
  ): Promise<EmbedHandle>
}

type StartupError = Error & { code: string }
type StartupErrorView = { code: string; remove(): void }
type ErrorModule = {
  QniStartupError: new (code: string, message: string, options?: { cause?: unknown }) => StartupError
  diagnoseWebGpu(): Promise<StartupError | null>
  renderStartupError(container: HTMLElement, error: unknown, options: { onRetry: () => void; headingLevel: 3 }): StartupErrorView
}

// This module is independent of wasm; share its load across all embeds.
let errorModulePromise: Promise<ErrorModule> | undefined
function loadErrorModule() {
  return errorModulePromise ??= (import(
    /* @vite-ignore */ `${embedBase}qni-embed-error.mjs`
  ) as Promise<ErrorModule>).catch(error => {
    errorModulePromise = undefined
    throw error
  })
}

class QniWebgpuCircuit extends HTMLElement {
  static observedAttributes = ['circuit', 'palette', 'show-state-panel', 'max-wire-count', 'run-button', 'width', 'height', 'selected-step']

  private canvas: HTMLCanvasElement
  private status: HTMLDivElement
  private errorSlot: HTMLDivElement
  private errorView?: StartupErrorView
  private openLink: HTMLAnchorElement
  private runner?: EmbedHandle
  private preservedCircuit?: string
  private generation = 0
  private pending: Promise<void> = Promise.resolve()
  private resizeObserver: ResizeObserver
  private heightTimer?: ReturnType<typeof setInterval>
  private active = false
  private activationHint: HTMLDivElement
  private activationHintTimer?: ReturnType<typeof setTimeout>

  constructor() {
    super()
    const shadow = this.attachShadow({ mode: 'open' })
    shadow.innerHTML = `
      <style>
        :host {
          display: block;
          position: relative;
          width: var(--_qni-width, var(--qni-webgpu-circuit-width, 100%));
          height: var(--_qni-height, var(--qni-webgpu-circuit-height, var(--_qni-auto-height)));
        }
        /* The attached 「Qniで開く」 tab still needs its 44px row. */
        .frame { box-sizing: border-box; position: relative; height: calc(100% - 44px);
          padding: 0; border: 2px solid #0EA5E9; border-radius: 6px 6px 6px 0;
          background: #FAFAFA; color: #404040; overflow: hidden; }
        .frame, .open-tab { font: 400 16px/28px ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji'; }
        canvas { display: block; width: 100%; height: 100%; }
        .open-tab { box-sizing: border-box; width: fit-content; padding: 8px 16px;
          background: #0EA5E9; color: #404040; border: 0 solid #E5E7EB; border-radius: 0 0 6px 6px; }
        .open-link { display: flex; flex-direction: row; color: #FFFFFF;
          font-weight: 500; text-decoration: none; border: 0 solid #E5E7EB; }
        .open-link span { margin-right: 8px; }
        .open-link svg { display: block; flex: none; }
        .open-link:focus-visible { outline: 2px solid currentColor; outline-offset: 2px; }
        canvas:focus-visible { outline: 2px solid currentColor; outline-offset: -2px; }
        [role="status"] { position: absolute; inset: 1rem; pointer-events: none; }
        .activation-hint { position: absolute; top: 8px; right: 8px; padding: 4px 12px;
          border-radius: 9999px; background: rgb(16 15 15 / 0.8); color: #FFFCF0;
          font-size: 14px; line-height: 20px; pointer-events: none;
          opacity: 0; transition: opacity 150ms; }
        .activation-hint.visible { opacity: 1; }
        .error-slot { position: absolute; inset: 0; overflow: auto; }
        [hidden] { display: none; }
      </style>
      <div class="frame">
        <canvas tabindex="0" aria-label="量子回路シミュレーター"></canvas>
        <div role="status" aria-live="polite" aria-atomic="true"></div>
        <div class="error-slot" hidden></div>
        <div class="activation-hint" aria-hidden="true">クリックすると操作できます</div>
      </div>
      <div class="open-tab"><a class="open-link" target="_blank" rel="noopener"><span>Qniで開く</span><svg aria-hidden="true" focusable="false" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M21 9L21 3M21 3H15M21 3L13 11M10 5H7.8C6.11984 5 5.27976 5 4.63803 5.32698C4.07354 5.6146 3.6146 6.07354 3.32698 6.63803C3 7.27976 3 8.11984 3 9.8V16.2C3 17.8802 3 18.7202 3.32698 19.362C3.6146 19.9265 4.07354 20.3854 4.63803 20.673C5.27976 21 6.11984 21 7.8 21H14.2C15.8802 21 16.7202 21 17.362 20.673C17.9265 20.3854 18.3854 19.9265 18.673 19.362C19 18.7202 19 17.8802 19 16.2V14" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></a></div>
    `
    this.canvas = shadow.querySelector('canvas')!
    // Native keyboard focus must not scroll the tutorial to an off-screen embed.
    const focusCanvas = this.canvas.focus.bind(this.canvas)
    this.canvas.focus = options => focusCanvas({ ...options, preventScroll: true })
    this.status = shadow.querySelector('[role="status"]')!
    this.errorSlot = shadow.querySelector('.error-slot')!
    this.openLink = shadow.querySelector('.open-link')!
    for (const event of ['pointerdown', 'focus', 'keydown', 'click', 'auxclick']) {
      this.openLink.addEventListener(event, () => this.updateOpenLink())
    }
    this.resizeObserver = new ResizeObserver(() => {
      this.updateAutoHeight()
      this.resizeCanvas()
    })
    this.activationHint = shadow.querySelector('.activation-hint')!
    this.installScrollGate(shadow)
  }

  /**
   * The runner cancels wheel and trackpad gesture events on its canvas, so a
   * reader scrolling past the embed would get stuck on it. Until the embed is
   * activated by a click, tap, or keyboard focus, those events are stopped
   * above the canvas and the page scrolls normally. Clicking outside or
   * moving focus elsewhere releases the embed again.
   *
   * Touch input is not gated: the runner already leaves vertical swipes to
   * the page, and taps, horizontal swipes, and gate drags must reach it on
   * the first touch.
   */
  private installScrollGate(shadow: ShadowRoot) {
    const gated = ['wheel', 'gesturestart', 'gesturechange', 'gestureend']
    for (const type of gated) {
      shadow.addEventListener(type, event => {
        if (this.active) return
        event.stopPropagation()
        if (type === 'wheel') this.showActivationHint()
      }, { capture: true, passive: true })
    }
    shadow.addEventListener('pointerdown', event => {
      // A touch may start a page scroll, so only a completed tap (click) activates.
      if ((event as PointerEvent).pointerType !== 'touch') this.setActive(true)
    }, { capture: true })
    shadow.addEventListener('click', () => this.setActive(true), { capture: true })
    shadow.addEventListener('focusin', () => this.setActive(true))
    shadow.addEventListener('focusout', () => {
      // The runner briefly blurs and refocuses its text input while typing.
      setTimeout(() => { if (!shadow.activeElement) this.setActive(false) })
    })
  }

  private onDocumentPointerDown = (event: PointerEvent) => {
    if (this.active && !event.composedPath().includes(this)) this.setActive(false)
  }

  private setActive(active: boolean) {
    if (this.active === active) return
    this.active = active
    this.toggleAttribute('data-active', active)
    if (active) this.activationHint.classList.remove('visible')
  }

  private showActivationHint() {
    this.activationHint.classList.add('visible')
    clearTimeout(this.activationHintTimer)
    this.activationHintTimer = setTimeout(() => this.activationHint.classList.remove('visible'), 1500)
  }

  /** Test-only on-demand GPU readback scoped to this element. */
  async readStateVector() {
    if (!this.runner) throw new Error('Circuit runner is not ready')
    return this.runner.readStateVector()
  }

  connectedCallback() {
    this.updateSize()
    this.updateOpenLink()
    this.resizeObserver.observe(this)
    document.addEventListener('pointerdown', this.onDocumentPointerDown, { capture: true })
    // Metadata-only query also follows edits and state-panel resizing.
    this.heightTimer = setInterval(() => { if (this.runner) this.updateAutoHeight() }, 250)
    this.restart()
  }

  disconnectedCallback() {
    ++this.generation
    this.resizeObserver.disconnect()
    document.removeEventListener('pointerdown', this.onDocumentPointerDown, { capture: true })
    this.setActive(false)
    clearInterval(this.heightTimer)
    this.preservedCircuit = undefined
    this.destroyRunner()
    this.clearError()
    this.setState('idle')
  }

  attributeChangedCallback(name: string, oldValue: string | null, value: string | null) {
    if (oldValue === value) return
    if (name === 'selected-step') {
      this.applySelectedStep()
    } else if (name === 'width' || name === 'height') {
      this.updateSize()
    } else if (this.isConnected) {
      // A visibility change must not discard gates edited inside the embed.
      this.preservedCircuit = name === 'run-button'
        ? this.runner?.circuitJSON() ?? this.preservedCircuit
        : undefined
      this.restart(this.preservedCircuit)
    }
  }

  private applySelectedStep() {
    const value = this.getAttribute('selected-step')?.trim()
    if (!this.runner || !value || !/^[+-]?\d+$/.test(value)) return
    const step = Number(value)
    if (!Number.isSafeInteger(step)) return
    try { this.runner.selectStep(step) }
    catch (error) { console.warn('量子回路のステップを選択できませんでした。', error) }
  }

  private updateOpenLink() {
    let circuit = this.getAttribute('circuit') ?? '{"cols":[]}'
    // Synchronous metadata export preserves normal anchor/new-tab behavior.
    // During startup/failure the initial circuit remains useful and accessible.
    if (this.runner) {
      try { circuit = this.runner.circuitJSON() }
      catch { return } // Retain the last valid link if the runner is unavailable.
    }
    this.openLink.href = buildQniAppUrl(circuit)
  }

  private updateSize() {
    for (const name of ['width', 'height']) {
      const value = this.getAttribute(name)
      const pixels = value === null || value.trim() === '' ? NaN : Number(value)
      if (Number.isFinite(pixels) && pixels >= 0) {
        this.style.setProperty(`--_qni-${name}`, `${pixels}px`)
      } else {
        this.style.removeProperty(`--_qni-${name}`)
      }
    }
    this.updateAutoHeight()
    this.resizeCanvas()
  }

  private updateAutoHeight() {
    if (this.style.getPropertyValue('--_qni-height')) return
    // The frame has 2px borders; the attached link occupies 44px.
    const width = Math.max(1, this.getBoundingClientRect().width - 4)
    let height: number
    if (this.runner) {
      try { height = this.runner.preferredHeight(width) }
      catch { return } // Retain the last valid size if the device/runner was lost.
    } else {
      const rawMax = Number(this.getAttribute('max-wire-count'))
      height = estimateEmbedHeight(this.preservedCircuit ?? this.getAttribute('circuit') ?? '{"cols":[]}',
        this.getAttribute('palette'), rawMax > 0 ? rawMax : undefined,
        this.getAttribute('show-state-panel') !== 'false', width)
    }
    const value = `${height + 48}px`
    if (this.style.getPropertyValue('--_qni-auto-height') !== value) {
      this.style.setProperty('--_qni-auto-height', value)
    }
  }

  private resizeCanvas() {
    const { width, height } = this.canvas.getBoundingClientRect()
    const scale = window.devicePixelRatio || 1
    const w = Math.max(1, Math.round(width * scale))
    const h = Math.max(1, Math.round(height * scale))
    if (this.canvas.width !== w) this.canvas.width = w
    if (this.canvas.height !== h) this.canvas.height = h
  }

  private setState(state: string, message = '') {
    this.dataset.state = state
    this.status.textContent = message
    this.status.hidden = !message
    this.canvas.hidden = state === 'unsupported' || state === 'error'
  }

  private destroyRunner() {
    const runner = this.runner
    this.runner = undefined
    runner?.destroy()
  }

  private clearError() {
    this.errorView?.remove()
    this.errorView = undefined
    this.errorSlot.replaceChildren()
    this.errorSlot.hidden = true
    delete this.dataset.errorCode
  }

  private showError(errors: ErrorModule | undefined, error: unknown) {
    this.clearError()
    if (errors) {
      this.errorView = errors.renderStartupError(this.errorSlot, error, {
        onRetry: () => this.restart(), headingLevel: 3,
      })
      this.dataset.errorCode = this.errorView.code
    } else {
      this.dataset.errorCode = 'unknown'
      this.errorSlot.textContent = '量子回路を起動できませんでした。ページを再読み込みしてください。'
    }
    this.errorSlot.hidden = false
    this.setState(this.errorView?.code === 'webgpu-unsupported' ? 'unsupported' : 'error')
  }

  private restart(circuit = this.preservedCircuit) {
    const generation = ++this.generation
    this.preservedCircuit = circuit
    this.destroyRunner()
    this.clearError()
    this.setState('loading', '読み込み中…')
    this.updateAutoHeight()
    this.updateOpenLink()
    // Queue even reconnects behind unresolved startup. A stale handle must be
    // destroyed before startEmbed can use this same canvas again.
    this.pending = this.pending.then(() => this.start(generation, circuit))
  }

  private async start(generation: number, preservedCircuit?: string) {
    const current = () => this.isConnected && generation === this.generation
    if (!current()) return
    let errors: ErrorModule | undefined
    let validatingAttributes = false
    try {
      errors = await loadErrorModule()
      if (!current()) return
      const problem = await errors.diagnoseWebGpu()
      if (!current()) return
      if (problem) {
        this.showError(errors, problem)
        return
      }
      validatingAttributes = true
      const circuit = preservedCircuit ?? this.getAttribute('circuit') ?? '{"cols":[]}'
      JSON.parse(circuit)
      const rawPalette = this.getAttribute('palette')
      let palette: string[] | undefined
      if (rawPalette !== null) {
        const parsed: unknown = JSON.parse(rawPalette)
        if (!Array.isArray(parsed) || !parsed.every(token => typeof token === 'string')) {
          throw new TypeError('palette must be a JSON array of gate token strings')
        }
        palette = parsed
      }
      const rawMaxWireCount = this.getAttribute('max-wire-count')
      let maxWireCount: number | undefined
      if (rawMaxWireCount !== null) {
        const value = rawMaxWireCount.trim()
        maxWireCount = Number.parseInt(value, 10)
        if (!/^\d+$/.test(value) || !Number.isSafeInteger(maxWireCount) || maxWireCount < 1) {
          throw new TypeError('max-wire-count must be a positive integer')
        }
      }
      validatingAttributes = false
      const settings = {
        ...(palette === undefined ? {} : { palette }),
        ...(maxWireCount === undefined ? {} : { maxWireCount }),
        showStatePanel: this.getAttribute('show-state-panel') !== 'false',
        showRestartButton: this.hasAttribute('run-button'),
        onRestart: () => {
          if (!current() || this.dataset.state !== 'running' || !this.runner || !this.hasAttribute('run-button')) return
          const circuit = this.runner.circuitJSON()
          if (this.getAttribute('circuit') === circuit) this.restart()
          else this.setAttribute('circuit', circuit)
        },
        onDeviceLost: (error: unknown) => {
          if (!current()) return
          // Export if still available; real lost-device runners may reject it.
          try { this.preservedCircuit = this.runner?.circuitJSON() ?? preservedCircuit }
          catch { /* Keep the last preserved/initial circuit. */ }
          ++this.generation
          this.destroyRunner()
          this.showError(errors, error)
        },
        onProgress: ({ stage, loaded, total }: LoadProgress) => {
          if (!current()) return
          const stages: Record<string, string> = {
            compile: 'コンパイル中…', gpu: 'GPU 初期化中…', prepare: '準備中…',
          }
          const download = total
            ? `ダウンロード中… ${Math.min(100, Math.floor(loaded / total * 100))}%`
            : `ダウンロード中… ${(loaded / 1048576).toFixed(1)} MB`
          this.setState('loading', stages[stage] ?? download)
        },
      }
      const module = await import(
        /* @vite-ignore */ `${embedBase}qni-embed.mjs`
      ) as EmbedModule
      if (!current()) return
      const runner = await module.startEmbed(this.canvas, circuit, settings)
      if (!current()) {
        runner.destroy()
        return
      }
      this.runner = runner
      this.applySelectedStep()
      this.preservedCircuit = undefined
      this.clearError()
      this.setState('running')
      this.updateAutoHeight()
      this.resizeCanvas()
      this.updateOpenLink()
    } catch (error) {
      console.error('量子回路の起動に失敗しました。', error)
      if (current()) {
        this.showError(errors, validatingAttributes && errors
          ? new errors.QniStartupError('invalid-embed', error instanceof Error ? error.message : String(error), { cause: error })
          : error)
      }
    }
  }
}

if (!customElements.get('qni-webgpu-circuit')) {
  customElements.define('qni-webgpu-circuit', QniWebgpuCircuit)
}

export {}
