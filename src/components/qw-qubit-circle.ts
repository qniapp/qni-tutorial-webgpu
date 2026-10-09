import './qw-qubit-circle.css'

const number = '[+-]?(?:\\d+(?:\\.\\d*)?|\\.\\d+)(?:[eE][+-]?\\d+)?'
const realPattern = new RegExp(`^${number}$`)
const complexPattern = new RegExp(`^(${number})([+-](?:\\d+(?:\\.\\d*)?|\\.\\d+)(?:[eE][+-]?\\d+)?)?i$`)

export function parseAmplitude(value: string): [number, number] | null {
  const text = value.replace(/\s/g, '').replace(/([+-])i$/, (_, sign: string) => `${sign}1i`)
  if (realPattern.test(text)) return Number.isFinite(Number(text)) ? [Number(text), 0] : null
  if (text === 'i' || text === '+i' || text === '-i') return [0, text === '-i' ? -1 : 1]
  const pair = complexPattern.exec(text)
  if (!pair) return null
  const values: [number, number] = pair[2] === undefined ? [0, Number(pair[1])] : [Number(pair[1]), Number(pair[2])]
  return values.every(Number.isFinite) ? values : null
}
const signed = (value: number, digits: number) => `${value >= 0 ? '+' : ''}${value.toFixed(digits)}`
let tooltip: HTMLDivElement | undefined
let active: QwQubitCircle | undefined
let lastConnectedTime = 0
function hideTooltip() {
  active?.removeAttribute('aria-describedby')
  active = undefined
  if (tooltip) tooltip.hidden = true
}
function showTooltip(circle: QwQubitCircle) {
  if (!tooltip) {
    tooltip = document.createElement('div')
    tooltip.id = 'qw-qubit-circle-tooltip'
    tooltip.setAttribute('role', 'tooltip')
    document.body.append(tooltip)
  }
  active?.removeAttribute('aria-describedby')
  active = circle
  tooltip.textContent = circle.tooltipText()
  tooltip.hidden = false
  circle.setAttribute('aria-describedby', tooltip.id)
  const rect = circle.getBoundingClientRect()
  const x = Math.max(8, Math.min(rect.left, innerWidth - tooltip.offsetWidth - 8))
  const y = rect.bottom + tooltip.offsetHeight + 8 <= innerHeight ? rect.bottom + 8 : Math.max(8, rect.top - tooltip.offsetHeight - 8)
  tooltip.style.left = `${x}px`
  tooltip.style.top = `${y}px`
}
const targetCircle = (target: EventTarget | null) => target instanceof Element ? target.closest<QwQubitCircle>('qw-qubit-circle') : null

