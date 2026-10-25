import { createSearch } from "./search.js";
export function highlightParts(text, query) {
  const source = String(text || "");
  const ranges = [];
  for (const pattern of createSearch(query).patterns) {
    pattern.lastIndex = 0;
    for (const match of source.matchAll(pattern))
      ranges.push([match.index, match.index + match[0].length]);
  }
  const merged = [];
  for (const range of ranges.sort((a, b) => a[0] - b[0] || b[1] - a[1])) {
    const last = merged.at(-1);
    if (last && range[0] <= last[1]) last[1] = Math.max(last[1], range[1]);
    else merged.push([...range]);
  }
  const parts = [];
  let cursor = 0;
  for (const [start, end] of merged) {
    if (start > cursor)
      parts.push({ text: source.slice(cursor, start), match: false });
    parts.push({ text: source.slice(start, end), match: true });
    cursor = end;
  }
  if (cursor < source.length || !parts.length)
    parts.push({ text: source.slice(cursor), match: false });
  return parts;
}
