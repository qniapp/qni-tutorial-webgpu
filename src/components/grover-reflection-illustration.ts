// The original coordinates stay fixed. Interaction inspects each state's
// coordinates across all five stages; it does not simulate or alter the state.
const roots = [...document.querySelectorAll<HTMLElement>('[data-grover-reflection]')]
function inspect(index: number) {
  const initial = index === 3 ? -0.5 : 0.5
  const reflected = index === 3 ? 1 : 0
  for (const root of roots) {
    const stage = Number(root.dataset.stage)
    root.dataset.selected = String(index)
    root.querySelectorAll<SVGGElement>('[data-state]').forEach((state, i) => state.setAttribute('aria-pressed', String(i === index)))
    const output = root.querySelector('output')!
    output.hidden = false
    const amplitude = stage < 3 ? initial : reflected
    const detail = stage === 0 ? `座標 [0, ${initial}]`
      : stage === 1 ? '平均座標 [0, 0.25]'
      : stage === 2 ? `元の座標 [0, ${initial}] / 平均 [0, 0.25] / 反射後 [0, ${reflected}]`
      : `座標 [0, ${reflected}]`
    output.textContent = `状態${index.toString(2).padStart(2, '0')}: ${detail}` + (stage === 1 || stage === 2 ? '' : ` / 振幅 ${amplitude} / 確率 ${amplitude * amplitude * 100}%`)
  }
}
function reset() {
  for (const root of roots) {
    delete root.dataset.selected
    root.querySelector('output')!.hidden = true
    root.querySelectorAll('[data-state]').forEach(state => state.setAttribute('aria-pressed', 'false'))
  }
}
for (const root of roots) {
  root.querySelectorAll<SVGGElement>('[data-state]').forEach((state, index) => {
    state.setAttribute('aria-pressed', 'false')
    state.addEventListener('click', () => inspect(index))
    state.addEventListener('keydown', event => {
      if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); inspect(index) }
      if (event.key === 'Escape') { event.preventDefault(); reset() }
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        event.preventDefault()
        const next = (index + (event.key === 'ArrowLeft' ? 3 : 1)) % 4
        inspect(next)
        root.querySelectorAll<SVGGElement>('[data-state]')[next].focus()
      }
    })
  })
}
