import catalog from "../config/disciplines.json" with { type: "json" };
export const DISCIPLINES = catalog.disciplines;
export function profileFor(item) {
  const entry = catalog.profiles[String(item?.repo || '').toLowerCase()];
  return entry?.reviewed_at && entry.evidence === true ? entry : null;
}
export function selectedDiscipline(state) {
  return DISCIPLINES.find(d => d.id === state.discipline);
}
export function disciplineFit(item, state) {
  const group = selectedDiscipline(state);
  if (!group) return 'all';
  const profile = profileFor(item);
  if (!profile) return 'unreviewed';
  const matches = profile.disciplines.includes(group.id) ||
    (state.major && state.major !== 'all'
      ? profile.majors.includes(state.major)
      : group.majors.some(m => profile.majors.includes(m.id)));
  return matches ? 'specific' : profile.common ? 'common' : 'other';
}
export function matchesDiscipline(item, state) {
  const fit = disciplineFit(item, state);
  return fit === 'all' || fit === 'specific' || (fit === 'common' && state.includeCommon !== false);
}
export function uniqueRepositories(items) {
  return [...new Map(items.map(i => [i.repo.toLowerCase(), i])).values()];
}
export function disciplineCounts(items) {
  const unique = uniqueRepositories(items);
  return Object.fromEntries(DISCIPLINES.map(d => [d.id, unique.filter(i => disciplineFit(i, { discipline:d.id, major:'all' }) === 'specific').length]));
}
export function professionLabel(state, lang = 'zh') {
  const group = selectedDiscipline(state);
  return group?.majors.find(m => m.id === state.major)?.[lang] || group?.[lang] || (lang === 'zh' ? '全部专业' : 'All disciplines');
}
