import {expect,test} from '@playwright/test'
for(const dpr of [1,2])test.describe(`inline X DPR ${dpr}`,()=>{
 test.use({deviceScaleFactor:dpr})
 for(const width of [1440,390])test(`bold prose only at ${width}`,async({page})=>{
  await page.setViewportSize({width,height:1000});await page.goto('/qni-tutorial-webgpu/x_gate/')
  const prose=page.locator('p x-gate')
  expect(await prose.count()).toBeGreaterThan(0)
  for(const x of await prose.all()) {
   await expect(x).toHaveAttribute('data-glyph','bold')
   await expect(x.locator('svg')).toHaveAttribute('data-font-weight','700')
   expect(await x.evaluate(e=>({width:e.getBoundingClientRect().width,height:e.getBoundingClientRect().height,radius:getComputedStyle(e).borderRadius,color:getComputedStyle(e).color}))).toEqual({width:16,height:16,radius:'50%',color:'rgb(255, 252, 240)'})
   expect(await x.locator('[stroke]').count()).toBe(0)
  }
  const figures=page.locator('.relative.h-8 x-gate')
  expect(await figures.count()).toBeGreaterThan(0)
  for(const x of await figures.all()) {
   await expect(x).toHaveAttribute('data-glyph','regular')
   expect(await x.locator('[data-font-weight]').count()).toBe(0)
  }
  // Reconnection is a context change, not a permanently latched glyph.
  const result=await page.evaluate(()=>{
   const p=document.createElement('p'),figure=document.createElement('figure'),x=document.createElement('x-gate')
   document.querySelector('main')!.append(p,figure);p.append(x)
   const bold=x.dataset.glyph;figure.append(x);const regular=x.dataset.glyph;p.append(x);const boldAgain=x.dataset.glyph
   p.remove();figure.remove();return{bold,regular,boldAgain}
  })
  expect(result).toEqual({bold:'bold',regular:'regular',boldAgain:'bold'})
 })
})
