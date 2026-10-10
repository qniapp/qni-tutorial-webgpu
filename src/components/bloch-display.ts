type Vec=[number,number,number]
class BlochDisplay extends HTMLElement {
  static observedAttributes=['data-x','data-y','data-z']
  private yaw=-0.7
  private pitch=0.25
  private svg:SVGSVGElement|null=null
  private last:[number,number]|null=null
  connectedCallback(){
    if(this.svg)return
    this.innerHTML='<svg viewBox="0 0 360 340" tabindex="0" role="img" aria-label="ブロッホ球。ドラッグまたは矢印キーで視点を回転"></svg>'
    this.svg=this.querySelector('svg')!
    this.svg.addEventListener('pointerdown',e=>{this.last=[e.clientX,e.clientY];this.svg!.setPointerCapture(e.pointerId)})
    this.svg.addEventListener('pointermove',e=>{if(!this.last||!this.svg!.hasPointerCapture(e.pointerId))return;this.yaw+=(e.clientX-this.last[0])/130;this.pitch=Math.max(-1.3,Math.min(1.3,this.pitch+(e.clientY-this.last[1])/130));this.last=[e.clientX,e.clientY];this.paint()})
    this.svg.addEventListener('pointerup',()=>{this.last=null})
    this.svg.addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key))return;e.preventDefault();this.yaw+=e.key==='ArrowLeft'?-0.08:e.key==='ArrowRight'?0.08:0;this.pitch=Math.max(-1.3,Math.min(1.3,this.pitch+(e.key==='ArrowUp'?-0.08:e.key==='ArrowDown'?0.08:0)));this.paint()})
    this.paint()
  }
  attributeChangedCallback(){this.paint()}
  private project([x,y,z]:Vec):[number,number]{
    const a=x*Math.cos(this.yaw)-y*Math.sin(this.yaw),d=x*Math.sin(this.yaw)+y*Math.cos(this.yaw)
    return [180+120*a,170-120*(z*Math.cos(this.pitch)-d*Math.sin(this.pitch))]
  }
  private path(points:Vec[]){return points.map((v,i)=>{const[x,y]=this.project(v);return `${i?'L':'M'}${x.toFixed(2)} ${y.toFixed(2)}`}).join(' ')}
  private paint(){
    if(!this.svg)return
    let html='<circle cx="180" cy="170" r="120" fill="#DAD8CE" fill-opacity="0.25" stroke="#6F6E69" stroke-width="1"/>'
    for(let j=0;j<6;j++){
      const phi=j*Math.PI/6,points:Vec[]=[]
      for(let i=0;i<=64;i++){const a=i*2*Math.PI/64;points.push([Math.sin(a)*Math.cos(phi),Math.sin(a)*Math.sin(phi),Math.cos(a)])}
      html+=`<path d="${this.path(points)}" fill="none" stroke="#6F6E69" stroke-opacity="0.4"/>`
    }
    for(const z of [-0.5,0,0.5]){const r=Math.sqrt(1-z*z),points:Vec[]=[];for(let i=0;i<=64;i++){const a=i*2*Math.PI/64;points.push([r*Math.cos(a),r*Math.sin(a),z])}html+=`<path d="${this.path(points)}" fill="none" stroke="#6F6E69" stroke-opacity="0.4"/>`}
    for(const[v,label]of [[[1,0,0],'x'],[[0,1,0],'y'],[[0,0,1],'|0⟩'],[[0,0,-1],'|1⟩']] as [Vec,string][]){const[x,y]=this.project(v);html+=`<text x="${x}" y="${y+(label==='|0⟩'?-14:22)}" text-anchor="middle" fill="#100F0F" font-size="16">${label}</text>`}
    if(this.dataset.mode==='h-rotation'){
      for(let half=0;half<2;half++){const pts:Vec[]=[];for(let i=0;i<=32;i++){const a=(half+i/32)*Math.PI;pts.push([(1-Math.cos(a))/2,-Math.sin(a)/Math.sqrt(2),(1+Math.cos(a))/2])}html+=`<path d="${this.path(pts)}" fill="none" stroke="${half?'#4385BE':'#AF3029'}" stroke-width="3"/>`;for(let i=4;i<32;i+=4)html+=`<path d="${this.path([[0,0,0],pts[i]!])}" fill="none" stroke="${half?'#4385BE':'#AF3029'}" stroke-opacity="0.5"/>`}
      html+=`<path d="${this.path([[0,0,0],[Math.SQRT1_2,0,Math.SQRT1_2]])}" stroke="#100F0F" stroke-width="3" fill="none"/>`
    }else{
      const v:Vec=[Number(this.dataset.x)||0,Number(this.dataset.y)||0,Number(this.dataset.z)||0], [x,y]=this.project(v)
      html+=`<path d="M180 170 L${x} ${y}" stroke="#3AA99F" stroke-width="3"/><circle cx="${x}" cy="${y}" r="4" fill="#3AA99F"/>`
    }
    this.svg.innerHTML=html
  }
}
if(!customElements.get('bloch-display'))customElements.define('bloch-display',BlochDisplay)
