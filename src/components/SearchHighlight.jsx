import React from "react";
import { highlightParts } from "../highlight";
export function SearchHighlight({ text, query = "" }) {
  if (!query.trim()) return text;
  return highlightParts(text, query).map((part, index) =>
    part.match ? (
      <mark className="search-match" key={index}>
        {part.text}
      </mark>
    ) : (
      part.text
    ),
  );
}
