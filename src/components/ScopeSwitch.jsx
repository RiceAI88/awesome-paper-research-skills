import React from 'react';
export function ScopeSwitch({checked,onChange,size,...props}) {
  return <button {...props} type="button" role="switch" aria-checked={checked} className="scope-switch" onClick={()=>onChange(!checked)}><span /></button>;
}
