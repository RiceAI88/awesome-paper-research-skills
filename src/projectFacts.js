import learnerLevels from '../config/learner-levels.json' with {type:'json'};
import {DISCIPLINES,profileFor,disciplineFit} from './disciplines.js';
export function fitLabels(item,state) {
 const profile=profileFor(item), lang=state.lang||'zh';
 if(!profile)return null;
 if(profile.common)return {kind:'common',labels:[]};
 const group=DISCIPLINES.find(d=>d.id===state.discipline);
 if(group && disciplineFit(item,state)==='specific')return {kind:'specific',labels:[group[lang]]};
 const labels=DISCIPLINES.flatMap(d=>profile.disciplines.includes(d.id)?[d[lang]]:d.majors.filter(m=>profile.majors.includes(m.id)).map(m=>m[lang]));
 return {kind:'specific',labels:[...new Set(labels)]};
}
export function learnerLevel(item) { const entry=learnerLevels[item.repo];return entry?.source_url && entry.quote && Array.isArray(entry.levels)?entry:null; }
export function growthState(item,history,generatedAt) {
 const value=item.star_delta_7d;
 if(!Number.isFinite(value))return 'unavailable';
 const cutoff=Date.parse(generatedAt)-7*86400000;
 const points=(history?.series?.[item.repo]||[]).filter(p=>Number.isFinite(p.stars)&&p.stars>=0&&Number.isFinite(Date.parse(p.date)));
 return Number.isFinite(cutoff)&&points.some(p=>Date.parse(p.date)<=cutoff)&&points.some(p=>Date.parse(p.date)>=cutoff+6*86400000)?(value===0?'zero':'value'):'short';
}
export function updateDateLabel(date,lang,now=Date.now()) {
 const value=Date.parse(date);if(!Number.isFinite(value))return lang==='zh'?'更新日期见项目':'Update date: see project';
 const days=Math.max(0,Math.floor(now/86400000)-Math.floor(value/86400000));
 return lang==='zh'?(days===0?'今天更新':days===1?'昨天更新':`${days} 天前更新`):(days===0?'Updated today':days===1?'Updated yesterday':`Updated ${days} days ago`);
}
