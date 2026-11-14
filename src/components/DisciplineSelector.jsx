import { ActionPopover } from "./ActionPopover";
import React, {useRef, useLayoutEffect} from "react";
import { Tooltip } from "antd";
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
  const choose = (id) => update(s => ({...s,discipline:id,major:'all',repo:null,...(id==='all' && s.sort==='fit'?{sort:'rank'}:{})}));
  return (
    <section className="discipline-selector" data-testid="discipline-selector" aria-labelledby="discipline-selector-title">
      <div className="discipline-selector-heading">
        <div className="discipline-selector-title"><h2 id="discipline-selector-title">{group ? <>{zh ? '我是 ' : 'For '}<em>{professionLabel(state,lang)}</em>{zh ? (state.major === 'all' ? ' 类专业的学生' : ' 专业的学生') : ' students'}</> : (zh ? '按专业寻找科研 Skills' : 'Choose your discipline')}</h2><ActionPopover label={zh ? "分类说明" : "About classification"} lang={lang}><p>{zh ? "专业归属依据项目官方文档，数量按仓库去重。尚未核验专业归属的项目可在“全部”中查看。" : "Discipline labels are based on official documentation and count unique repositories. Projects awaiting discipline review remain in All."}</p></ActionPopover></div>
        <span>{group ? (zh ? `当前结果 ${visible.length}：专业适用 ${specific} ＋ 通用 ${common}` : `Results ${visible.length}: ${specific} specialized + ${common} general`) : (zh ? '先选专业，再选你想完成的科研任务' : 'Choose a discipline, then a research task')}</span>
      </div>
      <div ref={navigation} className="discipline-options" role="group" aria-label={zh ? '学科门类' : 'Disciplines'}>
        <span className="discipline-row-label">{zh ? '学科门类' : 'Discipline'}</span>
        <button data-discipline="all" aria-pressed={!group} onClick={() => choose('all')}>{zh ? '全部' : 'All'}</button>
        {DISCIPLINES.map(d => <Tooltip key={d.id} title={zh ? `已核对专业适用 ${counts[d.id]} 个，不含通用项目；同一仓库可属于多个专业。` : `${counts[d.id]} reviewed specialized repositories, excluding general tools; a repository can cover multiple disciplines.`}>
          <button data-discipline={d.id} className={counts[d.id] ? '' : 'discipline-zero'} aria-pressed={state.discipline === d.id} onClick={() => choose(d.id)}>{d[lang]}</button>
        </Tooltip>)}
      </div>
      {group && <div className="discipline-majors" role="group" aria-label={zh ? '具体专业' : 'Majors'}>
        <span className="discipline-row-label">{zh ? '具体专业' : 'Major'}</span>
        <button data-major="all" aria-pressed={state.major === 'all'} onClick={() => update(s => ({...s,major:'all'}))}>{zh ? `全部${group.zh}` : `All ${group.en}`}</button>
        {group.majors.map(m => <button key={m.id} data-major={m.id} aria-pressed={state.major === m.id} onClick={() => update(s => ({...s,major:m.id}))}>{m[lang]}</button>)}
      </div>}
      {group && !specific && <p className="discipline-empty-note">{zh ? '当前条件下，本站尚无已核验专业归属的项目。这不代表没有相关 Skills，可在“收录范围”开启通用科研 Skills，或推荐你发现的项目。' : 'No projects with reviewed discipline labels match these filters yet. This does not mean no such Skills exist. Include general Skills or suggest a project.'} <a href="https://github.com/RiceAI88/awesome-paper-research-skills/issues/new?template=recommend-repo.yml" target="_blank" rel="noopener noreferrer">{zh ? "推荐项目 ↗" : "Suggest a project ↗"}</a></p>}
    </section>
  );
}
