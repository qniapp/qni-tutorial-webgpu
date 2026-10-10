import {test,expect} from '@playwright/test'
for(const width of [1440,390]) {
 test(`interactive plots, sphere and matrix illustrations at ${width}`,async({page})=>{
  await page.setViewportSize({width,height:1000})
  await page.goto('/qni-tutorial-webgpu/qubit/')
  await expect(page.locator('main img')).toHaveCount(0)
  const graph=page.locator('[data-state-plot="probability"] svg')
  const before=await graph.getAttribute('aria-valuetext');await graph.focus();await page.keyboard.press('ArrowRight');expect(await graph.getAttribute('aria-valuetext')).not.toEqual(before)
  const sphere=page.locator('bloch-display svg');const s=await sphere.innerHTML();await sphere.focus();await page.keyboard.press('ArrowRight');expect(await sphere.innerHTML()).not.toEqual(s)
  await page.goto('/qni-tutorial-webgpu/phase/')
  const target=page.locator('[data-amplification-diagram] qubit-circle').first();await target.click();await expect(target).toHaveAttribute('data-amplitude','-0.25')
  await expect(page.locator('[data-amplification-diagram] .states').last().locator('qubit-circle').first()).toHaveAttribute('data-amplitude','-0.98')
  await page.goto('/qni-tutorial-webgpu/what_qpu_do_faster/')
  await page.waitForFunction(()=>document.documentElement.dataset.mathjax==='ready')
  await expect(page.locator('.matrix-illustration')).toHaveCount(4)
  await expect(page.locator('mjx-merror')).toHaveCount(0)
  expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(width)
  await page.goto('/qni-tutorial-webgpu/cpu_vs_qpu_operations/')
  const logic=page.locator('[data-logic-illustration] svg');await logic.focus();await page.keyboard.press('Enter');await expect(logic.locator('[data-and]')).toHaveText('1');await expect(logic.locator('[data-not-out]')).toHaveText('0')
 })
}
