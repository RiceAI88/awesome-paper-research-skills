import {test,expect} from './fixtures.js';
test('explicit Stars ordering agrees with the table header inside a discipline',async({page})=>{
 await page.goto('./#discipline=science&sort=stars&view=table');
 await expect(page.locator('.ant-table-row').first()).toBeVisible();
 const stars=await page.locator('.table-stars').allTextContents();
 const numbers=stars.map(x=>Number(x.replaceAll(',','')));
 expect(numbers).toEqual([...numbers].sort((a,b)=>b-a));
 await expect(page.getByRole('button',{name:'按 Stars 排序',exact:true})).toHaveAttribute('aria-pressed','true');
});
test('one scope entry retains independent common and related options',async({page})=>{
 await page.goto('./#discipline=science');
 const scope=page.getByRole('button',{name:/^收录范围/});
 await scope.click();
 const panel=page.getByRole('dialog',{name:'收录范围',exact:true});
 await panel.getByRole('switch',{name:'包含通用科研 Skills',exact:true}).click();
 await panel.getByRole('switch',{name:'含科研相关项目',exact:true}).click();
 await expect(page).toHaveURL(/common=0/);await expect(page).toHaveURL(/related=1/);
 await panel.getByRole('button',{name:'关闭',exact:true}).click();
 await expect(page.locator('.discipline-selector-foot .scope-switch')).toHaveCount(0);
});
for(const width of [1280,390,320])test(`brand, useful card and beginner entry at ${width}px`,async({page})=>{
 await page.setViewportSize({width,height:950});
 await page.goto('./');
 await expect(page.locator('.brand')).toContainText('智一刻AI · 科研 Skills 导航');
 await expect(page.getByRole('button',{name:'30 秒看懂 Skill',exact:true})).toBeVisible();
 await page.getByRole('button',{name:'30 秒看懂 Skill',exact:true}).click();
 const guide=page.getByRole('dialog',{name:'科研 Skills 入门',exact:true});
 await expect(guide).toContainText('Claude Code');await expect(guide).toContainText('Codex');
 await expect(guide).toContainText('费用');
 const theme=await page.locator('html').getAttribute('data-theme');
 await page.keyboard.press('t');
 await expect(page.locator('html')).toHaveAttribute('data-theme',theme);
 await guide.getByRole('button',{name:'专业科研路径',exact:true}).click();
 await expect(guide.locator('[data-research-path]')).not.toHaveCount(0);
 await guide.getByRole('button',{name:'关闭入门指南',exact:true}).click();
 const card=page.getByTestId('repo-card').first();
 await expect(card.locator('[data-testid="card-updated"]')).toBeVisible();
 await expect(card.locator('[data-testid="card-tasks"]')).toBeVisible();
 await expect(card).not.toContainText('近 7 日 —');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});

test('English brand and support entry never overlap on a narrow screen',async({page})=>{
 await page.setViewportSize({width:320,height:900});
 await page.goto('./#lang=en');
 const brand=await page.locator('.brand').boundingBox();
 const support=await page.getByTestId('gpt-recharge-ad').boundingBox();
 expect(brand.x+brand.width).toBeLessThanOrEqual(support.x);
 const text=page.locator('.brand span').last();
 expect(await text.evaluate(el=>el.scrollWidth<=el.clientWidth+1)).toBe(true);
});

for(const lang of ['zh','en'])test(`runtime document title keeps the ${lang} public brand`,async({page})=>{
 await page.goto(`./#lang=${lang}`);
 await expect(page.locator('.brand')).toBeVisible();
 await expect(page).toHaveTitle(lang==='zh'?'智一刻AI · 科研 Skills 导航｜大学生与研究生科研工具':'Zhiyike AI · Research Skills Directory');
});
