import {test,expect} from '@playwright/test';
import {readFileSync} from 'node:fs';
const data=JSON.parse(readFileSync(new URL('../../data/rankings.json',import.meta.url),'utf8'));
async function fixture(page, count=4){
 await page.clock.setFixedTime(new Date('2026-10-27T05:30:00Z'));
 const make=(repo,kind,at)=>({...data.items[0],repo,url:`https://github.com/${repo}`,repository_kind:kind,skills_count:kind==='skill'?1:0,description:'Original author description',first_seen_date:at.slice(0,10),first_seen_at:at,first_seen_is_baseline:false});
 const items=[make('new/research-skill','skill','2026-10-27T01:00:00Z'),make('new/research-guide','related','2026-10-27T01:00:00Z'),make('old/research-skill','skill','2026-10-26T01:00:00Z'),make('new/unverified','unknown','2026-10-27T01:00:00Z')].slice(0,count);
 await page.route('**/data/rankings.js*',route=>route.fulfill({contentType:'application/javascript',body:`window.ACADEMIC_SKILLS_RANKINGS=${JSON.stringify({metadata:{...data.metadata,generated_at:'2026-10-27T05:00:00Z'},items})};`}));
}
test('today entry highlights real new skills, opens details and filters independently of related projects',async({page})=>{
 await fixture(page);await page.goto('./');
 const section=page.getByTestId('daily-arrivals');
 await expect(section).toContainText('今日新增 Skills');
 await expect(section.getByTestId('daily-skill-count')).toHaveText('1');
 expect((await section.boundingBox()).height).toBeLessThan(150);
 await section.getByRole('button',{name:'new/research-skill',exact:true}).click();
 await expect(page.locator('.ant-drawer')).toBeVisible();
 await page.keyboard.press('Escape');
 await section.getByTestId('today-skills-filter').click();
 await expect(page.getByTestId('repo-card')).toHaveCount(1);
 await expect(page.getByTestId('repo-card')).toContainText('research-skill');
 await expect(page).toHaveURL(/today=skill/);
 await page.reload();await expect(page.getByTestId('repo-card')).toHaveCount(1);
 await page.getByTestId('today-skills-filter').click();
 await expect(page.getByTestId('repo-card')).toHaveCount(2);
 await page.goto('./#today=related');
 await expect(page.getByTestId('repo-card')).toHaveCount(1);
 await expect(page.getByTestId('repo-card')).toContainText('research-guide');
});
test('empty today state is truthful and compact on mobile in both languages',async({page})=>{
 await fixture(page,0);await page.setViewportSize({width:390,height:844});await page.goto('./');
 const section=page.getByTestId('daily-arrivals');
 await expect(section).toContainText('今日暂无新增 Skills');
 await expect(section.getByTestId('today-skills-filter')).toBeDisabled();
 await page.getByText('EN',{exact:true}).click();
 await expect(section).toContainText('No new Skills today');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
test('an open page drops yesterday arrivals at Beijing midnight',async({page})=>{
 await fixture(page);await page.goto('./');
 await expect(page.getByTestId('daily-skill-count')).toHaveText('1');
 await page.clock.setFixedTime(new Date('2026-10-27T16:01:00Z'));
 await page.waitForTimeout(1100);
 // The day is resynchronized on focus without waiting for a full reload.
 await page.evaluate(()=>window.dispatchEvent(new Event('focus')));
 await expect(page.getByTestId('daily-skill-count')).toHaveText('0');
 await expect(page.locator('.repository-card .daily-new-badge')).toHaveCount(0);
});
test('an empty shared today filter can return directly to the full ranking',async({page})=>{
 await fixture(page);await page.clock.setFixedTime(new Date('2026-10-27T16:01:00Z'));
 await page.goto('./#today=skill');
 await expect(page.getByTestId('repo-card')).toHaveCount(0);
 await expect(page.getByTestId('today-skills-filter')).toBeEnabled();
 await page.getByTestId('today-skills-filter').click();
 await expect(page.getByTestId('repo-card')).toHaveCount(2);
});

test('pointer focus cannot shift an arrival entry away before its click completes',async({page})=>{
 await fixture(page);await page.goto('./');
 const section=page.getByTestId('daily-arrivals');
 await expect(section).toHaveCSS('transform','none');
 await section.evaluate(el=>el.style.transform='translateY(14px)');
 await section.getByRole('button',{name:'new/research-skill',exact:true}).click();
 await expect(page.getByRole('dialog')).toBeVisible();
});
