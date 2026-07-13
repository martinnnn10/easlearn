/**
 * EAS Training — Account Settings Page
 * Professional account management with subscription status, billing portal, and profile settings.
 */
import { useEffect } from "react";
import { motion } from "framer-motion";
import { useLocation } from "wouter";
import {
  User, CreditCard, Shield, Settings, LogOut,
  ChevronRight, Zap, Crown, Calendar, ExternalLink
} from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import SEO from "@/components/SEO";
import { BadgeDisplay } from "@/components/BadgeDisplay";

export default function Account() {
  const { user, isAuthenticated, loading, logout } = useAuth();
  const [, navigate] = useLocation();

  // Redirect if not authenticated
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate("/login");
    }
  }, [loading, isAuthenticated, navigate]);

  const { data: subscription } = trpc.stripe.getSubscription.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const createPortal = trpc.stripe.createPortalSession.useMutation({
    onSuccess: (data) => {
      if (data.url) {
        window.open(data.url, "_blank");
      }
    },
    onError: () => {
      toast.error("Unable to open billing portal");
    },
  });

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-[oklch(0.05_0.003_250)] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-[oklch(0.55_0.12_155)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const planName = subscription?.tier === "pro" ? "Pro" : subscription?.tier === "team" ? "Team" : "Starter";
  const isSubscribed = subscription?.hasActiveSubscription ?? false;

  return (
    <div className="min-h-screen bg-[oklch(0.05_0.003_250)] py-8 px-4">
      <SEO
        title="Account Settings"
        description="Manage your EAS Training account, subscription, and billing."
        path="/account"
      />

      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-2xl font-heading text-white tracking-wide">Account Settings</h1>
          <p className="text-sm text-[oklch(0.50_0.008_250)] mt-1">Manage your profile, subscription, and preferences</p>
        </motion.div>

        {/* Profile Section */}
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-[oklch(0.08_0.003_250)] border border-[oklch(0.15_0.004_250)] rounded-xl p-6 mb-4"
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-[oklch(0.12_0.004_250)] border border-[oklch(0.20_0.004_250)] flex items-center justify-center">
              <User className="w-6 h-6 text-[oklch(0.50_0.008_250)]" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-white">{user.name}</h2>
              <p className="text-sm text-[oklch(0.50_0.008_250)]">{user.email || "No email on file"}</p>
            </div>
            <div className="flex items-center gap-2">
              {isSubscribed && (
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-[oklch(0.20_0.06_155/30%)] text-[oklch(0.65_0.12_155)] border border-[oklch(0.35_0.12_155/30%)]">
                  <Crown className="w-3 h-3 inline mr-1" />
                  {planName}
                </span>
              )}
            </div>
          </div>
        </motion.section>

        {/* Subscription Section */}
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-[oklch(0.08_0.003_250)] border border-[oklch(0.15_0.004_250)] rounded-xl p-6 mb-4"
        >
          <div className="flex items-center gap-3 mb-5">
            <CreditCard className="w-5 h-5 text-[oklch(0.55_0.12_155)]" />
            <h3 className="text-base font-semibold text-white">Subscription & Billing</h3>
          </div>

          {isSubscribed ? (
            <div className="space-y-4">
              {/* Current Plan */}
              <div className="flex items-center justify-between py-3 border-b border-[oklch(0.12_0.004_250)]">
                <div>
                  <p className="text-sm text-[oklch(0.50_0.008_250)]">Current Plan</p>
                  <p className="text-white font-medium">{planName} Plan</p>
                </div>
                <span className={`px-2.5 py-0.5 rounded-full text-xs ${
                  subscription?.isTrial
                    ? 'bg-[oklch(0.25_0.10_80/20%)] text-[oklch(0.70_0.12_80)]'
                    : subscription?.status === 'past_due'
                    ? 'bg-[oklch(0.25_0.10_30/20%)] text-[oklch(0.70_0.12_30)]'
                    : 'bg-[oklch(0.20_0.06_155/20%)] text-[oklch(0.65_0.12_155)]'
                }`}>
                  {subscription?.isTrial ? `Trial (${subscription.trialDaysRemaining}d left)` : subscription?.status === 'past_due' ? 'Past Due' : 'Active'}
                </span>
              </div>

              {/* Status Details */}
              <div className="flex items-center justify-between py-3 border-b border-[oklch(0.12_0.004_250)]">
                <div>
                  <p className="text-sm text-[oklch(0.50_0.008_250)]">Status</p>
                  <p className="text-white font-medium">
                    {subscription?.isTrial
                      ? `Free trial — ends ${subscription.trialEndsAt ? new Date(subscription.trialEndsAt).toLocaleDateString() : 'soon'}`
                      : subscription?.status === 'past_due'
                      ? 'Payment past due — please update billing'
                      : 'Active subscription'
                    }
                  </p>
                </div>
                <Calendar className="w-4 h-4 text-[oklch(0.40_0.006_250)]" />
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Button
                  onClick={() => createPortal.mutate()}
                  disabled={createPortal.isPending}
                  variant="outline"
                  className="flex-1 h-10 border-[oklch(0.20_0.004_250)] text-white hover:bg-[oklch(0.12_0.004_250)]"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Manage Billing
                </Button>
                <Button
                  onClick={() => navigate("/pricing")}
                  variant="outline"
                  className="flex-1 h-10 border-[oklch(0.20_0.004_250)] text-white hover:bg-[oklch(0.12_0.004_250)]"
                >
                  <Zap className="w-4 h-4 mr-2" />
                  Change Plan
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-[oklch(0.50_0.008_250)] mb-4">
                You're on the <span className="text-white font-medium">Starter</span> plan. Upgrade to unlock all courses, scenarios, and certifications.
              </p>
              <Button
                onClick={() => navigate("/pricing")}
                className="h-10 px-6 bg-[oklch(0.30_0.10_155)] hover:bg-[oklch(0.35_0.12_155)] text-white"
              >
                <Crown className="w-4 h-4 mr-2" />
                Upgrade to Pro
              </Button>
            </div>
          )}
        </motion.section>

        {/* Lab Badges */}
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="bg-[oklch(0.08_0.003_250)] border border-[oklch(0.15_0.004_250)] rounded-xl p-6 mb-4"
        >
          <BadgeDisplay />
        </motion.section>

        {/* Quick Links */}
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-[oklch(0.08_0.003_250)] border border-[oklch(0.15_0.004_250)] rounded-xl overflow-hidden mb-4"
        >
          {[
            { icon: Shield, label: "Privacy & Security", href: "/privacy" },
            { icon: Settings, label: "My Certificates", href: "/my-certificates" },
          ].map((item, i) => (
            <button
              key={item.label}
              onClick={() => navigate(item.href)}
              className={`w-full flex items-center gap-3 px-6 py-4 hover:bg-[oklch(0.10_0.003_250)] transition-colors ${
                i > 0 ? "border-t border-[oklch(0.12_0.004_250)]" : ""
              }`}
            >
              <item.icon className="w-4 h-4 text-[oklch(0.50_0.008_250)]" />
              <span className="flex-1 text-sm text-white text-left">{item.label}</span>
              <ChevronRight className="w-4 h-4 text-[oklch(0.35_0.006_250)]" />
            </button>
          ))}
        </motion.section>

        {/* Sign Out */}
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <button
            onClick={() => {
              logout();
              navigate("/");
            }}
            className="w-full flex items-center gap-3 px-6 py-4 rounded-xl border border-[oklch(0.15_0.004_250)] hover:bg-[oklch(0.08_0.003_250)] transition-colors"
          >
            <LogOut className="w-4 h-4 text-red-400" />
            <span className="text-sm text-red-400">Sign Out</span>
          </button>
        </motion.section>
      </div>
    </div>
  );
}
