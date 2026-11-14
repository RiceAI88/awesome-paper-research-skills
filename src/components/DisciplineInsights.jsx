import React from 'react';
import { DISCIPLINES, disciplineCounts, disciplineFit, uniqueRepositories } from '../disciplines';
function revealRanking() {
  requestAnimationFrame(() => {
    const target=document.getElementById('rankings');
    target?.scrollIntoView({block:'start',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
    target?.focus({preventScroll:true});
  });
}
import { RESEARCH_TASKS, TASK_LABEL_KEYS, matchesResearchTask, REPOSITORY_URL } from '../domain';

export function DisciplineCounts({ items, state, update }) {
  const zh = state.lang === 'zh', counts = disciplineCounts(items);
  const rows = [...DISCIPLINES].sort((a,b) => counts[b.id]-counts[a.id]);
  const max = Math.max(1,...Object.values(counts));
  return <article className="insight-panel discipline-count-chart" data-testid="discipline-count-chart">
    <h3>{zh ? '各专业收录数量' : 'Repositories by discipline'}</h3>
    <p className="discipline-chart-note">{zh ? '按搜索、平台等条件比较全部专业，不受专业和任务选择影响；不含通用。' : 'Compare disciplines under search/platform filters, independent of selected discipline/task. General tools excluded.'}</p>
    <div className="discipline-bar-list">{rows.map(d => <button key={d.id} data-chart-discipline={d.id} aria-label={`${d[state.lang]} ${counts[d.id]}`} onClick={() => {update(s => ({...s,discipline:d.id,major:'all',task:'all',includeCommon:false,section:'ranking'}));revealRanking();}}>
      <span>{d[state.lang]}</span><i><b style={{width:`${counts[d.id]/max*100}%`}} /></i><strong>{counts[d.id]}</strong>
    </button>)}</div>
    <p className="discipline-chart-note">{zh ? '一个仓库可覆盖多个专业，分项之和可能大于仓库总数。' : 'A repository can cover several disciplines; totals may overlap.'}</p>
  </article>;
}
export function DisciplineCoverage({ items, state, update, t }) {
  const zh = state.lang === 'zh', unique = uniqueRepositories(items);
  const rows = DISCIPLINES.map(d => ({...d,items:unique.filter(i => disciplineFit(i,{discipline:d.id,major:'all'}) === 'specific')}));
  const tasks = RESEARCH_TASKS;
  const cells = rows.flatMap(d => tasks.map(task => ({discipline:d.id,task:task.id,count:d.items.filter(i => matchesResearchTask(i,task)).length})));
  const max = Math.max(1,...cells.map(c=>c.count));
  const gaps = [...rows].sort((a,b)=>a.items.length-b.items.length).filter(d=>d.items.length<5).slice(0,5);
  const choose = (discipline,task='all') => {update(s=>({...s,discipline,major:'all',task,includeCommon:false,section:'ranking'}));revealRanking();};
  return <div className="insights-bottom discipline-coverage-row">
    <article className="insight-panel" data-testid="discipline-coverage">
      <h3>{zh ? '专业 × 科研任务覆盖' : 'Discipline × research task coverage'}</h3>
      <p className="discipline-chart-note">{zh ? '按搜索、平台等条件比较专业和任务；0 表示本站当前无已核对收录。' : 'Cells count reviewed specialized repositories. Zero means none in this site’s current selection.'}</p>
      <div className="discipline-matrix-scroll" tabIndex={0} aria-label={zh ? '可横向滚动的覆盖矩阵' : 'Scrollable coverage matrix'}>
        <table className="discipline-matrix"><thead><tr><th>{zh ? '专业' : 'Discipline'}</th>{tasks.map(task=><th key={task.id}>{t(TASK_LABEL_KEYS[task.id])}</th>)}</tr></thead>
          <tbody>{rows.map(d=><tr key={d.id}><th scope="row">{d[state.lang]}</th>{tasks.map(task=>{
            const count=cells.find(c=>c.discipline===d.id&&c.task===task.id).count;
            return <td key={task.id}><button className={!count?'matrix-zero':''} style={{'--cell-strength':count ? .12+.75*count/max : 0, color: count/max > .55 ? '#fff' : 'var(--prs-text)'}} aria-label={`${d[state.lang]} · ${t(TASK_LABEL_KEYS[task.id])} · ${count}`} onClick={()=>choose(d.id,task.id)}>{count}</button></td>;
          })}</tr>)}</tbody>
        </table>
      </div>
      <p className="discipline-chart-note">{zh ? '颜色越深，收录越多；每个数字可点击，同仓库可属于多个任务。' : 'Darker means more repositories. Click any count; tasks can overlap.'}</p>
    </article>
    <article className="insight-panel" data-testid="discipline-gaps">
      <h3>{zh ? '本站收录较少的方向' : 'Underrepresented in this site'}</h3>
      <p className="discipline-chart-note">{zh ? '基于搜索、平台等筛选和已核对标签，不代表 GitHub 上没有相关 Skills。' : 'Based on this selection and reviewed tags, not the absence of Skills on GitHub.'}</p>
      {gaps.length ? <ul className="discipline-gap-list">{gaps.map(d=><li key={d.id}><button onClick={()=>choose(d.id)}>{d[state.lang]}<span>{d.items.length} {zh?'个仓库':'repositories'}</span></button></li>)}</ul> : <p>{zh?'当前各专业均已收录至少 5 个适用仓库。':'Every discipline in this selection has at least 5 repositories.'}</p>}
      <a className="discipline-recommend-link" href={`${REPOSITORY_URL}/issues/new?template=recommend-repo.yml`} target="_blank" rel="noopener noreferrer">{zh?'推荐我在用的科研 Skill →':'Recommend a research Skill →'}</a>
      <p className="discipline-chart-note">{zh ? '通用科研工具不重复计入专业数量，未核对项目不用于填补空白。' : 'General and unreviewed tools do not inflate specialist coverage.'}</p>
    </article>
  </div>;
}
