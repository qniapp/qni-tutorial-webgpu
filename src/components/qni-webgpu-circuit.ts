import { APP_URL } from './qni-webgpu-app-url'

type EmbedHandle = { destroy(): void; circuitJSON(): string; readStateVector(): Promise<Float32Array> }
type LoadProgress = { stage: string; loaded: number; total: number | null }
type EmbedModule = {
  startEmbed(
    canvas: HTMLCanvasElement,
    circuit: string,
    settings: { showStatePanel: boolean; onProgress?: (progress: LoadProgress) => void; onDeviceLost?: () => void },
  ): Promise<EmbedHandle>
}

class QniWebgpuCircuit extends HTMLElement {
  static observedAttributes = ['circuit', 'show-state-panel', 'width', 'height']

  private canvas: HTMLCanvasElement
  private status: HTMLDivElement
  private openLink: HTMLAnchorElement
  private runner?: EmbedHandle
  private generation = 0
  private pending: Promise<void> = Promise.resolve()
  private resizeObserver: ResizeObserver

  constructor() {
    super()
    const shadow = this.attachShadow({ mode: 'open' })
    shadow.innerHTML = `
      <style>
        :host {
          display: block;
          position: relative;
          width: var(--_qni-width, var(--qni-webgpu-circuit-width, 100%));
          height: var(--_qni-height, var(--qni-webgpu-circuit-height, 640px));
        }
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
        [hidden] { display: none; }
      </style>
      <div class="frame">
        <canvas tabindex="0" aria-label="量子回路シミュレーター"></canvas>
        <div role="status" aria-live="polite" aria-atomic="true"></div>
      </div>
      <div class="open-tab"><a class="open-link" target="_blank" rel="noopener"><span>Qniで開く</span><svg aria-hidden="true" focusable="false" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M21 9L21 3M21 3H15M21 3L13 11M10 5H7.8C6.11984 5 5.27976 5 4.63803 5.32698C4.07354 5.6146 3.6146 6.07354 3.32698 6.63803C3 7.27976 3 8.11984 3 9.8V16.2C3 17.8802 3 18.7202 3.32698 19.362C3.6146 19.9265 4.07354 20.3854 4.63803 20.673C5.27976 21 6.11984 21 7.8 21H14.2C15.8802 21 16.7202 21 17.362 20.673C17.9265 20.3854 18.3854 19.9265 18.673 19.362C19 18.7202 19 17.8802 19 16.2V14" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></a></div>
    `
    this.canvas = shadow.querySelector('canvas')!
    this.status = shadow.querySelector('[role="status"]')!
    this.openLink = shadow.querySelector('.open-link')!
    for (const event of ['pointerdown', 'focus', 'keydown', 'click', 'auxclick']) {
      this.openLink.addEventListener(event, () => this.updateOpenLink())
    }
    this.resizeObserver = new ResizeObserver(() => this.resizeCanvas())
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
    this.restart()
  }

  disconnectedCallback() {
    ++this.generation
    this.resizeObserver.disconnect()
    this.destroyRunner()
    this.setState('idle')
  }

  attributeChangedCallback(name: string, oldValue: string | null, value: string | null) {
    if (oldValue === value) return
    if (name === 'width' || name === 'height') {
      this.updateSize()
    } else if (this.isConnected) {
      this.restart()
    }
  }

  private updateOpenLink() {
    let circuit = this.getAttribute('circuit') ?? '{"cols":[]}'
    // Synchronous metadata export preserves normal anchor/new-tab behavior.
    // During startup/failure the initial circuit remains useful and accessible.
    if (this.runner) {
      try { circuit = this.runner.circuitJSON() }
      catch { return } // Retain the last valid link if the runner is unavailable.
    }
    this.openLink.href = `${APP_URL}#${encodeURIComponent(circuit)}`
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
    this.resizeCanvas()
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

  private restart() {
    const generation = ++this.generation
    this.destroyRunner()
    this.setState('loading', '読み込み中…')
    this.updateOpenLink()
    // Queue even reconnects behind unresolved startup. A stale handle must be
    // destroyed before startEmbed can use this same canvas again.
    this.pending = this.pending.then(() => this.start(generation))
  }

  private async start(generation: number) {
    const current = () => this.isConnected && generation === this.generation
    if (!current()) return
    if (!(navigator as Navigator & { gpu?: unknown }).gpu) {
      this.setState('unsupported', 'このブラウザーはWebGPUに対応していません。')
      return
    }
    try {
      const circuit = this.getAttribute('circuit') ?? '{"cols":[]}'
      JSON.parse(circuit)
      const settings = {
        showStatePanel: this.getAttribute('show-state-panel') !== 'false',
        onDeviceLost: () => {
          if (!current()) return
          ++this.generation
          this.destroyRunner()
          this.setState('error', 'GPU との接続が失われました。ページを再読み込みしてください。')
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
        /* @vite-ignore */ `${import.meta.env.BASE_URL}qni-webgpu/qni-embed.mjs`
      ) as EmbedModule
      if (!current()) return
      const runner = await module.startEmbed(this.canvas, circuit, settings)
      if (!current()) {
        runner.destroy()
        return
      }
      this.runner = runner
      this.setState('running')
      this.updateOpenLink()
    } catch (error) {
      console.error('量子回路の起動に失敗しました。', error)
      if (current()) this.setState('error', '量子回路を起動できませんでした。')
    }
  }
}

if (!customElements.get('qni-webgpu-circuit')) {
  customElements.define('qni-webgpu-circuit', QniWebgpuCircuit)
}

export {}
