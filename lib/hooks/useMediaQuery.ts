"use client";

import { useLayoutEffect, useState } from "react";

/**
 * Subscribes to `window.matchMedia`. Uses `useLayoutEffect` so the first paint
 * after mount matches the real viewport (avoids a one-frame `useEffect` flash).
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useLayoutEffect(() => {
    const media = window.matchMedia(query);
    setMatches(media.matches);
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches);
    media.addEventListener("change", handler);
    return () => media.removeEventListener("change", handler);
  }, [query]);

  return matches;
}
