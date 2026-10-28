import React, { createContext, useCallback, useContext, useLayoutEffect, useMemo, useRef, useSyncExternalStore } from "react";
import { useAnimate } from "motion/react-mini";

const ReducedMotion = createContext(true);
const ease = [0.22, 1, 0.36, 1];

export function SiteMotion({ children }) {
  const query = useMemo(() => matchMedia("(prefers-reduced-motion: reduce)"), []);
  const subscribe = useCallback((notify) => {
    if (query.addEventListener) {
      query.addEventListener("change", notify);
      return () => query.removeEventListener("change", notify);
    }
    query.addListener(notify);
    return () => query.removeListener(notify);
  }, [query]);
  const snapshot = useCallback(() => query.matches, [query]);
  const reduced = useSyncExternalStore(subscribe, snapshot, () => true);
  return <ReducedMotion.Provider value={reduced}>{children}</ReducedMotion.Provider>;
}

// Scoped native animations keep React/sticky geometry unchanged and clean up on unmount.
export function Reveal({ as: Element = "div", kind = "section", order = 0, children, ref, onPointerEnter, onPointerLeave, onFocusCapture, ...props }) {
  const preference = useContext(ReducedMotion);
  const reduced = preference || typeof IntersectionObserver === "undefined" || typeof globalThis.Element?.prototype?.animate !== "function";
  const [scope, animate] = useAnimate();
  const active = useRef(null);
  const observer = useRef(null);
  const entered = useRef(false);
  const sequence = useRef(0);
  const hovered = useRef(false);
  const attach = useCallback((node) => {
    scope.current = node;
    if (typeof ref === "function") return ref(node);
    if (ref) ref.current = node;
  }, [scope, ref]);
  const stop = useCallback(() => {
    sequence.current++;
    active.current?.cancel();
    active.current = null;
  }, []);
  const finish = useCallback(() => {
    stop();
    observer.current?.disconnect();
    if (scope.current) {
      scope.current.style.opacity = "1";
      scope.current.style.transform = "none";
    }
  }, [scope, stop]);
  const play = useCallback((frames, options, done) => {
    // Cancellation is safe even when React hides/unmounts the animated element.
    const keyframes = typeof frames.transform === "string" && scope.current
      ? { ...frames, transform: [getComputedStyle(scope.current).transform, frames.transform] }
      : frames;
    stop();
    const ticket = sequence.current;
    const controls = animate(scope.current, keyframes, options);
    active.current = controls;
    controls.then(() => {
      if (ticket !== sequence.current || !scope.current) return;
      controls.cancel();
      active.current = null;
      done?.(scope.current);
    });
  }, [scope, animate, stop]);

  useLayoutEffect(() => {
    const node = scope.current;
    if (!node) return;
    if (reduced) {
      entered.current = true;
      hovered.current = false;
      finish();
      return;
    }
    if (entered.current) return;
    const reveal = () => {
      if (entered.current) return;
      entered.current = true;
      observer.current?.disconnect();
      const offset = kind === "quiet" ? 0 : kind === "hero" ? 16 : 10;
      play({ opacity: [kind === "quiet" ? 0.75 : 0, 1], transform: [`translateY(${offset}px)`, "none"] },
        { duration: 0.45, delay: Math.max(0, Math.min(3, order)) * 0.045, ease },
        () => finish());
    };
    node.style.opacity = kind === "quiet" ? "0.75" : "0";
    if (kind === "hero" || kind === "quiet") reveal();
    else {
      observer.current = new IntersectionObserver((entries) => {
        if (entries.some(entry => entry.isIntersecting)) reveal();
      }, { threshold: 0.04 });
      observer.current.observe(node);
    }
    return () => finish();
  }, [scope, kind, order, reduced, play, finish]);

  return <Element {...props} ref={attach} data-motion={kind}
    onFocusCapture={(event) => {
      // Pointer focus must not move the target between pointerdown and click.
      // Keyboard focus still settles content before the user interacts with it.
      if (event.target.matches(":focus-visible")) {
        entered.current = true;
        finish();
      }
      onFocusCapture?.(event);
    }}
    onPointerEnter={(event) => {
      if (kind === "card" && !reduced && event.pointerType === "mouse") {
        entered.current = true;
        hovered.current = true;
        finish();
        play({ transform: ["none", "translateY(-3px)"] }, { duration: 0.18, ease }, node => { node.style.transform = "translateY(-3px)"; });
      }
      onPointerEnter?.(event);
    }}
    onPointerLeave={(event) => {
      if (hovered.current && !reduced) {
        hovered.current = false;
        play({ transform: "none" }, { duration: 0.18, ease }, () => finish());
      }
      onPointerLeave?.(event);
    }}
  >{children}</Element>;
}
