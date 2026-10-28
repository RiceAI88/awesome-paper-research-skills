import {test,expect} from '@playwright/test';
test('tab selection slides one shared background and hover stays quiet',async({page})=>{
 await page.emulateMedia({reducedMotion:'no-preference'});await page.goto('./');
 const tabs=page.locator('.page-tabs');const buttons=tabs.getByRole('tab');
 await expect(tabs).toHaveAttribute('data-section','ranking');
 const before=await tabs.evaluate(el=>getComputedStyle(el,'::before').transform);
 await buttons.nth(1).hover();
 await expect(buttons.nth(1)).toHaveCSS('background-color','rgba(0, 0, 0, 0)');
 await expect(buttons.nth(1)).toHaveCSS('border-top-width','0px');
 await tabs.evaluate(el => {
   window.__tabSlidePositions=[];
   const until=performance.now()+650;
   const sample=()=>{ window.__tabSlidePositions.push(new DOMMatrixReadOnly(getComputedStyle(el,'::before').transform).m41); if(performance.now()<until)requestAnimationFrame(sample); };
   requestAnimationFrame(sample);
 });
 await buttons.nth(1).click();
 await expect.poll(()=>page.evaluate(()=>new Set(window.__tabSlidePositions.map(x=>Math.round(x))).size)).toBeGreaterThan(3);
 await expect(tabs).toHaveAttribute('data-section','insights');
 await expect.poll(()=>tabs.evaluate(el=>Number.parseFloat(getComputedStyle(el,'::before').transitionDuration))).toBeGreaterThan(0);
 await expect.poll(()=>tabs.evaluate(el=>new DOMMatrixReadOnly(getComputedStyle(el,'::before').transform).m41)).toBeGreaterThan(30);
 await expect(buttons.nth(1)).toHaveAttribute('aria-selected','true');
 await buttons.nth(0).click();await buttons.nth(1).click();await buttons.nth(0).click();
 await expect.poll(()=>tabs.evaluate(el=>new DOMMatrixReadOnly(getComputedStyle(el,'::before').transform).m41)).toBe(0);
 expect(before).toBe('matrix(1, 0, 0, 1, 0, 0)');
});
test('equal-width tabs keep the indicator aligned in English and support keyboard selection',async({page})=>{
 await page.goto('./#lang=en');const tabs=page.locator('.page-tabs');const buttons=tabs.getByRole('tab');
 const first=await buttons.nth(0).boundingBox();const second=await buttons.nth(1).boundingBox();expect(first.width).toBeCloseTo(second.width,1);
 await buttons.nth(0).focus();await page.keyboard.press('ArrowRight');await expect(buttons.nth(1)).toBeFocused();await expect(buttons.nth(1)).toHaveAttribute('aria-selected','true');
 await page.keyboard.press('Home');await expect(buttons.nth(0)).toBeFocused();await expect(buttons.nth(0)).toHaveAttribute('aria-selected','true');
});
test('reduced motion switches directly without sliding',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});await page.goto('./');
 const tabs=page.locator('.page-tabs');await tabs.getByRole('tab').nth(1).click();
 expect(await tabs.evaluate(el=>getComputedStyle(el,'::before').transitionDuration)).toBe('0s');
});
