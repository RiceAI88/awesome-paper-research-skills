import test from "node:test";
import assert from "node:assert/strict";
import { profileFor, disciplineFit, disciplineCounts, DISCIPLINES } from "../../src/disciplines.js";
import { filterItems, restoreState, serializeState } from "../../src/domain.js";
const item = (repo, stars=100) => ({repo, stars, rank:1, repository_kind:'skill', description:'', category:{id:'other'}, topics:[]});
const bio=item('K-Dense-AI/scientific-agent-skills',100), common=item('Yuan1z0825/nature-skills',50000), econ=item('hanlulong/econ-writing-skill'), unknown=item('example/unreviewed');
const state={query:'',agent:'all',task:'all',sort:'stars',favorites:[],includeRelated:false,discipline:'medicine',major:'bioinformatics',includeCommon:true};
test('only sourced profiles classify, and common projects do not become specialist counts',()=>{
 assert.equal(profileFor(unknown),null);
 assert.equal(disciplineFit(bio,state),'specific');
 assert.equal(disciplineFit(common,state),'common');
 assert.equal(disciplineFit(econ,state),'other');
 const counts=disciplineCounts([bio,bio,common,unknown]);
 assert.equal(counts.science,1); assert.equal(counts.medicine,1); assert.equal(counts.law,0);
 assert.equal(DISCIPLINES.length,12);
});
test('profession filtering keeps specialists first, supports common toggle and excludes unknown claims',()=>{
 assert.deepEqual(filterItems([common,bio,econ,unknown],state).map(x=>x.repo),[bio.repo,common.repo]);
 assert.deepEqual(filterItems([common,bio,econ,unknown],{...state,includeCommon:false}).map(x=>x.repo),[bio.repo]);
 assert.equal(filterItems([common,bio,econ,unknown],{...state,discipline:'all',major:'all'}).length,4);
});
test('profession state round-trips, incompatible major is reset and invalid tags do not filter everything',()=>{
 const restored=restoreState(null,serializeState({...state,view:'card',lang:'zh',theme:'light',section:'ranking'}));
 assert.equal(restored.discipline,'medicine');assert.equal(restored.major,'bioinformatics');assert.equal(restored.includeCommon,true);
 assert.equal(restoreState(null,'#discipline=medicine&major=finance').major,'all');
 assert.equal(restoreState(null,'#discipline=unknown').discipline,'all');
 assert.equal(restoreState(null,'#discipline=medicine&common=0').includeCommon,false);
});

test('every published profile has valid taxonomy IDs and traceable documentation',async()=>{
 const {readFileSync}=await import('node:fs');
 const cfg=JSON.parse(readFileSync(new URL('../../config/disciplines.json',import.meta.url),'utf8'));
 const groups=new Set(DISCIPLINES.map(d=>d.id)), majors=new Set(DISCIPLINES.flatMap(d=>d.majors.map(m=>m.id)));
 for(const [repo,p] of Object.entries(cfg.profiles)){
   assert.ok(p.common || p.disciplines.length || p.majors.length,repo);
   for(const id of p.disciplines) assert.ok(groups.has(id),repo+id);
   for(const id of p.majors) assert.ok(majors.has(id),repo+id);
   const sources=JSON.parse(readFileSync(new URL('../../config/discipline-sources.json',import.meta.url),'utf8'));
   assert.ok(sources[repo].source_quote.length>5,repo);
   assert.ok(/^https:\/\/github.com\//.test(sources[repo].source_url),repo);
   assert.match(sources[repo].source_sha,/^[a-f0-9]{40}$/);
   assert.equal(p.evidence,true);
   assert.equal(sources[repo].review_kind,'documentation_only');
 }
});
