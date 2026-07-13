/**
 * PWAInstallPrompt — Shows a lightweight prompt on iOS Safari suggesting
 * the user add the app to their Home Screen for full-screen simulator experience.
 * 
 * Only shows:
 * - On iOS Safari (not already in standalone mode)
 * - On simulator-related pages
 * - Once per session (dismissed via sessionStorage)
 */
import { useState, useEffect } from "react";
import { X, Share, Plus } from "lucide-react";

export function PWAInstallPrompt() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Only show on iOS Safari, not in standalone mode
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true;
    const dismissed = sessionStorage.getItem("pwa-prompt-dismissed");

    if (isIOS && !isStandalone && !dismissed) {
      // Show after a short delay so it doesn't flash on page load
      const timer = setTimeout(() => setShow(true), 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  const dismiss = () => {
    setShow(false);
    sessionStorage.setItem("pwa-prompt-dismissed", "1");
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-[9999] pointer-events-none animate-in slide-in-from-bottom-4 duration-300">
      <div className="pointer-events-auto bg-gray-900/95 backdrop-blur-lg border border-emerald-500/30 rounded-2xl p-4 shadow-2xl shadow-emerald-500/10">
        <button
          onClick={dismiss}
          className="absolute top-3 right-3 text-gray-400 hover:text-white"
          aria-label="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
            <span className="text-lg">⚡</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white mb-1">
              Full-Screen Simulator
            </p>
            <p className="text-xs text-gray-400 leading-relaxed">
              For the best experience, add EASLearn to your Home Screen. Tap{" "}
              <Share className="w-3 h-3 inline-block text-blue-400 -mt-0.5" />{" "}
              then{" "}
              <span className="inline-flex items-center gap-0.5 text-gray-300">
                <Plus className="w-3 h-3" /> Add to Home Screen
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
