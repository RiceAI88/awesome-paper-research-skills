import React, { useEffect, useRef, useState } from "react";
import { Statistic } from "antd";

export function AnimatedStatistic({ title, value, prefix, lang }) {
  const played = useRef(false);
  const [displayed, setDisplayed] = useState(() =>
    matchMedia("(prefers-reduced-motion: reduce)").matches ? value : 0,
  );
  useEffect(() => {
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    let frame;
    const finish = () => {
      cancelAnimationFrame(frame);
      played.current = true;
      setDisplayed(value);
    };
    if (played.current || media.matches) {
      finish();
      return;
    }
    const started = performance.now();
    const tick = (now) => {
      const progress = Math.min(1, Math.max(0, (now - started) / 1000));
      setDisplayed(Math.round(value * (1 - Math.pow(1 - progress, 3))));
      if (progress < 1) frame = requestAnimationFrame(tick);
      else played.current = true;
    };
    const change = () => {
      if (media.matches) finish();
    };
    media.addEventListener("change", change);
    frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame);
      media.removeEventListener("change", change);
    };
  }, [value]);
  const format = (number) =>
    new Intl.NumberFormat(lang === "zh" ? "zh-CN" : "en-US").format(
      Number(number),
    );
  return (
    <div role="group" aria-label={`${title}: ${prefix || ""}${format(value)}`}>
      <Statistic
        aria-hidden="true"
        title={title}
        value={displayed}
        prefix={prefix}
        formatter={format}
        valueStyle={{
          fontSize: 30,
          fontWeight: 600,
          fontVariantNumeric: "tabular-nums",
        }}
      />
    </div>
  );
}
