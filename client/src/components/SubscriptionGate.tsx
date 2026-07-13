import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { Lock, ArrowRight, Zap, CreditCard } from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";
import { useAuth } from "@/_core/hooks/useAuth";

interface SubscriptionGateProps {
  children: ReactNode;
  /** If true, allows first-lesson-free or limited content */
  allowFreePreview?: boolean;
  /** Custom message for the gate */
  message?: string;
}

/**
 * SubscriptionGate — wraps premium content and shows upgrade prompt
 * when the user's trial has expired or they have no active subscription.
 *
 * Usage:
 *   <SubscriptionGate>
 *     <PremiumContent />
 *   </SubscriptionGate>
 */
export default function SubscriptionGate({ children, allowFreePreview, message }: SubscriptionGateProps) {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { hasAccess, trialExpired, isPastDue, status, isLoading } = useSubscription();
  const [, navigate] = useLocation();

  // Still loading — show children (they'll have their own loading states)
  if (authLoading || isLoading) return <>{children}</>;

  // Not authenticated — show children (individual pages handle auth)
  if (!isAuthenticated) return <>{children}</>;

  // Has access (active sub or active trial) — show content
  if (hasAccess) return <>{children}</>;

  // Allow free preview mode
  if (allowFreePreview) return <>{children}</>;

  // Past due — show payment failed gate
  if (isPastDue) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md"
        >
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center mx-auto mb-5">
            <CreditCard className="w-7 h-7 text-amber-400" />
          </div>
          <h2 className="text-2xl font-heading text-white mb-3">Payment Update Required</h2>
          <p className="text-[oklch(0.55_0.008_250)] mb-6 leading-relaxed">
            Your last payment didn't go through. Update your payment method to restore access to your training.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/account"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-amber-500 text-black font-semibold rounded-lg hover:bg-amber-400 transition-colors"
            >
              <CreditCard className="w-4 h-4" />
              Update Payment
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  // Trial expired or no subscription — show upgrade gate
  return (
    <div className="min-h-[50vh] flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center max-w-md"
      >
        <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/25 flex items-center justify-center mx-auto mb-5">
          <Lock className="w-7 h-7 text-red-400" />
        </div>
        <h2 className="text-2xl font-heading text-white mb-3">
          {trialExpired ? "Trial Ended" : "Premium Content"}
        </h2>
        <p className="text-[oklch(0.55_0.008_250)] mb-6 leading-relaxed">
          {message || (trialExpired
            ? "Your free trial has ended. Subscribe to continue your training and keep your progress."
            : "This content requires an active subscription. Start your 7-day free trial to get full access.")}
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/upgrade"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 btn-primary font-semibold rounded-lg shadow-lg shadow-[oklch(0.55_0.12_155/15%)]"
          >
            <Zap className="w-4 h-4" />
            {trialExpired ? "Subscribe Now" : "Start Free Trial"}
          </Link>
          <Link
            href="/pricing"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-medium text-[oklch(0.60_0.005_250)] border border-[oklch(0.20_0.004_250)] rounded-lg hover:border-[oklch(0.30_0.004_250)] transition-colors"
          >
            View Plans
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
