import {test,expect} from '@playwright/test';
import {readFileSync} from 'node:fs';
const dataset=JSON.parse(readFileSync(new URL('../../data/rankings.json',import.meta.url),'utf8'));
async function fixture(page){
 const now='2026-10-28T03:00:00Z';await page.clock.setFixedTime(new Date(now));
 const items=['example/first-research-skill','example/second-research-skill','example/third-research-skill'].map(repo=>({...dataset.items[0],repo,url:`https://github.com/${repo}`,repository_kind:'skill',skills_count:1,first_seen_at:now,first_seen_date:'2026-10-28',first_seen_is_baseline:false}));
 await page.route('**/data/rankings.js*',route=>route.fulfill({contentType:'application/javascript',body:`window.ACADEMIC_SKILLS_RANKINGS=${JSON.stringify({metadata:{...dataset.metadata,generated_at:now},items})};`}));
}
for(const lang of ['zh','en'])test(`daily title, projects and lightweight action share a vertical center in ${lang}`,async({page})=>{
 await fixture(page);await page.goto(`./#lang=${lang}`);const section=page.getByTestId('daily-arrivals');
 await expect.poll(()=>section.evaluate(el=>{
  const nodes=[el.querySelector('.daily-arrivals-title h2'),el.querySelector('.daily-arrivals-title > span'),...el.querySelectorAll('.daily-arrival-entry strong'),el.querySelector('[data-testid="today-skills-filter"]')];
  const centers=nodes.map(node=>{const b=node.getBoundingClientRect();return b.y+b.height/2});return Math.max(...centers)-Math.min(...centers);
 })).toBeLessThan(1);
 const action=section.getByTestId('today-skills-filter');await expect(action).toContainText(lang==='zh'?'查看全部':'View all');
 await expect(action).toHaveCSS('border-top-width','0px');await expect(action).toHaveCSS('box-shadow','none');
 await action.hover();await expect(action).toHaveCSS('background-color','rgba(0, 0, 0, 0)');
 await action.click();await expect(page).toHaveURL(/today=skill/);await expect(action).toHaveAttribute('aria-pressed','true');
 await action.click();await expect(page).not.toHaveURL(/today=/);
});
for(const width of [320,390])test(`daily projects and action remain usable at ${width}px`,async({page})=>{
 await fixture(page);await page.setViewportSize({width,height:844});await page.goto('./');
 const section=page.getByTestId('daily-arrivals');await expect(section.getByTestId('today-skills-filter')).toBeVisible();
 await expect.poll(()=>section.evaluate(el=>{
  const title=el.querySelector('.daily-arrivals-title').getBoundingClientRect(),action=el.querySelector('[data-testid="today-skills-filter"]').getBoundingClientRect();
  return Math.abs(title.y+title.height/2-action.y-action.height/2);
 })).toBeLessThan(1);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBe(width);
 await section.getByRole('button',{name:'example/first-research-skill',exact:true}).click();await expect(page.getByRole('dialog')).toBeVisible();
});
