import React, {useRef, useLayoutEffect} from "react";
import { Tooltip } from "antd";
import { ScopeSwitch } from "./ScopeSwitch";
import { DISCIPLINES, disciplineCounts, disciplineFit, professionLabel, selectedDiscipline } from "../disciplines";

export function DisciplineSelector({ items, visible, state, update }) {
  const zh = state.lang === 'zh', lang = state.lang;
  const group = selectedDiscipline(state);
  const navigation = useRef(null);
  useLayoutEffect(() => {
    const list=navigation.current;
    if (!list || !matchMedia('(max-width:760px)').matches) return;
    const active=list.querySelector('[aria-pressed="true"]');
    if (active) list.scrollLeft += active.getBoundingClientRect().left - list.getBoundingClientRect().left - (list.clientWidth-active.offsetWidth)/2;
  }, [state.discipline]);
  const counts = disciplineCounts(items);
  const specific = visible.filter(i => disciplineFit(i,state) === 'specific').length;
  const common = visible.filter(i => disciplineFit(i,state) === 'common').length;
  const choose = (id) => update(s => ({...s,discipline:id,major:'all',repo:null}));
  return (
    <section className="discipline-selector" data-testid="discipline-selector" aria-labelledby="discipline-selector-title">
      <div className="discipline-selector-heading">
        <h2 id="discipline-selector-title">{group ? <>{zh ? '我是 ' : 'For '}<em>{professionLabel(state,lang)}</em>{zh ? (state.major === 'all' ? ' 类专业的学生' : ' 专业的学生') : ' students'}</> : (zh ? '按专业寻找科研 Skills' : 'Find research Skills for your discipline')}</h2>
        <span>{group ? (zh ? `${visible.length} 个仓库 · 专业适用 ${specific} · 通用 ${common}` : `${visible.length} repositories · ${specific} specialized · ${common} general`) : (zh ? '先选专业，再选你想完成的科研任务' : 'Choose a discipline, then a research task')}</span>
      </div>
      <div ref={navigation} className="discipline-options" role="group" aria-label={zh ? '学科门类' : 'Disciplines'}>
        <span className="discipline-row-label">{zh ? '学科门类' : 'Discipline'}</span>
        <button data-discipline="all" aria-pressed={!group} onClick={() => choose('all')}>{zh ? '全部' : 'All'}</button>
        {DISCIPLINES.map(d => <Tooltip key={d.id} title={zh ? '已核对专业适用仓库数，不含通用项目；同一仓库可属于多个专业。' : 'Reviewed specialized repositories, excluding general tools; a repository can cover multiple disciplines.'}>
          <button data-discipline={d.id} className={counts[d.id] ? '' : 'discipline-zero'} aria-pressed={state.discipline === d.id} onClick={() => choose(d.id)}>{d[lang]} <span>{counts[d.id]}</span></button>
        </Tooltip>)}
      </div>
      {group && <div className="discipline-majors" role="group" aria-label={zh ? '具体专业' : 'Majors'}>
        <span className="discipline-row-label">{zh ? '具体专业' : 'Major'}</span>
        <button data-major="all" aria-pressed={state.major === 'all'} onClick={() => update(s => ({...s,major:'all'}))}>{zh ? `全部${group.zh}` : `All ${group.en}`}</button>
        {group.majors.map(m => <button key={m.id} data-major={m.id} aria-pressed={state.major === m.id} onClick={() => update(s => ({...s,major:m.id}))}>{m[lang]}</button>)}
      </div>}
      <div className="discipline-selector-foot">
        <span>{zh ? '按官方文档标注适用范围；未核对项目仍可在全部榜单浏览。数量按仓库去重。' : 'Scope is based on official documentation. Unreviewed projects remain in All. Counts use unique repositories.'}</span>
        {group && <label><ScopeSwitch size="small" aria-label={zh ? '包含通用科研 Skills' : 'Include general research Skills'} checked={state.includeCommon !== false} onChange={includeCommon => update(s => ({...s,includeCommon}))}/>{zh ? '包含通用科研 Skills' : 'Include general research Skills'}</label>}
      </div>
      {group && !specific && <p className="discipline-empty-note">{zh ? '当前条件下暂无已核对的专业项目，可以先使用下方通用科研 Skills，或切换专业。' : 'No reviewed specialized projects match these filters. Try the general research Skills or another discipline.'}</p>}
    </section>
  );
}
