import {test,expect} from '@playwright/test';
test('scene clicks do not create a rectangular wave while the underline still moves',async({page})=>{
 await page.addInitScript(()=>{
  window.__sceneWave=false;
  new MutationObserver(()=>{if(document.querySelector('.task-list .ant-wave'))window.__sceneWave=true;}).observe(document,{subtree:true,childList:true});
 });
 await page.goto('./');
 await page.locator('[data-task="find"]').click();
 await page.waitForTimeout(250);
 expect(await page.evaluate(()=>window.__sceneWave)).toBe(false);
 await expect(page.locator('[data-task="find"]')).toHaveAttribute('aria-pressed','true');
 await expect(page.locator('.task-selection-indicator')).toBeVisible();
 await expect.poll(async()=>{
  const a=await page.locator('.task-selection-indicator').boundingBox(),b=await page.locator('[data-task="find"]').boundingBox();
  return Math.abs(a.x-b.x);
 }).toBeLessThan(.5);
 await page.locator('[data-task="all"]').focus();await page.keyboard.press('Tab');
 await expect(page.locator('[data-task="find"]')).toBeFocused();
 await expect(page.locator('[data-task="find"]')).toHaveCSS('outline-style','solid');
});
