import { useEffect, useRef, useCallback } from "react";

/**
 * iOS Safari has a known issue where overflow:auto/scroll containers inside
 * position:fixed parents with overflow:hidden fail to scroll natively.
 * 
 * This hook:
 * 1. Attaches manual touch event handlers that programmatically scroll the container
 *    using scrollTop, bypassing iOS Safari's broken native scroll recognition.
 * 2. Uses a MutationObserver to detect DOM changes (e.g., PLC tag value updates)
 *    and restores scrollTop ONLY when it was genuinely reset to 0 by a DOM mutation
 *    (not when the user is actively scrolling or the position changed slightly).
 * 
 * The MutationObserver scroll restoration works on ALL platforms (the bug affects any
 * mobile browser where DOM mutations from AnimatePresence reset scrollTop).
 * The manual touch scroll handler only activates on iOS Safari where native scroll
 * recognition fails inside fixed/overflow containers.
 * 
 * FIX (Bug #2): The previous implementation restored scrollTop on ANY mutation that
 * changed it by >2px, which caused repeated auto-scroll jumps when AnimatePresence
 * elements updated every 1.5s. Now it only restores when scrollTop drops to exactly 0
 * (the actual symptom of the PLC re-render bug), and skips restoration for 800ms after
 * user scroll or pointer interaction to avoid fighting accordion expand/collapse.
 */
export function useIOSScroll<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const scrollPosRef = useRef(0);
  const isUserScrolling = useRef(false);
  const isRestoringScroll = useRef(false);
  // Timestamp of last user touch interaction — skip observer restoration briefly after
  const lastUserInteractionRef = useRef(0);
  const suppressRestoreUntilRef = useRef(0);

   // Track scroll position continuously and mark user interaction on scroll / pointer
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const markInteraction = () => {
      lastUserInteractionRef.current = Date.now();
    };
    const handleScroll = () => {
      scrollPosRef.current = el.scrollTop;
      // Skip MutationObserver restoration briefly after user scrolls or clicks inside
      markInteraction();
    };
    el.addEventListener("scroll", handleScroll, { passive: true });
    el.addEventListener("pointerdown", markInteraction, { passive: true });
    return () => {
      el.removeEventListener("scroll", handleScroll);
      el.removeEventListener("pointerdown", markInteraction);
    };
  }, []);

  // MutationObserver to restore scroll position after DOM mutations
  // Only restores when scrollTop was genuinely reset to near-zero (the original bug)
  // and the user is not actively interacting
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new MutationObserver(() => {
      if (isRestoringScroll.current) return;
      if (Date.now() < suppressRestoreUntilRef.current) return;
      // Skip if user recently scrolled or clicked inside the container
      if (Date.now() - lastUserInteractionRef.current < 800) return;
      // Skip if user is actively scrolling (iOS touch handler)
      if (isUserScrolling.current) return;
      // Only restore when scroll was fully reset to top (PLC re-render bug), not partial shifts
      if (scrollPosRef.current > 20 && el.scrollTop === 0) {
        isRestoringScroll.current = true;
        el.scrollTop = scrollPosRef.current;
        requestAnimationFrame(() => {
          isRestoringScroll.current = false;
        });
      }
    });

    observer.observe(el, {
      childList: true,
      subtree: true,
      characterData: true,
    });

    return () => observer.disconnect();
  }, []);

  // iOS-specific touch scroll handler (only needed on iOS where native scroll breaks)
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Only apply manual touch handling on iOS Safari
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    if (!isIOS) return;

    let startY = 0;
    let startScrollTop = 0;

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      startY = e.touches[0].clientY;
      startScrollTop = el.scrollTop;
      isUserScrolling.current = true;
      lastUserInteractionRef.current = Date.now();
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isUserScrolling.current || e.touches.length !== 1) return;

      const currentY = e.touches[0].clientY;
      const deltaY = startY - currentY;
      const newScrollTop = startScrollTop + deltaY;

      const maxScroll = el.scrollHeight - el.clientHeight;
      const canScrollDown = el.scrollTop < maxScroll - 1;
      const canScrollUp = el.scrollTop > 1;
      const scrollingDown = deltaY > 0;
      const scrollingUp = deltaY < 0;

      if ((scrollingDown && canScrollDown) || (scrollingUp && canScrollUp)) {
        e.preventDefault();
        e.stopPropagation();
        el.scrollTop = Math.max(0, Math.min(maxScroll, newScrollTop));
        scrollPosRef.current = el.scrollTop;
      } else if (
        (scrollingDown && !canScrollDown) ||
        (scrollingUp && !canScrollUp)
      ) {
        e.preventDefault();
      }
    };

    const handleTouchEnd = () => {
      isUserScrolling.current = false;
      lastUserInteractionRef.current = Date.now();
    };

    el.addEventListener("touchstart", handleTouchStart, { passive: true });
    el.addEventListener("touchmove", handleTouchMove, { passive: false });
    el.addEventListener("touchend", handleTouchEnd, { passive: true });
    el.addEventListener("touchcancel", handleTouchEnd, { passive: true });

    return () => {
      el.removeEventListener("touchstart", handleTouchStart);
      el.removeEventListener("touchmove", handleTouchMove);
      el.removeEventListener("touchend", handleTouchEnd);
      el.removeEventListener("touchcancel", handleTouchEnd);
    };
  }, []);

  const suppressRestoreFor = useCallback((ms: number) => {
    suppressRestoreUntilRef.current = Date.now() + ms;
  }, []);

  return { ref, suppressRestoreFor };
}
