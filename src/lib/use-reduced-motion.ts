import { useSyncExternalStore } from "react";

/* Reduced-motion preference that is safe to branch rendered content on. motion's
   useReducedMotion reads the media query on the client's first render, but the server
   can't know it, so text chosen from it doesn't match during hydration. This one reports
   false while hydrating and the real value right after. Use it where the preference
   changes what is shown (a finished state, an extra element); keep motion's own hook for
   `initial` values, which only matter on mount. */

const QUERY = "(prefers-reduced-motion: reduce)";

function subscribe(cb: () => void) {
  const m = matchMedia(QUERY);
  m.addEventListener("change", cb);
  return () => m.removeEventListener("change", cb);
}

export function useReducedMotionSafe() {
  return useSyncExternalStore(
    subscribe,
    () => matchMedia(QUERY).matches,
    () => false,
  );
}
