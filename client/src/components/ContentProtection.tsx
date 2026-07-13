/**
 * ContentProtection Component
 * Wraps protected content to prevent casual copying/scraping.
 * Disables: right-click context menu, text selection, drag, and common dev-tool shortcuts.
 * NOTE: This is a deterrent layer — it will not stop a determined developer,
 * but it prevents casual users from copying scenario content.
 */
import { useEffect, useRef } from "react";

interface ContentProtectionProps {
  children: React.ReactNode;
  className?: string;
}

export default function ContentProtection({ children, className = "" }: ContentProtectionProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Block Ctrl+U (view source), Ctrl+S (save), Ctrl+Shift+I (dev tools),
      // Ctrl+Shift+J (console), Ctrl+Shift+C (inspect element), F12
      if (
        (e.ctrlKey && e.key === "u") ||
        (e.ctrlKey && e.key === "s") ||
        (e.ctrlKey && e.shiftKey && e.key === "I") ||
        (e.ctrlKey && e.shiftKey && e.key === "J") ||
        (e.ctrlKey && e.shiftKey && e.key === "C") ||
        e.key === "F12"
      ) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div
      ref={containerRef}
      className={className}
      onContextMenu={(e) => e.preventDefault()}
      onCopy={(e) => e.preventDefault()}
      onCut={(e) => e.preventDefault()}
      onDragStart={(e) => e.preventDefault()}
      style={{
        userSelect: "none",
        WebkitUserSelect: "none",
        MozUserSelect: "none",
        msUserSelect: "none",
        touchAction: "manipulation",
        WebkitTouchCallout: "none",
      } as React.CSSProperties}
    >
      {children}
    </div>
  );
}
