import { useState, useEffect, useCallback, useRef } from "react";

interface ImmersiveModeState {
  isImmersive: boolean;
  isFullscreen: boolean;
  enterImmersive: () => void;
  exitImmersive: () => void;
  toggleImmersive: () => void;
}

/**
 * Manages immersive/fullscreen mode for the simulator.
 * Hides browser chrome and locks to landscape on supported devices.
 */
export function useImmersiveMode(): ImmersiveModeState {
  const [isImmersive, setIsImmersive] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLElement | null>(null);

  // Track fullscreen state changes
  useEffect(() => {
    const handleChange = () => {
      const fs = !!document.fullscreenElement;
      setIsFullscreen(fs);
      if (!fs) setIsImmersive(false);
    };
    document.addEventListener("fullscreenchange", handleChange);
    document.addEventListener("webkitfullscreenchange", handleChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleChange);
      document.removeEventListener("webkitfullscreenchange", handleChange);
    };
  }, []);

  const enterImmersive = useCallback(async () => {
    setIsImmersive(true);

    // Try fullscreen
    try {
      const el = document.documentElement;
      if (el.requestFullscreen) {
        await el.requestFullscreen();
      } else if ((el as any).webkitRequestFullscreen) {
        await (el as any).webkitRequestFullscreen();
      }
    } catch {
      // Fullscreen may be blocked — immersive mode still works without it
    }

    // Try locking to landscape on mobile
    try {
      if ((screen.orientation as any)?.lock) {
        await (screen.orientation as any).lock("landscape");
      }
    } catch {
      // Orientation lock not supported on most browsers — that's fine
    }
  }, []);

  const exitImmersive = useCallback(async () => {
    setIsImmersive(false);

    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else if ((document as any).webkitExitFullscreen) {
        await (document as any).webkitExitFullscreen();
      }
    } catch {
      // Ignore
    }

    try {
      if ((screen.orientation as any)?.unlock) {
        (screen.orientation as any).unlock();
      }
    } catch {
      // Ignore
    }
  }, []);

  const toggleImmersive = useCallback(() => {
    if (isImmersive) {
      exitImmersive();
    } else {
      enterImmersive();
    }
  }, [isImmersive, enterImmersive, exitImmersive]);

  return { isImmersive, isFullscreen, enterImmersive, exitImmersive, toggleImmersive };
}
