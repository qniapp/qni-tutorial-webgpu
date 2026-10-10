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
import { isInlineProse } from './inline-glyph-context'
import s from '../assets/gates/s.svg?raw'
import sd from '../assets/gates/sdagger.svg?raw'
import t from '../assets/gates/t.svg?raw'
import td from '../assets/gates/tdagger.svg?raw'
import sqrtx from '../assets/gates/sqrtx.svg?raw'
import rx from '../assets/gates/rx.svg?raw'
import ry from '../assets/gates/ry.svg?raw'
import rz from '../assets/gates/rz.svg?raw'
import qft from '../assets/gates/qft.svg?raw'
import qftd from '../assets/gates/qftdagger.svg?raw'
import boldY from '../assets/gates/bold/y.svg?raw'
import boldZ from '../assets/gates/bold/z.svg?raw'
import boldP from '../assets/gates/bold/p.svg?raw'
import boldS from '../assets/gates/bold/s.svg?raw'
import boldSd from '../assets/gates/bold/sdagger.svg?raw'
import boldT from '../assets/gates/bold/t.svg?raw'
import boldTd from '../assets/gates/bold/tdagger.svg?raw'
import boldSqrtx from '../assets/gates/bold/sqrtx.svg?raw'
import boldRx from '../assets/gates/bold/rx.svg?raw'
import boldRy from '../assets/gates/bold/ry.svg?raw'
import boldRz from '../assets/gates/bold/rz.svg?raw'
import boldQft from '../assets/gates/bold/qft.svg?raw'
import boldQftd from '../assets/gates/bold/qftdagger.svg?raw'
import boldZero from '../assets/gates/bold/digit0.svg?raw'
import boldOne from '../assets/gates/bold/digit1.svg?raw'

const svg = (content: string) => `<svg viewBox="0 0 48 48" aria-hidden="true" focusable="false">${content}</svg>`
const icons: Record<string, string> = {
  'x-gate': plus, 'y-gate': y, 'z-gate': z, 'phase-gate': phase,
  'control-gate': svg('<circle cx="24" cy="24" r="8" fill="currentColor"/>'),
  'swap-gate': svg('<path d="M12 36 36 12M12 12l24 24" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>'),
  'measurement-gate': meter,
  's-gate': s, 's-dagger-gate': sd, 't-gate': t, 't-dagger-gate': td,
  'rnot-gate': sqrtx, 'rx-gate': rx, 'ry-gate': ry, 'rz-gate': rz,
  'qft-gate': qft, 'qft-dagger-gate': qftd,
}
const boldIcons: Record<string, string> = {
  'x-gate': boldPlus, 'y-gate': boldY, 'z-gate': boldZ, 'phase-gate': boldP,
  's-gate': boldS, 's-dagger-gate': boldSd, 't-gate': boldT, 't-dagger-gate': boldTd,
  'rnot-gate': boldSqrtx, 'rx-gate': boldRx, 'ry-gate': boldRy, 'rz-gate': boldRz,
  'qft-gate': boldQft, 'qft-dagger-gate': boldQftd,
  'control-gate': svg('<circle cx="24" cy="24" r="10" fill="currentColor"/>'),
  'swap-gate': icons['swap-gate'].replace('stroke-width="4"', 'stroke-width="6"'),
  'measurement-gate': meter.replaceAll('stroke-width="2"', 'stroke-width="3"'),
}
for (const [tag, icon] of Object.entries(icons)) {
  if (!customElements.get(tag)) customElements.define(tag, class extends HTMLElement {
    connectedCallback() {
      const prose = isInlineProse(this)
      const glyph = prose ? 'bold' : 'regular'
      if (this.dataset.glyph !== glyph || !this.querySelector('svg')) this.innerHTML = prose ? boldIcons[tag] : icon
      this.dataset.glyph = glyph
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
    const prose = isInlineProse(this)
    this.dataset.glyph = prose ? 'bold' : 'regular'
    this.innerHTML = svg(`<path d="M6 5v38M37.4516 5 43.5 24 37.4516 43" fill="none" stroke="currentColor" stroke-width="${prose ? 3 : 2}"/>`) + (value === '1' ? (prose ? boldOne : one) : (prose ? boldZero : zero))
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
