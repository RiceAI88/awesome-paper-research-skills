import React from 'react';
import {Tooltip} from 'antd';
import {sceneLabelsFor} from '../domain';
import {fitLabels,learnerLevel,growthState,updateDateLabel} from '../projectFacts';
export function ProjectFacts({item,state,t}) {
 const zh=state.lang==='zh',fit=fitLabels(item,state),tasks=sceneLabelsFor(item,t),level=learnerLevel(item);
 const range=fit?.kind==='common'?(zh?'跨专业通用':'Cross-disciplinary'):fit?.labels.length?`${zh?'专业适用':'For'} · ${fit.labels.slice(0,2).join(' / ')}${fit.labels.length>2?` +${fit.labels.length-2}`:''}`:null;
 const taskText=tasks.length?tasks.join(' · '):(zh?'未分类':'Unclassified');
 return <div className="project-facts">
  <div className="project-fit-line">{range && <span className="discipline-card-fit" title={fit.labels?.join(' / ')}>{range}</span>}<span data-testid="card-tasks" className="card-tasks" title={taskText}>{zh?'适合：':'Tasks: '}{taskText}</span></div>
  <div className="project-facts-meta"><time data-testid="card-updated" dateTime={item.last_push_date} title={`${zh?'最近提交日期':'Last push date'}: ${item.last_push_date||'—'} (UTC)`}>{updateDateLabel(item.last_push_date,state.lang)}</time>{level && <Tooltip trigger={['hover','focus','click']} title={`${level.quote} · ${level.source_url}`}><span className="learner-level" tabIndex={0} onClick={e=>e.stopPropagation()}>{level.levels.map(id=>({undergraduate:zh?'本科':'Undergrad',postgraduate:zh?'硕博':'Postgrad',doctoral:zh?'博士':'PhD',masters:zh?'硕士':'Master'}[id])).filter(Boolean).join(' / ')}</span></Tooltip>}</div>
 </div>;
}
export function GrowthValue({item,history,generatedAt,lang,fmt,withPeriod=false}) {
 const zh=lang==='zh',status=growthState(item,history,generatedAt);
 const title=status==='zero'?(zh?'已有至少7天历史记录，近7日净增量为0。':'At least 7 days of history; net change is zero.'):status==='short'?(zh?'历史快照尚未覆盖完整7日，当前非零数值仅作短期参考，不代表7日净增。':'No complete 7-day history; a nonzero value is short-term only, not a 7-day change.'):status==='unavailable'?(zh?'本次没有可用的7日增量数据。':'No 7-day growth value is available.'):(zh?'近7日Stars净变化':'Net Stars change over 7 days');
 const value=status==='value'?`${item.star_delta_7d>0?'+':''}${fmt(item.star_delta_7d)}`:status==='zero'?(zh?'无增长':'No change'):status==='short'?(item.star_delta_7d ? `${zh?'短期':'Short-term'} ${item.star_delta_7d>0?'+':''}${fmt(item.star_delta_7d)}` : (zh?'暂无7日对比':'No 7-day baseline')):(zh?'暂无增量数据':'Unavailable');
 return <span className={`growth-value growth-${status}`} title={title} aria-label={status==='value' || status==='zero' ? (zh?'近 7 日净增':'7-day net growth') : status==='short' ? (zh?'短期增量参考':'Short-term growth reference') : (zh?'增量数据不可用':'Growth unavailable')}>{withPeriod && status!=='short' && status!=='unavailable' && <span>{zh?'近 7 日 ':'7 days '}</span>}<strong>{value}</strong></span>;
}
