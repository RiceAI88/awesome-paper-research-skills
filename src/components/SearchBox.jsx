import React, { lazy, useEffect, useRef, useState } from "react";
import { Input } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import { suggestedTaskIds } from "../search";
import { DeferredFeature } from "./DeferredFeature";
const SearchSuggestions = lazy(() => import("./SearchSuggestions"));
export function SearchBox({ inputRef, state, update, items, taskOptions, t }) {
  const [draft, setDraft] = useState(state.query);
  const [focused, setFocused] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [requested, setRequested] = useState(false);
  const composing = useRef(false);
  const keyHandler = useRef(null);
  useEffect(() => setDraft(state.query), [state.query]);
  function commit(value) {
    setDraft(value);
    setExpanded(true);
    update((previous) => ({ ...previous, query: value }));
  }
  return (
    <div className="hero-search">
      <label htmlFor="searchInput">{t("searchLabel")}</label>
      <Input
        ref={inputRef}
        id="searchInput"
        type="search"
        size="large"
        allowClear
        autoComplete="off"
        prefix={<SearchOutlined aria-hidden="true" />}
        placeholder={t("searchPlaceholder")}
        value={draft}
        onFocus={() => {
          setRequested(true);
          setFocused(true);
          setExpanded(true);
        }}
        onBlur={() => {
          setFocused(false);
          setExpanded(false);
        }}
        onChange={(event) => {
          setDraft(event.target.value);
          if (!composing.current) commit(event.target.value);
        }}
        onCompositionStart={() => {
          composing.current = true;
          setExpanded(false);
        }}
        onCompositionEnd={(event) => {
          composing.current = false;
          commit(event.currentTarget.value);
        }}
        onKeyDown={(event) => {
          if (
            !composing.current &&
            !event.nativeEvent.isComposing &&
            event.keyCode !== 229
          )
            keyHandler.current?.(event);
        }}
      />
      {requested && (
        <DeferredFeature t={t} loadingFallback={null}>
          <SearchSuggestions
            taskIds={suggestedTaskIds(state.query)}
            {...{
              state,
              update,
              items,
              taskOptions,
              t,
              focused,
              expanded,
              keyHandler,
            }}
            expand={() => setExpanded(true)}
            dismiss={() => setExpanded(false)}
            inputRef={inputRef}
          />
        </DeferredFeature>
      )}
    </div>
  );
}
