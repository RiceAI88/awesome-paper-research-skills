import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
const dataset=JSON.parse(readFileSync(new URL('../../data/rankings.json',import.meta.url),'utf8'));
async function fixture(page){
 const now=new Date().toISOString();
 const item={...dataset.items[0],repo:'test/research-skill',url:'https://github.com/test/research-skill',repository_kind:'skill',skills_count:1,first_seen_at:now,first_seen_date:now.slice(0,10),first_seen_is_baseline:false,stale:true,last_push_date:'2026-01-01'};
 await page.route('**/data/rankings.js*',route=>route.fulfill({contentType:'application/javascript',body:`window.ACADEMIC_SKILLS_RANKINGS=${JSON.stringify({metadata:{...dataset.metadata,generated_at:now},items:[item]})};`}));
}
test('cards show one arrival dot and factual maintenance text; table uses a short new label',async({page})=>{
 await fixture(page);await page.goto('./#view=card');
 const card=page.getByTestId('repo-card').first();
 await expect(card.locator('.card-top .arrival-dot')).toHaveCount(1);
 await expect(card.locator('.daily-new-badge')).toHaveCount(0);
 await expect(card.locator('.card-maintenance')).toHaveCount(1);
 await page.goto('./#view=table');
 await expect(page.locator('.ant-table-row .daily-new-badge')).toHaveCount(1);
});
async function observeHero(page){
 await page.addInitScript(()=>{
  window.__heroMoved=false;
  const start=performance.now();
  const sample=()=>{
   const el=document.querySelector('[data-motion="hero"]');
   if(el && getComputedStyle(el).transform!=='none' && Math.abs(new DOMMatrixReadOnly(getComputedStyle(el).transform).m42)>0.1)window.__heroMoved=true;
   if(performance.now()-start<1600)requestAnimationFrame(sample);
  };
  requestAnimationFrame(sample);
 });
}
test('Motion animates hero and cards, then settles without replaying on language changes',async({page})=>{
 await page.emulateMedia({reducedMotion:'no-preference'});await observeHero(page);await fixture(page);await page.goto('./');
 const hero=page.locator('[data-motion="hero"]').first();
 await expect(hero).toHaveCSS('opacity','1');
 await expect.poll(()=>page.evaluate(()=>window.__heroMoved)).toBe(true);
 await expect(hero).toHaveCSS('transform','none');
 const card=page.getByTestId('repo-card').first();await expect(card).toHaveAttribute('data-motion','card');await expect(card).toHaveCSS('transform','none');
 await card.hover();
 await expect.poll(()=>card.evaluate(el=>new DOMMatrixReadOnly(getComputedStyle(el).transform).m42)).toBeLessThan(-1);
 await page.getByText('EN',{exact:true}).click();
 await expect(hero).toHaveCSS('transform','none');
});
test('reduced motion keeps content visible immediately and skips entrance and hover movement',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});await observeHero(page);await fixture(page);await page.goto('./');
 const hero=page.locator('[data-motion="hero"]').first();await expect(hero).toHaveCSS('opacity','1');await expect(hero).toHaveCSS('transform','none');
 const card=page.getByTestId('repo-card').first();await card.hover();await expect(card).toHaveCSS('transform','none');
 expect(await page.evaluate(()=>window.__heroMoved)).toBe(false);
});
test('changing reduced-motion preference at runtime stops and disables movement',async({page})=>{
 await page.emulateMedia({reducedMotion:'no-preference'});await fixture(page);await page.goto('./');
 const card=page.getByTestId('repo-card').first();await card.hover();
 await expect.poll(()=>card.evaluate(el=>new DOMMatrixReadOnly(getComputedStyle(el).transform).m42)).toBeLessThan(-1);
 await page.emulateMedia({reducedMotion:'reduce'});
 await expect(card).toHaveCSS('transform','none');
 await page.mouse.move(0,0);await card.hover();await expect(card).toHaveCSS('transform','none');
});
test('replacing a hidden card during entrance cannot break rendering or commit stale styles',async({page})=>{
 const errors=[];page.on('console',msg=>{if(msg.type()==='error' && /commitStyles|InvalidStateError/.test(msg.text()))errors.push(msg.text())});
 await fixture(page);await page.goto('./');
 const card=page.getByTestId('repo-card').first();
 await expect.poll(()=>card.evaluate(el=>el.getAnimations().some(a=>a.playState==='running'))).toBe(true);
 await page.evaluate(()=>document.querySelector('.repository-grid').style.display='none');
 await page.getByRole('searchbox').fill('missing-skill-987654');
 await expect(page.getByTestId('ranking-empty')).toBeVisible();
 expect(errors).toEqual([]);
});
