import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";

/**
 * Hook to access subscription state across the platform.
 * Returns subscription info, trial state, and helper booleans.
 */
export function useSubscription() {
  const { isAuthenticated } = useAuth();

  const { data: subscription, isLoading } = trpc.stripe.getSubscription.useQuery(undefined, {
    enabled: isAuthenticated,
    staleTime: 60_000, // Cache for 1 minute
    refetchOnWindowFocus: true,
  });

  const hasAccess = subscription?.hasActiveSubscription ?? false;
  const isTrial = subscription?.isTrial ?? false;
  const trialExpired = subscription?.trialExpired ?? false;
  const trialDaysRemaining = subscription?.trialDaysRemaining ?? null;
  const trialEndsAt = subscription?.trialEndsAt ?? null;
  const trialStartAt = subscription?.trialStartAt ?? null;
  const status = subscription?.status ?? "none";
  const tier = subscription?.tier ?? "free";
  const isPastDue = status === "past_due";

  // User needs to upgrade: either expired trial, no subscription, or canceled
  const needsUpgrade = !hasAccess && isAuthenticated && !isLoading;

  // Show trial banner: user is trialing, or expired, or past_due
  const showTrialBanner = isAuthenticated && !isLoading && (isTrial || trialExpired || isPastDue);

  return {
    subscription,
    isLoading,
    hasAccess,
    isTrial,
    trialExpired,
    trialDaysRemaining,
    trialEndsAt,
    trialStartAt,
    status,
    tier,
    isPastDue,
    needsUpgrade,
    showTrialBanner,
  };
}
