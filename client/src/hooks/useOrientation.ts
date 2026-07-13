import { useState, useEffect, useCallback, useRef } from "react";

export type Orientation = "portrait" | "landscape";

interface OrientationState {
  orientation: Orientation;
  isMobile: boolean;
  isTablet: boolean;
  screenWidth: number;
  screenHeight: number;
}

/**
 * Detects device orientation and screen dimensions.
 * 
 * Uses multiple event-based strategies for broad compatibility:
 * 1. Primary: window.innerWidth > window.innerHeight (works everywhere)
 * 2. Events: resize, orientationchange, matchMedia, screen.orientation
 * 
 * NOTE: 500ms polling was REMOVED — it wasted CPU/battery on mobile and could
 * cause bounce detections during rotation animations. The four event listeners
 * (resize, orientationchange, matchMedia, screen.orientation) provide sufficient
 * coverage for all browsers including in-app webviews.
 * 
 * FIX: 300ms debounce prevents premature state updates during iOS Safari's
 * rotation animation (~300-400ms). Zero/invalid dimensions are rejected.
 */
export function useOrientation(): OrientationState {
  const getState = useCallback((): OrientationState => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const isMobile = w < 768 || (w < 1024 && "ontouchstart" in window);
    const isTablet = w >= 768 && w < 1024 && "ontouchstart" in window;
    const orientation: Orientation = w > h ? "landscape" : "portrait";
    return { orientation, isMobile, isTablet, screenWidth: w, screenHeight: h };
  }, []);

  const [state, setState] = useState<OrientationState>(getState);
  const stateRef = useRef(state);
  stateRef.current = state;

  useEffect(() => {
    let debounceTimer: ReturnType<typeof setTimeout> | null = null;

    const update = () => {
      // Cancel any pending debounced update
      if (debounceTimer) clearTimeout(debounceTimer);

      // Debounce by 300ms to let iOS Safari finish its rotation animation
      // and report correct viewport dimensions.
      debounceTimer = setTimeout(() => {
        const newState = getState();

        // GUARD: Reject zero/invalid dimensions (iOS Safari reports 0 briefly during rotation)
        if (newState.screenWidth <= 0 || newState.screenHeight <= 0) return;

        const prev = stateRef.current;
        // Only update if something meaningful changed
        if (
          newState.orientation !== prev.orientation ||
          newState.isMobile !== prev.isMobile ||
          newState.isTablet !== prev.isTablet ||
          Math.abs(newState.screenWidth - prev.screenWidth) > 10 ||
          Math.abs(newState.screenHeight - prev.screenHeight) > 10
        ) {
          setState(newState);
        }
      }, 300);
    };

    // Listen to all possible orientation change signals
    window.addEventListener("resize", update);
    window.addEventListener("orientationchange", update);

    // matchMedia change for browsers that support it
    const mql = window.matchMedia?.("(orientation: landscape)");
    if (mql?.addEventListener) {
      mql.addEventListener("change", update);
    }

    // Screen orientation API
    window.screen?.orientation?.addEventListener?.("change", update);

    return () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      window.removeEventListener("resize", update);
      window.removeEventListener("orientationchange", update);
      if (mql?.removeEventListener) {
        mql.removeEventListener("change", update);
      }
      window.screen?.orientation?.removeEventListener?.("change", update);
    };
  }, [getState]);

  return state;
}
