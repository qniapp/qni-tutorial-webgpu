import { svg, pin } from 'virtual:h-gate-icon'
import './h-gate.css'

export class HGate extends HTMLElement {
  connectedCallback() {
    if (!this.querySelector('svg')) this.innerHTML = svg
    this.setAttribute('role', 'img')
    this.setAttribute('aria-label', 'H ゲート')
    this.title = 'H ゲート'
    this.dataset.sourceSha = pin
  }
}
if (!customElements.get('h-gate')) customElements.define('h-gate', HGate)
