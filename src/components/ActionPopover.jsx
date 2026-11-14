import React, { useId, useRef, useState } from 'react';
export function ActionPopover({label, children, className='', count=0, filter=false, lang='zh'}) {
 const id=useId(), trigger=useRef(null), panel=useRef(null);
 const [open,setOpen]=useState(false), [position,setPosition]=useState({});
 return <div className={`action-popover ${className}`}>
  <button ref={trigger} type="button" className="popover-trigger" popoverTarget={id} aria-expanded={open} aria-controls={id} onClick={()=>{
   const box=trigger.current.getBoundingClientRect();
   setPosition({top:box.bottom+8,left:Math.max(12,Math.min(innerWidth-352,box.right-340))});
  }}>{filter && <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d="M3 5h18l-7 8v6l-4 2v-8z"/></svg>}{label}{count>0 && <span className="filter-condition-count">{count}</span>}</button>
  <div ref={panel} id={id} popover="auto" role="dialog" aria-label={filter ? (lang==='zh'?'筛选条件':'Filters') : label} className="action-popover-panel" style={{top:position.top, '--popover-left':`${position.left || 12}px`}} onToggle={e=>setOpen(e.newState==='open')}>
   <div className="popover-panel-heading"><strong>{filter ? (lang==='zh'?'筛选条件':'Filters') : label}</strong><button type="button" aria-label={lang==='zh'?'关闭':'Close'} onClick={()=>{panel.current.hidePopover();trigger.current.focus();}}>×</button></div>
   {typeof children === "function" ? (open ? children() : null) : children}
   {filter && <button type="button" className="filter-done" onClick={()=>{panel.current.hidePopover();trigger.current.focus();}}>{lang==='zh'?'完成':'Done'}</button>}
  </div>
 </div>;
}
