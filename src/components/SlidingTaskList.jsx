import React, { useLayoutEffect, useRef } from "react";

export function SlidingTaskList({ value, title, children }) {
  const container = useRef(null);
  useLayoutEffect(() => {
    const list = container.current;
    const measure = () => {
      const selected = list.querySelector('[aria-pressed="true"]');
      if (!selected) return;
      const outer = list.getBoundingClientRect();
      const target = selected.getBoundingClientRect();
      list.style.setProperty(
        "--task-line-x",
        `${target.left - outer.left + list.scrollLeft - list.clientLeft}px`,
      );
      list.style.setProperty("--task-line-width", `${target.width}px`);
    };
    measure();
    const observer =
      typeof ResizeObserver === "function" ? new ResizeObserver(measure) : null;
    observer?.observe(list);
    list
      .querySelectorAll("button")
      .forEach((button) => observer?.observe(button));
    window.addEventListener("resize", measure);
    return () => {
      observer?.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [value]);
  return (
    <div className="task-list" title={title} ref={container}>
      {children}
      <span className="task-selection-indicator" aria-hidden="true" />
    </div>
  );
}
