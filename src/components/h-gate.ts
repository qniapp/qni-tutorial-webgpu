import { svg, pin } from 'virtual:h-gate-icon'
import './h-gate.css'
import boldSvg from '../assets/h-bold.svg?raw'

export class HGate extends HTMLElement {
  connectedCallback() {
    const inline = this.closest('p') !== null && this.closest('.qc-operation') === null
    const glyph = inline ? 'bold' : 'regular'
    if (this.dataset.glyph !== glyph || !this.querySelector('svg')) {
      this.innerHTML = inline ? boldSvg : svg
      this.dataset.glyph = glyph
    }
    this.setAttribute('role', 'img')
    this.setAttribute('aria-label', 'H ゲート')
    this.title = 'H ゲート'
    this.dataset.sourceSha = pin
  }
}
if (!customElements.get('h-gate')) customElements.define('h-gate', HGate)
