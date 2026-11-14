import React from 'react';
import {ActionPopover} from './ActionPopover';
import {ScopeSwitch} from './ScopeSwitch';
export function ScopeControl({state,update,relatedCount=0}) {
 const zh=state.lang==='zh', selected=state.discipline!=='all';
 return <ActionPopover label={zh?'收录范围':'Scope'} lang={state.lang} className="scope-control" count={Number(state.includeRelated)+Number(selected && state.includeCommon===false)}>
  <div className="scope-options">
   <label><span><strong>{zh?'包含通用科研 Skills':'Include general research Skills'}</strong><small>{selected ? (zh?'在本专业项目之外，也显示跨专业科研工具。':'Also show cross-disciplinary research Skills.') : (zh?'选择专业后可使用此项；全部专业下不会额外重复计数。':'Choose a discipline to use this option; All does not duplicate general tools.')}</small></span><ScopeSwitch disabled={!selected} checked={state.includeCommon!==false} aria-label={zh?'包含通用科研 Skills':'Include general research Skills'} onChange={includeCommon=>update(s=>({...s,includeCommon}))}/></label>
   <label><span><strong>{zh?'含科研相关项目':'Include related projects'} <span className="scope-option-count">{relatedCount}</span></strong><small>{zh?'加入科研应用、资料和工作流；它们不一定是可安装的 Skill。':'Include research apps, resources and workflows that may not be installable Skills.'}</small></span><ScopeSwitch data-testid="include-related" checked={state.includeRelated} aria-label={zh?'含科研相关项目':'Include related projects'} onChange={includeRelated=>update(s=>({...s,includeRelated,todayOnly:!includeRelated&&s.todayOnly==='related'?'':s.todayOnly}))}/></label>
  </div>
 </ActionPopover>;
}
