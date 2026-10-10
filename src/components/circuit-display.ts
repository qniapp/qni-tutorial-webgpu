// Display-only original Qni tags. No editor state, drag/drop or simulation.
import './circuit-display.css'
import plus from '../assets/gates/plus.svg?raw'
import boldPlus from '../assets/plus-bold.svg?raw'
import phase from '../assets/gates/p.svg?raw'
import y from '../assets/gates/y.svg?raw'
import z from '../assets/gates/z.svg?raw'
import zero from '../assets/gates/digit0.svg?raw'
import one from '../assets/gates/digit1.svg?raw'
import meter from '../assets/gates/measurement.svg?raw'
import wires from '../assets/circuit-wires.svg?raw'

const svg = (content: string) => `<svg viewBox="0 0 48 48" aria-hidden="true" focusable="false">${content}</svg>`
const icons: Record<string, string> = {
  'x-gate': plus, 'y-gate': y, 'z-gate': z, 'phase-gate': phase,
  'control-gate': svg('<circle cx="24" cy="24" r="8" fill="currentColor"/>'),
  'swap-gate': svg('<path d="M12 36 36 12M12 12l24 24" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>'),
  'measurement-gate': meter,
}
for (const [tag, icon] of Object.entries(icons)) {
  if (!customElements.get(tag)) customElements.define(tag, class extends HTMLElement {
    connectedCallback() {
      if (tag === 'x-gate') {
        const prose = this.closest('p') !== null && this.closest('figure, circuit-step, circuit-dropzone, .qc-operation, [data-original-image]') === null
        const glyph = prose ? 'bold' : 'regular'
        if (this.dataset.glyph !== glyph || !this.querySelector('svg')) this.innerHTML = prose ? boldPlus : icon
        this.dataset.glyph = glyph
      } else if (!this.querySelector('svg')) this.innerHTML = icon
      this.querySelector('svg')?.setAttribute('aria-hidden', 'true')
      // Native meter strokes scale with its 48px viewBox, unlike the old
      // non-scaling SVG strokes. Keep the geometry but use native scaling.
      if (tag === 'measurement-gate') {
        this.querySelectorAll('[vector-effect]').forEach(e => e.removeAttribute('vector-effect'))
        // Native draw_meter_icon uses a filled pivot of radius 3.5, rather
        // than the legacy 1.875-radius path with an outset stroke.
        const icon = this.querySelector('svg')!
        const legacyPivot = icon.querySelector('path[fill="currentColor"]')
        if (legacyPivot) {
          const pivot = document.createElementNS('http://www.w3.org/2000/svg', 'circle')
          for (const [name, value] of Object.entries({ cx:'24.625', cy:'33.5', r:'3.5', fill:'currentColor' })) pivot.setAttribute(name, value)
          legacyPivot.replaceWith(pivot)
        }
      }
      this.setAttribute('role', 'img')
      this.setAttribute('aria-label', tag.replace('-gate', '') + ' ゲート')
    }
  })
}
if (!customElements.get('write-gate')) customElements.define('write-gate', class extends HTMLElement {
  static observedAttributes = ['data-value']
  connectedCallback() { this.render() }
  attributeChangedCallback() { if (this.isConnected) this.render() }
  private render() {
    const value = this.getAttribute('data-value') === '1' ? '1' : '0'
    this.innerHTML = svg('<path d="M6 5v38M37.4516 5 43.5 24 37.4516 43" fill="none" stroke="currentColor" stroke-width="2"/>') + (value === '1' ? one : zero)
    this.querySelectorAll('svg').forEach(e => e.setAttribute('aria-hidden', 'true'))
    this.setAttribute('role', 'img'); this.setAttribute('aria-label', `WRITE ${value}`)
  }
})
if (!customElements.get('circuit-step')) customElements.define('circuit-step', class extends HTMLElement {})
// Bare, authored circuit-step diagrams only. JSON/editor embeds use
// qni-webgpu-circuit instead, so this element never owns simulation state.
if (!customElements.get('quantum-circuit')) customElements.define('quantum-circuit', class extends HTMLElement {
  connectedCallback() {
    let quantum = false
    for (const zone of this.querySelectorAll('circuit-dropzone')) {
      const operation = [...zone.children].find(e => e.localName.endsWith('-gate'))
      if (!operation) continue
      zone.setAttribute('data-operation-name', operation.localName)
      if (quantum) zone.setAttribute('data-input-wire-quantum', '')
      quantum = operation.localName !== 'measurement-gate'
      if (quantum) zone.setAttribute('data-output-wire-quantum', '')
    }
  }
})
if (!customElements.get('circuit-dropzone')) customElements.define('circuit-dropzone', class extends HTMLElement {
  connectedCallback() {
    if (!this.querySelector('.circuit-wires')) {
      const template = document.createElement('template'); template.innerHTML = wires
      // The source uses IDs inside Shadow DOM; light-DOM copies must not
      // duplicate document IDs. Styling targets the original part names.
      template.content.querySelectorAll('[id]').forEach(e => e.removeAttribute('id'))
      template.content.querySelector('svg')!.classList.add('circuit-wires')
      template.content.querySelector('svg')!.setAttribute('aria-hidden', 'true')
      this.prepend(template.content)
    }
  }
})
