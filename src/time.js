export function exactTimestamp(value, lang) {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "—";
  return (
    new Intl.DateTimeFormat(lang === "zh" ? "zh-CN" : "en-GB", {
      timeZone: "Asia/Shanghai",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }).format(date) + " UTC+8"
  );
}
export function relativeTimestamp(value, lang, now = Date.now()) {
  const time = Date.parse(value);
  if (!Number.isFinite(time)) return "—";
  const seconds = Math.min(0, (time - now) / 1000);
  const [unit, divisor] =
    Math.abs(seconds) < 60
      ? ["second", 1]
      : Math.abs(seconds) < 3600
        ? ["minute", 60]
        : Math.abs(seconds) < 86400
          ? ["hour", 3600]
          : ["day", 86400];
  return new Intl.RelativeTimeFormat(lang === "zh" ? "zh-CN" : "en", {
    numeric: "auto",
  }).format(Math.ceil(seconds / divisor), unit);
}
