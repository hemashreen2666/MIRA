// Tiny in-app event bus so the mirror's live capture loop can tell the rest
// of the dashboard (skin analysis, recommendations, expression, wellness) to
// refetch when a new on-device analysis lands — without threading a store
// or context through every component.
import { useEffect, useRef } from "react";

const target = new EventTarget();
const EVENT = "mira:analysis-complete";

export function emitAnalysisComplete(detail) {
  target.dispatchEvent(new CustomEvent(EVENT, { detail }));
}

/** Runs `handler(detail)` every time a fresh analysis completes. */
export function useAnalysisComplete(handler) {
  const ref = useRef(handler);

  useEffect(() => {
    ref.current = handler;
  });

  useEffect(() => {
    const fn = (event) => ref.current?.(event.detail);
    target.addEventListener(EVENT, fn);
    return () => target.removeEventListener(EVENT, fn);
  }, []);
}