export class QwQubitCircle extends HTMLElement {
  static observedAttributes = ['data-amplitude', 'data-amplitude-real', 'data-amplitude-imag', 'data-ket', 'data-qubit-count', 'data-size', 'data-hide-phase', 'data-show-popup-header', 'data-show-popup-amplitude', 'data-show-popup-probability', 'data-show-popup-phase', 'data-dark-mode', 'data-popup-template-id']
  private parts?: SVGElement[]
  private real = 0
  private imag = 0
  private valid = true
  connectedCallback() {
    if (!this.parts) {
      this.innerHTML = '<svg aria-hidden="true" focusable="false"><circle data-part="disc"/><circle data-part="rim" fill="none"/><line data-part="phase" stroke-linecap="round"/><circle data-part="outline" fill="none"/></svg>'
      this.parts = Array.from(this.querySelectorAll<SVGElement>('svg, svg > *'))
      this.setAttribute('role', 'img')
      if (!this.hasAttribute('tabindex')) this.tabIndex = 0
    }
    this.update()
    lastConnectedTime = performance.now()
  }
  disconnectedCallback() { if (active === this) hideTooltip() }
  attributeChangedCallback() { if (this.parts) this.update() }
  private flag(name: string) { return this.hasAttribute(name) && this.getAttribute(name) !== 'false' }
  private values() {
    if (this.hasAttribute('data-amplitude-real') || this.hasAttribute('data-amplitude-imag')) {
      const re = this.getAttribute('data-amplitude-real') ?? '0', im = this.getAttribute('data-amplitude-imag') ?? '0'
      return realPattern.test(re) && realPattern.test(im) ? [Number(re), Number(im)] : null
    }
    return parseAmplitude(this.getAttribute('data-amplitude') ?? '0')
  }
  private update() {
    const value = this.values()
    this.valid = value !== null && value.every(Number.isFinite)
    ;[this.real, this.imag] = this.valid ? value! : [0, 0]
    this.toggleAttribute('data-invalid', !this.valid)
    const sizeName = this.getAttribute('data-size') ?? 'base'
    const sizes: Record<string, number> = { xl: 64, lg: 48, base: 32, sm: 16 }
    const raw = sizes[sizeName] ?? Number(sizeName)
    const size = Number.isFinite(raw) && raw >= 16 && raw <= 256 ? raw : 32
    const stroke = size <= 16 ? 1 : 2, radius = size / 2, inner = radius - stroke / 2, box = size + stroke, center = box / 2
    const magnitude = Math.min(1, Math.hypot(this.real, this.imag)), fill = inner * magnitude
    const phase = Math.atan2(this.imag, this.real)
    const [svg, disc, rim, needle, outline] = this.parts!
    this.style.setProperty('--qw-qc-box', `${box}px`)
    svg!.setAttribute('viewBox', `0 0 ${box} ${box}`)
    for (const circle of [disc!, rim!, outline!]) { circle.setAttribute('cx', String(center)); circle.setAttribute('cy', String(center)) }
    disc!.setAttribute('r', String(fill))
    rim!.setAttribute('r', String(Math.max(0, fill - 0.5))); rim!.setAttribute('stroke-width', '1'); rim!.style.display = fill >= 1.5 ? '' : 'none'
    needle!.setAttribute('x1', String(center)); needle!.setAttribute('y1', String(center))
    needle!.setAttribute('x2', String(center - Math.sin(phase) * inner)); needle!.setAttribute('y2', String(center - Math.cos(phase) * inner)); needle!.setAttribute('stroke-width', String(stroke))
    needle!.style.display = magnitude === 0 || this.flag('data-hide-phase') ? 'none' : ''
    outline!.setAttribute('r', String(radius)); outline!.setAttribute('stroke-width', String(stroke)); outline!.setAttribute('stroke', magnitude === 0 ? '#DAD8CE' : '#6F6E69')
    this.setAttribute('aria-label', this.valid ? `${this.ketLabel()}、振幅 ${this.amplitudeText()}、確率 ${signed(this.probability(), 4)}%、位相 ${signed(this.phaseDegrees(), 2)}°` : '振幅が不正です')
    if (active === this) showTooltip(this)
  }
  private amplitudeText() { return `${signed(this.real, 5)} ${signed(this.imag, 5)}i` }
  private probability() { return Math.hypot(this.real, this.imag) ** 2 * 100 }
  private phaseDegrees() { return this.real === 0 && this.imag === 0 ? 0 : Math.atan2(this.imag, this.real) * 180 / Math.PI }
  private ketLabel() {
    const ket = Number(this.getAttribute('data-ket') ?? 0), count = Number(this.getAttribute('data-qubit-count') ?? 1)
    return `|${(Number.isSafeInteger(ket) && ket >= 0 ? ket : 0).toString(2).padStart(Math.max(1, Math.min(32, Number.isFinite(count) ? Math.floor(count) : 1)), '0')}⟩`
  }
  tooltipText() {
    if (!this.valid) return '振幅が不正です'
    const flags = ['amplitude', 'probability', 'phase']
    const explicit = flags.some(name => this.hasAttribute(`data-show-popup-${name}`))
    const rows: string[] = []
    if (this.flag('data-show-popup-header')) rows.push(`${this.ketLabel()} (${this.getAttribute('data-ket') ?? '0'})`)
    if (!explicit || this.flag('data-show-popup-amplitude')) rows.push(`振幅: ${this.amplitudeText()}`)
    if (!explicit || this.flag('data-show-popup-probability')) rows.push(`確率: ${signed(this.probability(), 4)}%`)
    if (!explicit || this.flag('data-show-popup-phase')) rows.push(`位相: ${signed(this.phaseDegrees(), 2)}°`)
    return rows.join('\n')
  }
}

if (!customElements.get('qw-qubit-circle')) {
  document.addEventListener('pointerover', event => { const circle = targetCircle(event.target); if (circle && circle !== active) showTooltip(circle) })
  document.addEventListener('pointerout', event => { const circle = targetCircle(event.target); if (circle && circle === active && targetCircle(event.relatedTarget) !== circle) hideTooltip() })
  document.addEventListener('focusin', event => { const circle = targetCircle(event.target); if (circle) showTooltip(circle) })
  document.addEventListener('focusout', event => { if (targetCircle(event.target) === active) hideTooltip() })
  document.addEventListener('keydown', event => { if (event.key === 'Escape') hideTooltip() })
  document.addEventListener('scroll', hideTooltip, true)
  performance.mark('qw-qc-define-start')
  customElements.define('qw-qubit-circle', QwQubitCircle)
  performance.mark('qw-qc-last-connected', { startTime: lastConnectedTime || performance.now() })
  performance.mark('qw-qc-define-end')
}
