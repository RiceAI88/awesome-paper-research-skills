import test from 'node:test';
import assert from 'node:assert/strict';
import { isNewToday, beijingDay, filterItems, serializeState, restoreState } from '../../src/domain.js';
const item={repo:'a/new',first_seen_date:'2026-10-27',first_seen_at:'2026-10-27T16:10:00Z',repository_kind:'skill'};
test('today uses Beijing midnight and actual observation, excluding baseline and invalid dates',()=>{
 assert.equal(beijingDay('2026-10-27T16:00:00Z'),'2026-10-28');
 assert.equal(isNewToday(item,'2026-10-28T00:30:00+08:00'),true);
 assert.equal(isNewToday(item,'2026-10-27T15:59:00Z'),false);
 assert.equal(isNewToday({...item,first_seen_is_baseline:true},'2026-10-28'),false);
 assert.equal(isNewToday({...item,first_seen_at:'bad'},'2026-10-28'),false);
 assert.equal(isNewToday({first_seen_date:'2026-02-30'},'2026-03-02'),false);
 assert.equal(isNewToday({first_seen_date:'2026-10-27'},'2026-10-28'),false);
});
test('today skills filter distinguishes related and unknown types and survives shared links',()=>{
 const items=[{...item,new_today:true}, {...item,repo:'b/guide',repository_kind:'related',new_today:true}, {...item,repo:'c/unknown',repository_kind:'unknown',new_today:true}, {...item,repo:'d/old',new_today:false}];
 const state=restoreState(null,'#today=skill',{},items);
 assert.equal(state.todayOnly,'skill');
 assert.deepEqual(filterItems(items,state).map(x=>x.repo),['a/new']);
 assert.equal(restoreState(null,serializeState(state),{},items).todayOnly,'skill');
 assert.deepEqual(filterItems(items,{...state,includeRelated:true,todayOnly:'related'}).map(x=>x.repo),['b/guide']);
 assert.equal(restoreState(null,'#today=invalid',{},items).todayOnly,'');
});
