import React from 'react';
import { profileFor } from '../disciplines';
import sources from '../../config/discipline-sources.json' with {type:'json'};

export function DisciplineEvidence({ item, state }) {
  const reviewed = profileFor(item), zh = state.lang === 'zh';
  const profile = reviewed && {...reviewed,...sources[item.repo.toLowerCase()]};
  if (!profile) return null;
  return <section className="discipline-evidence">
    <h3>{zh ? '专业适用依据' : 'Discipline fit evidence'}</h3>
    <p>{zh ? profile.use_zh : profile.use_en}</p>
    <blockquote>{profile.source_quote}</blockquote>
    <a href={profile.source_url} target="_blank" rel="noopener noreferrer">{zh ? '查看官方文档 ↗' : 'Official documentation ↗'}</a>
    <span className="muted"> · {zh ? `文档核对 ${profile.reviewed_at}，未实测专业任务` : `Documentation reviewed ${profile.reviewed_at}; tasks not run`}</span>
  </section>;
}
