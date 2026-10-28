import React from "react";
import { Reveal } from "./SiteMotion";
// These site panels need only a body, without Card's tabs/loading machinery.
export function Panel({ children, className = "", bodyStyle, animated = false, motionOrder = 0, ...props }) {
  const Element = animated ? Reveal : "div";
  return (
    <Element {...props} {...(animated ? { kind: "card", order: motionOrder } : {})} className={`panel ${className}`}>
      <div className="panel-body" style={bodyStyle}>
        {children}
      </div>
    </Element>
  );
}
