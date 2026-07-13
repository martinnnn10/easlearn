import { useEffect, useState } from "react";

export interface ScrollProgressState {
  /** Fill ratio 0–1 (clamped at bottom) */
  progress: number;
  /** Fade-in opacity over first 5% of scroll */
  opacity: number;
  /** True when user has scrolled past top */
  visible: boolean;
}

const FADE_IN_SCROLL_FRACTION = 0.05;

/**
 * Tracks legacy lesson reading progress through the document.
 * Hidden at scroll top; fades in over the first 5% of scroll distance.
 */
export function useScrollProgress(): ScrollProgressState {
  const [state, setState] = useState<ScrollProgressState>({
    progress: 0,
    opacity: 0,
    visible: false,
  });

  useEffect(() => {
    let rafId = 0;

    const update = () => {
      const scrollTop = window.scrollY;
      if (scrollTop <= 0) {
        setState({ progress: 0, opacity: 0, visible: false });
        return;
      }
      const scrollHeight = Math.max(
        document.documentElement.scrollHeight,
        document.body.scrollHeight
      );
      const clientHeight = window.innerHeight;
      const scrollable = scrollHeight - clientHeight;
      if (scrollable <= 0) {
        setState({ progress: 0, opacity: 0, visible: false });
        return;
      }
      const atBottom = scrollTop + clientHeight >= scrollHeight - 2;
      const progress = atBottom ? 1 : Math.min(1, scrollTop / scrollable);
      const opacity = Math.min(1, progress / FADE_IN_SCROLL_FRACTION);
      setState({ progress, opacity, visible: true });
    };

    const scheduleUpdate = () => {
      update();
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(update);
    };

    scheduleUpdate();
    window.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("resize", scheduleUpdate, { passive: true });
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("scroll", scheduleUpdate);
      window.removeEventListener("resize", scheduleUpdate);
    };
  }, []);

  return state;
}
