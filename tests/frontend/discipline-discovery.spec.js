import { test, expect, openScope } from './fixtures.js';
import { readFileSync } from 'node:fs';
import { filterItems, restoreState } from '../../src/domain.js';
const data=JSON.parse(readFileSync(new URL('../../data/rankings.json',import.meta.url),'utf8'));

test('profession filters use real counts, specialists first, and share via URL',async({page})=>{
 await page.goto('./#discipline=medicine&major=bioinformatics&common=0');
 const expected=filterItems(data.items,restoreState(null,'#discipline=medicine&major=bioinformatics&common=0',{},data.items));
 await expect(page.getByTestId('repo-card')).toHaveCount(Math.min(expected.length,30));
 await expect(page.locator('[data-discipline="medicine"]')).toHaveAttribute('aria-pressed','true');
 await expect(page.locator('[data-major="bioinformatics"]')).toHaveAttribute('aria-pressed','true');
 await openScope(page);
 await expect(page.getByRole('switch',{name:'包含通用科研 Skills'})).toHaveAttribute('aria-checked','false');
 await page.getByTestId('repo-card').first().click();
 const drawer=page.getByRole('dialog');
 await expect(drawer).toContainText('专业适用依据');
 await expect(drawer.getByRole('link',{name:'查看官方文档 ↗'})).toHaveAttribute('href',/^https:\/\/github.com\//);
 await page.keyboard.press('Escape');
 await page.reload();
 await expect(page.locator('[data-major="bioinformatics"]')).toHaveAttribute('aria-pressed','true');
});

test('common tools can be disabled and an uncovered discipline stays honest',async({page})=>{
 await page.goto('./#discipline=law');
 await expect(page.locator('.discipline-selector h2')).toContainText('法学');
 const before=await page.getByTestId('repo-card').count();
 await openScope(page);
 await page.getByRole('switch',{name:'包含通用科研 Skills'}).click();
 await expect.poll(()=>page.getByTestId('repo-card').count()).toBeLessThan(before);
 await page.locator('[data-discipline="history"]').click();
 await page.getByRole('searchbox').fill('no-reviewed-repository-xyz');
 await expect(page.locator('.discipline-empty-note')).toBeVisible();
 await expect(page.getByTestId('repo-card')).toHaveCount(0);
 await page.getByRole('searchbox').clear();
 await page.locator('[data-discipline="all"]').click();
 await expect(page.getByTestId('repo-card')).toHaveCount(30);
});

test('profession insights use actual counts and retain legacy charts behind more',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});
 await page.goto('./#section=insights');
 await expect(page.getByTestId('discipline-count-chart')).toBeVisible();
 await expect(page.getByTestId('discipline-coverage')).toBeVisible();
 await expect(page.getByTestId('discipline-gaps')).toContainText('不代表 GitHub');
 await expect(page.locator('.plot-host svg')).toHaveCount(1);
 await page.getByTestId('more-charts').locator(':scope > summary').click();
 await expect(page.locator('.plot-host svg')).toHaveCount(4);
 await page.locator('[data-chart-discipline="economics"]').click();
 await expect(page.locator('[data-discipline="economics"]')).toHaveAttribute('aria-pressed','true');
 await expect(page.getByRole('tab',{name:'今日榜单',exact:true})).toHaveAttribute('aria-selected','true');
});

test('mobile professional selection and heatmap do not overflow the page',async({page})=>{
 await page.setViewportSize({width:390,height:844});
 await page.goto('./#discipline=medicine&section=insights');
 await expect(page.getByTestId('discipline-coverage')).toBeVisible();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 const first=page.locator('.discipline-matrix tbody button').first();
 await first.click();
 await expect(page.getByRole('tab',{name:'今日榜单',exact:true})).toHaveAttribute('aria-selected','true');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});

test('comparison matrix count predicts results even with a different active profession and task',async({page})=>{
 const targetState=restoreState(null,'#discipline=science&task=analyze&common=0',{},data.items);
 const expected=filterItems(data.items,targetState).length;
 await page.goto('./#discipline=medicine&task=write&section=insights');
 const cell=page.getByTestId('discipline-coverage').getByRole('button',{name:`理学 · 数据分析 · ${expected}`,exact:true});
 await expect(cell).toBeVisible();
 await cell.click();
 await expect(page.getByTestId('repo-card')).toHaveCount(Math.min(30,expected));
 await openScope(page);
 await expect(page.getByRole('switch',{name:'包含通用科研 Skills'})).toHaveAttribute('aria-checked','false');
});
