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
        canvas { display: block; width: 100%; height: calc(100% - 32px); }
        .open-link { position: absolute; bottom: 0; right: 12px; height: 32px;
          display: flex; align-items: center; font-size: 14px; line-height: 20px;
          color: #205EA6; /* Flexoki blue-600; text-sm, h-8, right-3 */ }
        .open-link:focus-visible { outline: 2px solid currentColor; outline-offset: 2px; }
        canvas:focus-visible { outline: 2px solid currentColor; outline-offset: -2px; }
        [role="status"] { position: absolute; inset: 1rem; pointer-events: none; }
        [hidden] { display: none; }
      </style>
      <canvas tabindex="0" aria-label="量子回路シミュレーター"></canvas>
      <div role="status" aria-live="polite" aria-atomic="true"></div>
      <a class="open-link" target="_blank" rel="noopener" title="現在の回路を新しいタブで開きます">Qni WebGPU で開く</a>
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
    const { width, height } = this.getBoundingClientRect()
    const scale = window.devicePixelRatio || 1
    const w = Math.max(1, Math.round(width * scale))
    const h = Math.max(1, Math.round((height - 32) * scale))
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
