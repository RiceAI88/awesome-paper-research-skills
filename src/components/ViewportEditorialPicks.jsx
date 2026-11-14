import React, {lazy, useEffect, useRef, useState} from 'react';
import { DeferredFeature } from './DeferredFeature';
const EditorialPicks=lazy(()=>import('./EditorialPicks').then(module=>({default:module.EditorialPicks})));
export function ViewportEditorialPicks(props) {
  const host=useRef(null), [active,setActive]=useState(false);
  useEffect(()=>{
    if(active || !host.current) return;
    if(typeof IntersectionObserver==='undefined') {setActive(true);return;}
    const observer=new IntersectionObserver(entries=>{
      if(entries.some(entry=>entry.isIntersecting)) {setActive(true);observer.disconnect();}
    },{rootMargin:'300px'});
    observer.observe(host.current);
    return ()=>observer.disconnect();
  },[active]);
  const placeholder=<section className="editorial-viewport-placeholder" aria-busy="true"><h2>{props.t('editorialTitle')}</h2><p role="status" className="muted">{props.t('featureLoading')}</p></section>;
  return <div ref={host} data-testid="editorial-viewport">{active ? <DeferredFeature t={props.t} loadingFallback={placeholder}><EditorialPicks {...props}/></DeferredFeature> : placeholder}</div>;
}
