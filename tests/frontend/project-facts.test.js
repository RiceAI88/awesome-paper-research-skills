import test from 'node:test';
import assert from 'node:assert/strict';
import {growthState,learnerLevel,updateDateLabel} from '../../src/projectFacts.js';
import {detectAgents,sceneLabelsFor} from '../../src/domain.js';
import {readFileSync} from 'node:fs';
const item={repo:'test/item',star_delta_7d:0},generated='2026-11-14T06:00:00Z';
test('zero change needs a real baseline and current observation, missing values stay unknown',()=>{
 assert.equal(growthState(item,{series:{}},generated),'short');
 assert.equal(growthState(item,{series:{'test/item':[{date:'2026-11-14',stars:100}]}},generated),'short');
 assert.equal(growthState(item,{series:{'test/item':[{date:'2026-11-06',stars:100},{date:'2026-11-14',stars:100}]}},generated),'zero');
 assert.equal(growthState({...item,star_delta_7d:null},{series:{}},generated),'unavailable');
 assert.equal(growthState({...item,star_delta_7d:-5},{series:{}},generated),'short');
 assert.equal(growthState({...item,star_delta_7d:6},{series:{'test/item':[{date:'2026-11-10',stars:100},{date:'2026-11-14',stars:106}]}},generated),'short');
});
test('date-only updates do not invent a time and documented empty platforms do not imply universal compatibility',()=>{
 assert.equal(updateDateLabel('2026-11-13','zh',Date.parse(generated)),'昨天更新');
 assert.equal(updateDateLabel('missing','zh',Date.parse(generated)),'更新日期见项目');
 assert.deepEqual(detectAgents({repo:'test/claude-code-helper',agents:[],platforms_reviewed:true}),[]);
 assert.equal(learnerLevel({repo:'test/unknown'}),null);
});
test('all default top 50 have installation and task reviews with source evidence; learner stages have quotes',()=>{
 const json=name=>JSON.parse(readFileSync(new URL('../../'+name,import.meta.url),'utf8'));
 const items=json('config/installation-review.json').repositories.map(repo=>({repo}));
 assert.equal(new Set(items.map(i=>i.repo)).size,50);
 const editorial=json('config/editorial.json'),details=json('config/installation-details.json'),usage=json('config/project-usage.json'),levels=json('config/learner-levels.json');
 for(const item of items){
  assert.ok(editorial.installations[item.repo]?.reviewed_at,item.repo);
  assert.match(editorial.installations[item.repo].source_url,/^https:\/\//);
  assert.ok(details[item.repo].environment_zh,item.repo);
  assert.ok(details[item.repo].dependencies_zh,item.repo);
  assert.ok(usage[item.repo].reviewed_at,item.repo);
  assert.ok(Array.isArray(usage[item.repo].tasks),item.repo);
  assert.ok(details[item.repo].source_quote,item.repo);
  assert.ok(details[item.repo].tasks_quote || usage[item.repo].tasks.length===0,item.repo);
 }
 for(const entry of Object.values(levels)){assert.ok(entry.quote&&entry.source_url&&entry.reviewed_at);}
 assert.deepEqual(sceneLabelsFor({repo:'alchaincyf/darwin-skill',category:{id:'paper-writing'}},x=>x),[]);
});
