import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { SearchHighlight } from "./SearchHighlight";
export default function SearchSuggestions({
  state,
  update,
  items,
  taskOptions,
  taskIds,
  t,
  focused,
  expanded,
  expand,
  dismiss,
  keyHandler,
  inputRef,
}) {
  const [active, setActive] = useState(-1);
  const listRef = useRef(null);
  useEffect(
    () => setActive(-1),
    [
      state.query,
      state.task,
      state.category,
      state.agent,
      state.favOnly,
      state.sort,
      state.lang,
      focused,
    ],
  );
  useEffect(() => {
    if (!expanded) setActive(-1);
  }, [expanded]);
  const q = state.query.trim().toLowerCase();
  const options = q
    ? [
        ...taskOptions
          .filter(
            (task) =>
              taskIds.includes(task.id) || task.label.toLowerCase().includes(q),
          )
          .slice(0, 2)
          .map((task) => ({ ...task, kind: "task" })),
        ...items.slice(0, 5).map((item) => ({
          id: item.repo,
          label: item.repo,
          item,
          kind: "repo",
        })),
      ]
    : [];
  const open = focused && expanded && options.length > 0;
  const activeOption = open && options[active];
  useEffect(() => {
    if (open && active >= 0)
      listRef.current
        ?.querySelector(`#search-option-${active}`)
        ?.scrollIntoView({ block: "nearest" });
  }, [open, active]);
  useLayoutEffect(() => {
    keyHandler.current = keyDown;
    return () => {
      keyHandler.current = null;
    };
  });
  useLayoutEffect(() => {
    const input = inputRef.current?.input;
    if (!input) return;
    input.setAttribute("aria-autocomplete", "list");
    if (open) input.setAttribute("aria-controls", "search-suggestions");
    else input.removeAttribute("aria-controls");
    if (activeOption)
      input.setAttribute("aria-activedescendant", `search-option-${active}`);
    else input.removeAttribute("aria-activedescendant");
    return () => {
      input.removeAttribute("aria-controls");
      input.removeAttribute("aria-activedescendant");
    };
  }, [open, active, activeOption, inputRef]);
  function choose(option) {
    dismiss();
    setActive(-1);
    if (option.kind === "task") {
      update((previous) => ({
        ...previous,
        query: "",
        task: option.id,
        category: "all",
      }));
    } else update((previous) => ({ ...previous, repo: option.id }));
  }
  function keyDown(event) {
    if (event.nativeEvent.isComposing || event.keyCode === 229) return;
    if (["ArrowDown", "ArrowUp"].includes(event.key) && options.length) {
      event.preventDefault();
      expand();
      setActive((previous) =>
        event.key === "ArrowDown"
          ? (previous + 1) % options.length
          : previous <= 0
            ? options.length - 1
            : previous - 1,
      );
    } else if (event.key === "Enter") {
      if (activeOption) {
        event.preventDefault();
        choose(activeOption);
      } else dismiss();
    } else if (event.key === "Escape") {
      if (open) {
        event.preventDefault();
        event.stopPropagation();
      }
      dismiss();
      setActive(-1);
    } else if (event.key === "Tab") dismiss();
  }
  return (
    <>
      <span className="sr-only" role="status">
        {open
          ? t("searchSuggestionCount").replace("{count}", options.length)
          : ""}
      </span>
      {open && (
        <div className="search-popup">
          <ul
            ref={listRef}
            id="search-suggestions"
            role="listbox"
            aria-label={t("searchSuggestions")}
          >
            {options.map((option, index) => (
              <li
                key={`${option.kind}-${option.id}`}
                id={`search-option-${index}`}
                role="option"
                aria-selected={index === active}
                data-suggestion-kind={option.kind}
                data-suggestion-repo={
                  option.kind === "repo" ? option.id : undefined
                }
                onPointerDown={(event) => event.preventDefault()}
                onClick={() => choose(option)}
                onMouseEnter={() => setActive(index)}
              >
                <div className="search-option-heading">
                  <span>
                    <SearchHighlight text={option.label} query={state.query} />
                  </span>
                  <small>
                    {t(
                      option.kind === "task"
                        ? "searchTask"
                        : "searchRepository",
                    )}
                  </small>
                </div>
                {option.item?.description && (
                  <div className="search-option-description">
                    <SearchHighlight
                      text={option.item.description}
                      query={state.query}
                    />
                  </div>
                )}
              </li>
            ))}
          </ul>
          <div className="search-suggestion-hint">
            {t("searchSuggestionHint")}
          </div>
        </div>
      )}
    </>
  );
}
