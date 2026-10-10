/** Fit static, indivisible diagrams/equations without cropping or inner scrolling. */
class FitContent extends HTMLElement {
  private content?: HTMLSpanElement
  private observer = new ResizeObserver(() => this.fit())

  connectedCallback() {
    if (!this.content) {
      this.content = document.createElement('span')
      this.content.className = 'fitted-content'
      this.content.append(...this.childNodes)
      this.append(this.content)
    }
    this.observer.observe(this)
    this.observer.observe(this.content)
    this.fit()
  }

  disconnectedCallback() { this.observer.disconnect() }

  private fit() {
    if (!this.content || !this.clientWidth) return
    const naturalWidth = this.content.scrollWidth
    if (!naturalWidth) return
    const scale = Math.min(1, this.clientWidth / naturalWidth)
    const zoom = String(scale)
    if (this.content.style.zoom !== zoom) this.content.style.zoom = zoom
  }
}

if (!customElements.get('fit-content')) customElements.define('fit-content', FitContent)
export {}
