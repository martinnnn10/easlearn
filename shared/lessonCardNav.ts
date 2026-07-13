/** Pure navigation helper for slide lesson player. */
export function clampCardIndex(index: number, total: number): number {
  return Math.max(0, Math.min(index, total - 1));
}

/** Local-only QA bypass: `?qa=full` on localhost for full-deck screenshots. */
export function isLocalQaFullDeck(): boolean {
  if (typeof window === "undefined") return false;
  const params = new URLSearchParams(window.location.search);
  return (
    params.get("qa") === "full" &&
    (import.meta.env.DEV ||
      window.location.hostname === "127.0.0.1" ||
      window.location.hostname === "localhost")
  );
}
