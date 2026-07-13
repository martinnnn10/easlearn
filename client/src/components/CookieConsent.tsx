/**
 * CookieConsent — Minimal GDPR/CCPA-compatible cookie consent banner.
 * Shows once per browser session; stores acceptance in localStorage.
 * Auto-hides on simulator/labs pages to maximize viewport space.
 * Links to /privacy for full policy details.
 */
import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Cookie, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const CONSENT_KEY = "eas_cookie_consent";

/** Routes where the cookie banner should be suppressed to maximize viewport */
const SUPPRESSED_ROUTES = ["/simulator", "/labs/sandbox"];

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);
  const [location] = useLocation();

  useEffect(() => {
    // Only show if user hasn't already accepted
    const accepted = localStorage.getItem(CONSENT_KEY);
    if (!accepted) {
      // Small delay so it doesn't flash on page load
      const timer = setTimeout(() => setVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem(CONSENT_KEY, "accepted");
    setVisible(false);
  };

  const handleDecline = () => {
    localStorage.setItem(CONSENT_KEY, "essential-only");
    setVisible(false);
  };

  // Hide on simulator/labs pages to reclaim viewport space
  const isSuppressed = SUPPRESSED_ROUTES.some(route => location.startsWith(route));

  if (!visible || isSuppressed) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 animate-in slide-in-from-bottom-4 duration-500">
      <div className="max-w-4xl mx-auto bg-[#0d120d]/95 border border-gray-800/60 rounded-xl p-4 md:p-5 backdrop-blur-lg shadow-2xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <Cookie className="w-5 h-5 text-emerald-400 mt-0.5 shrink-0" />
            <div className="text-sm text-gray-300 leading-relaxed">
              <p>
                We use essential cookies for authentication and platform functionality.
                Analytics cookies help us improve your experience.{" "}
                <Link href="/privacy" className="text-emerald-400 hover:text-emerald-300 underline underline-offset-2">
                  Privacy Policy
                </Link>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDecline}
              className="flex-1 sm:flex-initial border-gray-700/40 text-gray-400 hover:text-gray-200 hover:bg-white/[3%] text-xs"
            >
              Essential Only
            </Button>
            <Button
              size="sm"
              onClick={handleAccept}
              className="flex-1 sm:flex-initial bg-emerald-600 hover:bg-emerald-500 text-white text-xs"
            >
              Accept All
            </Button>
            <button
              onClick={handleDecline}
              className="p-1.5 text-gray-500 hover:text-gray-300 transition-colors sm:hidden"
              aria-label="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
