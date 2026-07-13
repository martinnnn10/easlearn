import { useState, useEffect, useMemo } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, AlertTriangle, Zap, X, ArrowRight, CreditCard } from "lucide-react";

interface TrialBannerProps {
  trialDaysRemaining: number | null;
  trialEndsAt: number | null;
  isTrial: boolean;
  trialExpired: boolean;
  status: string;
}

/**
 * TrialBanner — shows contextual banners based on subscription/trial state:
 * - Active trial with 3+ days: subtle green countdown
 * - Day 5 (2 days left): amber warning
 * - Day 6 (1 day left): red urgent warning
 * - Day 7 (expired): red lock banner with CTA
 * - Past due: amber payment failed banner
 */
export default function TrialBanner({ trialDaysRemaining, trialEndsAt, isTrial, trialExpired, status }: TrialBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  // Reset dismissed state when status changes
  useEffect(() => {
    setDismissed(false);
  }, [status, trialDaysRemaining]);

  // Calculate precise hours/minutes remaining for countdown
  const timeRemaining = useMemo(() => {
    if (!trialEndsAt) return null;
    const now = Date.now();
    const diff = trialEndsAt - now;
    if (diff <= 0) return { days: 0, hours: 0, minutes: 0, expired: true };
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return { days, hours, minutes, expired: false };
  }, [trialEndsAt]);

  // Past due payment banner
  if (status === "past_due") {
    return (
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-amber-900/40 via-amber-900/30 to-amber-900/40 border-b border-amber-500/30"
      >
        <div className="container flex items-center justify-between gap-4 py-2.5 px-4">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-amber-500/15 flex items-center justify-center shrink-0">
              <CreditCard className="w-4 h-4 text-amber-400" />
            </div>
            <p className="text-sm text-amber-200">
              <span className="font-semibold">Payment failed.</span>{" "}
              <span className="hidden sm:inline">Update your payment method to keep access to your training.</span>
            </p>
          </div>
          <Link
            href="/account"
            className="shrink-0 px-4 py-1.5 text-xs font-semibold bg-amber-500 text-black rounded-md hover:bg-amber-400 transition-colors"
          >
            Update Payment
          </Link>
        </div>
      </motion.div>
    );
  }

  // Trial expired banner
  if (trialExpired || (status === "expired")) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-red-900/40 via-red-900/30 to-red-900/40 border-b border-red-500/30"
      >
        <div className="container flex items-center justify-between gap-4 py-2.5 px-4">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-red-500/15 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-4 h-4 text-red-400" />
            </div>
            <p className="text-sm text-red-200">
              <span className="font-semibold">Your free trial has ended.</span>{" "}
              <span className="hidden sm:inline">Subscribe now to keep your progress and continue learning.</span>
            </p>
          </div>
          <Link
            href="/upgrade"
            className="shrink-0 px-4 py-1.5 text-xs font-semibold bg-red-500 text-white rounded-md hover:bg-red-400 transition-colors flex items-center gap-1.5"
          >
            Subscribe Now
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </motion.div>
    );
  }

  // Not in trial — no banner needed
  if (!isTrial || trialDaysRemaining === null) return null;

  // Dismissed by user
  if (dismissed && trialDaysRemaining > 2) return null;

  // Determine urgency level
  const isUrgent = trialDaysRemaining <= 1;
  const isWarning = trialDaysRemaining <= 2;

  const bgClass = isUrgent
    ? "from-red-900/30 via-red-900/20 to-red-900/30 border-red-500/25"
    : isWarning
    ? "from-amber-900/30 via-amber-900/20 to-amber-900/30 border-amber-500/25"
    : "from-[oklch(0.15_0.04_155)] via-[oklch(0.13_0.03_155)] to-[oklch(0.15_0.04_155)] border-[oklch(0.55_0.12_155/20%)]";

  const iconColor = isUrgent ? "text-red-400" : isWarning ? "text-amber-400" : "text-[oklch(0.55_0.12_155)]";
  const textColor = isUrgent ? "text-red-200" : isWarning ? "text-amber-200" : "text-[oklch(0.75_0.06_155)]";
  const accentColor = isUrgent ? "text-red-300" : isWarning ? "text-amber-300" : "text-[oklch(0.65_0.10_155)]";

  const countdownText = timeRemaining
    ? timeRemaining.days > 0
      ? `${timeRemaining.days}d ${timeRemaining.hours}h remaining`
      : timeRemaining.hours > 0
      ? `${timeRemaining.hours}h ${timeRemaining.minutes}m remaining`
      : `${timeRemaining.minutes}m remaining`
    : `${trialDaysRemaining} days remaining`;

  const messageText = isUrgent
    ? "Your trial ends tomorrow! Subscribe to keep your progress."
    : isWarning
    ? "Your trial ends in 2 days. Don't lose your training progress."
    : "You're on a free trial — full access to all courses and simulators.";

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        className={`bg-gradient-to-r ${bgClass} border-b`}
      >
        <div className="container flex items-center justify-between gap-3 py-2 px-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`w-7 h-7 rounded-lg ${isUrgent ? "bg-red-500/15" : isWarning ? "bg-amber-500/15" : "bg-[oklch(0.55_0.12_155/10%)]"} flex items-center justify-center shrink-0`}>
              {isUrgent ? (
                <AlertTriangle className={`w-4 h-4 ${iconColor}`} />
              ) : (
                <Clock className={`w-4 h-4 ${iconColor}`} />
              )}
            </div>
            <div className="min-w-0">
              <p className={`text-sm ${textColor} truncate`}>
                <span className={`font-semibold ${accentColor}`}>{countdownText}</span>
                <span className="hidden sm:inline"> — {messageText}</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Link
              href="/pricing"
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors flex items-center gap-1.5 ${
                isUrgent
                  ? "bg-red-500 text-white hover:bg-red-400"
                  : isWarning
                  ? "bg-amber-500 text-black hover:bg-amber-400"
                  : "bg-[oklch(0.55_0.12_155)] text-white hover:bg-[oklch(0.60_0.12_155)]"
              }`}
            >
              <Zap className="w-3 h-3" />
              Subscribe
            </Link>
            {trialDaysRemaining > 2 && (
              <button
                onClick={() => setDismissed(true)}
                className="p-1 text-[oklch(0.45_0.006_250)] hover:text-white transition-colors"
                aria-label="Dismiss"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
