import {test,expect} from '@playwright/test'
for(const width of [1440,390]) {
 test(`X is circular in prose, illustrations and connected circuits at ${width}`,async({page})=>{
  await page.setViewportSize({width,height:1000})
  for(const path of ['x_gate','quantum_circuit','qni_intro']) {
   await page.goto(`/qni-tutorial-webgpu/${path}/`)
   await expect(page.locator('x-gate').first()).toBeVisible()
   const xs=await page.locator('x-gate').evaluateAll(es=>es.map(e=>{const s=getComputedStyle(e),r=e.getBoundingClientRect();return {width:r.width,height:r.height,radius:s.borderRadius,background:s.backgroundColor,paths:e.querySelectorAll('svg path').length}}))
   for(const x of xs){expect(x.width).toEqual(x.height);expect(x.radius).toBe('50%');expect(x.background).toBe('rgb(58, 169, 159)');expect(x.paths).toBe(1)}
  }
 })
 test(`gate body families and native primitive geometry at ${width}`,async({page})=>{
  await page.setViewportSize({width,height:1000});await page.goto('/qni-tutorial-webgpu/quantum_circuit/')
  for(const tag of ['h-gate','y-gate','z-gate','phase-gate','write-gate','measurement-gate','control-gate','swap-gate']) {
   // Y/Z live in the Qni introduction palette rather than this table.
   if(tag==='y-gate'||tag==='z-gate')continue
   const e=page.locator(tag).first();await expect(e).toBeVisible()
   const s=await e.evaluate(e=>{const s=getComputedStyle(e);return{radius:s.borderRadius,bg:s.backgroundColor}})
   if(tag==='h-gate'){expect(s.radius).not.toBe('50%');expect(s.bg).toBe('rgb(58, 169, 159)')}
   else if(tag==='phase-gate'){expect(s.radius).toBe('50%');expect(s.bg).toBe('rgb(58, 169, 159)')}
   else expect(s.bg).toBe('rgba(0, 0, 0, 0)')
  }
  await expect(page.locator('control-gate circle').first()).toHaveAttribute('r','8')
  await expect(page.locator('swap-gate path').first()).toHaveAttribute('stroke-width','4')
  await expect(page.locator('swap-gate path').first()).toHaveAttribute('stroke-linecap','round')
  await expect(page.locator('measurement-gate circle').first()).toHaveAttribute('r','3.5')
  expect(await page.locator('measurement-gate [vector-effect]').count()).toBe(0)
  await expect(page.locator('write-gate').first()).toHaveAttribute('data-value','0')
  await expect(page.locator('write-gate').nth(1)).toHaveAttribute('data-value','1')
  await page.goto('/qni-tutorial-webgpu/qni_intro/')
  for(const tag of ['y-gate','z-gate']) {
    const s=await page.locator(tag).first().evaluate(e=>{const s=getComputedStyle(e);return {radius:s.borderRadius,background:s.backgroundColor,width:e.getBoundingClientRect().width}})
    expect(parseFloat(s.radius)).toBeCloseTo(s.width*0.15)
    expect(s.background).toBe('rgb(58, 169, 159)')
  }
  expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(width)
 })
}
