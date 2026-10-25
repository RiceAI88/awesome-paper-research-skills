import React, { useEffect, useState } from "react";
export function BackToTop({ label, comparisonOpen }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const measure = () => setVisible(window.scrollY > window.innerHeight);
    measure();
    addEventListener("scroll", measure, { passive: true });
    addEventListener("resize", measure);
    return () => {
      removeEventListener("scroll", measure);
      removeEventListener("resize", measure);
    };
  }, []);
  if (!visible) return null;
  return (
    <button
      type="button"
      className={`back-to-top${comparisonOpen ? " above-comparison" : ""}`}
      data-testid="back-to-top"
      aria-label={label}
      title={label}
      onClick={() => {
        window.scrollTo({
          top: 0,
          behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
            ? "instant"
            : "smooth",
        });
        document.querySelector("h1")?.focus({ preventScroll: true });
      }}
    >
      <span aria-hidden="true">↑</span>
      <span>{label}</span>
    </button>
  );
}
