import React from 'react';
import { profileFor, disciplineFit } from '../disciplines';
export function DisciplineFitBadge({item,state}) {
 if (!state.discipline || state.discipline === 'all' || !profileFor(item)) return null;
 const specific=disciplineFit(item,state)==='specific', zh=state.lang==='zh';
 return <span className="discipline-card-fit">{specific ? (zh?'本专业适用':'Specialized') : (zh?'跨专业通用':'General research')}</span>;
}
