for (const root of document.querySelectorAll<HTMLElement>('[data-state-plot]')) {
  const svg = root.querySelector('svg')!
  const layer = root.querySelector('[data-plot-content]')!
  const kind = root.dataset.statePlot
  let value = kind === 'argument' ? Math.PI/4 : kind === 'amplitude' ? 0.6 : 0.5
  const paint = () => {
    let x: number, y: number, drawing: string
    if (kind === 'probability') {
      x=40+260*value; y=260-235*(1-value)
      drawing='<path d="M40 25 L300 260" fill="none" stroke="#4385BE" stroke-width="3" />'
      if (root.dataset.classical === 'true') drawing+='<circle cx="40" cy="25" r="5" fill="#AF3029"/><circle cx="300" cy="260" r="5" fill="#AF3029"/>'
      svg.setAttribute('aria-valuetext',`p₀=${value.toFixed(3)}, p₁=${(1-value).toFixed(3)}`)
    } else if (kind === 'amplitude') {
      x=180+105*Math.cos(value); y=150-105*Math.sin(value)
      drawing='<path d="M50 150 H310 M180 275 V25" fill="none" stroke="#6F6E69"/><circle cx="180" cy="150" r="105" fill="none" stroke="#AF3029" stroke-width="2"/><text x="307" y="145">a₀</text><text x="190" y="26">a₁</text>'
      svg.setAttribute('aria-valuetext',`a₀=${Math.cos(value).toFixed(3)}, a₁=${Math.sin(value).toFixed(3)}`)
    } else {
      x=40+190*Math.cos(value); y=260-190*Math.sin(value)
      const ax=40+55*Math.cos(value), ay=260-55*Math.sin(value)
      drawing=`<path d="M40 260 L${x} ${y}" fill="none" stroke="#4385BE" stroke-width="2" stroke-dasharray="5 5"/><path d="M95 260 A55 55 0 0 0 ${ax} ${ay}" fill="none" stroke="#AF3029" stroke-width="2"/><text x="${x+8}" y="${y-8}">a, b</text><text x="100" y="235">偏角</text>`
      svg.setAttribute('aria-valuetext',`偏角=${(value*180/Math.PI).toFixed(1)}°`)
    }
    layer.innerHTML=drawing+`<circle cx="${x}" cy="${y}" r="6" fill="#3AA99F" stroke="#100F0F" stroke-width="1"/>`
    svg.setAttribute('aria-valuenow',String(value))
  }
  const move = (e: PointerEvent) => {
    const p=svg.createSVGPoint(); p.x=e.clientX; p.y=e.clientY
    const pos=p.matrixTransform(svg.getScreenCTM()!.inverse())
    if(kind==='probability')value=Math.max(0,Math.min(1,(pos.x-40)/260))
    else if(kind==='amplitude')value=Math.atan2(150-pos.y,pos.x-180)
    else value=Math.max(0.05,Math.min(Math.PI/2-0.05,Math.atan2(260-pos.y,pos.x-40)))
    paint()
  }
  svg.addEventListener('pointerdown',e=>{svg.setPointerCapture(e.pointerId);move(e)})
  svg.addEventListener('pointermove',e=>{if(svg.hasPointerCapture(e.pointerId))move(e)})
  svg.addEventListener('keydown',e=>{
    if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key))return
    e.preventDefault();value+=['ArrowRight','ArrowUp'].includes(e.key)?0.025:-0.025
    if(kind==='probability')value=Math.max(0,Math.min(1,value))
    if(kind==='argument')value=Math.max(0.05,Math.min(Math.PI/2-0.05,value))
    paint()
  })
  paint()
}
