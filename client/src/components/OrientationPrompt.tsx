import { motion } from "framer-motion";
import { RotateCcw, Play } from "lucide-react";
import { useState, useEffect, useCallback } from "react";

interface OrientationPromptProps {
  show: boolean;
  onDismiss?: () => void;
  onEnterImmersive?: () => void;
}

/**
 * Full-screen overlay shown when user is in portrait mode.
 *
 * ORIENTATION DETECTION STRATEGY:
 * This component has its OWN orientation listener as a belt-and-suspenders
 * approach alongside the parent's useOrientation hook. On some mobile browsers
 * (especially iOS Safari, in-app browsers), the parent hook's state update
 * may be delayed or missed. This component directly listens for:
 * 1. resize events (most reliable cross-browser)
 * 2. orientationchange events (legacy but widely supported)
 * 3. screen.orientation change (modern API)
 * 4. Polling fallback every 100ms (fast dismiss, low CPU since it's only active while overlay is shown)
 *
 * When landscape is detected, it calls onDismiss() immediately.
 * A "Continue in Portrait" button is ALWAYS visible (not hidden behind a timer)
 * so users with rotation lock ON can still proceed.
 *
 * PERFORMANCE NOTE: The 100ms polling only runs while the overlay is visible
 * (typically <2 seconds). It does NOT run when show=false.
 */
export default function OrientationPrompt({ show, onDismiss }: OrientationPromptProps) {
  const [secondsWaiting, setSecondsWaiting] = useState(0);

  // FIX 3: Use requestAnimationFrame for immediate check on next paint
  // No setTimeout delays — rAF ensures we read post-layout dimensions
  const checkAndDismiss = useCallback(() => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    // Guard against zero dimensions during transition
    if (w <= 0 || h <= 0) return;
    if (w > h && onDismiss) onDismiss();
  }, [onDismiss]);

  useEffect(() => {
    if (!show) {
      setSecondsWaiting(0);
      return;
    }

    // Count seconds for the "still waiting" message
    const countTimer = setInterval(() => {
      setSecondsWaiting(prev => prev + 1);
    }, 1000);

    // Use rAF for immediate check on next paint frame (no setTimeout delay)
    const handleResize = () => {
      requestAnimationFrame(checkAndDismiss);
    };

    window.addEventListener("resize", handleResize);
    window.addEventListener("orientationchange", handleResize);
    window.screen?.orientation?.addEventListener?.("change", handleResize);

    // Faster polling: 100ms instead of 300ms — this only runs while overlay
    // is visible (short-lived), so CPU impact is negligible. Ensures fast
    // dismiss even in browsers that don't fire resize/orientationchange events.
    const pollInterval = setInterval(checkAndDismiss, 100);

    // Initial check after one frame — use rAF instead of setTimeout
    requestAnimationFrame(checkAndDismiss);

    return () => {
      clearInterval(countTimer);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("orientationchange", handleResize);
      window.screen?.orientation?.removeEventListener?.("change", handleResize);
      clearInterval(pollInterval);
    };
  }, [show, checkAndDismiss]);

  if (!show) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9999] flex items-center justify-center p-6"
      style={{
        background: "linear-gradient(180deg, #020402 0%, #060906 50%, #040604 100%)",
      }}
    >
      <div className="max-w-sm w-full text-center">
        {/* Rotating phone animation */}
        <motion.div
          className="mx-auto mb-6 relative w-24 h-24"
          animate={{ rotate: [0, -90, -90, 0] }}
          transition={{
            duration: 3,
            repeat: Infinity,
            times: [0, 0.3, 0.7, 1],
            ease: "easeInOut",
          }}
        >
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-12 h-20 rounded-2xl border-2 border-emerald-400/60 bg-emerald-500/10 relative shadow-[0_0_20px_oklch(0.55_0.12_155/20%)]">
              <div className="absolute inset-2 rounded-xl bg-emerald-500/5 border border-emerald-500/20" />
              <div className="absolute top-1 left-1/2 -translate-x-1/2 w-4 h-1 rounded-full bg-emerald-500/30" />
              <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-full bg-emerald-500/20" />
            </div>
          </div>
        </motion.div>

        {/* Pulsing rotate icon */}
        <motion.div
          className="mx-auto mb-4 w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center"
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <RotateCcw className="w-4 h-4 text-emerald-400" />
        </motion.div>

        <h2
          className="text-white text-lg font-semibold mb-2"
          style={{ fontFamily: "var(--font-sim-body)" }}
        >
          Rotate to Landscape
        </h2>
        <p className="text-gray-400 text-sm leading-relaxed mb-2">
          The simulator works best in landscape orientation.
        </p>
        <p className="text-gray-500 text-xs leading-relaxed mb-6">
          Turn off rotation lock in your device settings, then rotate your phone sideways.
        </p>

        {/* ALWAYS-VISIBLE continue button — users should never feel stuck */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="space-y-3"
        >
          <button
            onClick={onDismiss}
            className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-lg bg-emerald-600/20 border border-emerald-500/40 text-emerald-400 text-sm font-medium hover:bg-emerald-600/30 active:bg-emerald-600/40 transition-colors"
          >
            <Play className="w-4 h-4" />
            Continue in Portrait Mode
          </button>
          <p className="text-gray-600 text-[11px]">
            Some controls may be cramped in portrait. Landscape recommended.
          </p>
        </motion.div>

        {/* Helpful hint after waiting */}
        {secondsWaiting >= 4 && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-4 text-amber-500/70 text-[11px]"
          >
            Tip: Check that rotation lock is disabled (swipe down from top-right on iPhone, or check Quick Settings on Android)
          </motion.p>
        )}

        {/* EAS branding */}
        <div className="mt-8 flex items-center justify-center gap-2 opacity-40">
          <div className="w-4 h-4 rounded bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
            <span className="text-[7px] font-bold text-emerald-400">⚡</span>
          </div>
          <span className="text-[9px] font-mono text-gray-600 tracking-wider">EAS TRAINING PLATFORM</span>
        </div>
      </div>
    </motion.div>
  );
}
