import { Reveal } from "./SiteMotion";
import React from 'react';
import { Button } from 'antd';

export function DailyArrivals({ items, state, update, t }) {
  const skills = items.filter(item => item.new_today && item.repository_kind === 'skill');
  const related = items.filter(item => item.new_today && item.repository_kind === 'related');
  const choose = kind => update(s => ({ ...s, query: '', task: 'all', category: 'all', agent: 'all',
    favOnly: false, newOnly: false, todayOnly: s.todayOnly === kind ? '' : kind }));
  return <Reveal as="section" className="daily-arrivals" data-testid="daily-arrivals" aria-labelledby="daily-arrivals-title">
    <div className="daily-arrivals-heading">
      <div className="daily-arrivals-title">
        <h2 id="daily-arrivals-title">{t('dailySkills')} <strong data-testid="daily-skill-count">{skills.length}</strong></h2>
        <span>{t(skills.length ? 'dailyScope' : 'dailyEmpty')}</span>
      </div>
      <div className="daily-arrivals-actions">
        {related.length > 0 && <Button type="text" data-testid="today-related-filter" aria-pressed={state.todayOnly === 'related'} onClick={() => choose('related')}>
          {t('dailyRelated')} {related.length}
        </Button>}
        <Button size="small" data-testid="today-skills-filter" disabled={!skills.length && state.todayOnly !== 'skill'} aria-pressed={state.todayOnly === 'skill'} onClick={() => choose('skill')}>
          {t(state.todayOnly === 'skill' ? 'dailyShowAll' : 'dailyView')}
        </Button>
      </div>
    </div>
    {skills.length ? <div className="daily-arrivals-list">
      {skills.slice(0, 3).map(item => <button type="button" key={item.repo} className="daily-arrival-entry"
        aria-label={item.repo} onClick={() => update(s => ({ ...s, repo: item.repo }))}>
        <strong>{item.repo}</strong><span>{item.description || t('noDescription')}</span>
      </button>)}
    </div> : null}
  </Reveal>;
}
