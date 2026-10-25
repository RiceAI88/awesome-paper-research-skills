import React from "react";
// These site panels need only a body, without Card's tabs/loading machinery.
export function Panel({ children, className = "", bodyStyle, ...props }) {
  return (
    <div {...props} className={`panel ${className}`}>
      <div className="panel-body" style={bodyStyle}>
        {children}
      </div>
    </div>
  );
}
