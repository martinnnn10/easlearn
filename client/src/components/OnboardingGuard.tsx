/**
 * OnboardingGuard — Central route guard for the new-learner routing system.
 *
 * Rules:
 * 1. If user is NOT authenticated → do nothing (let auth system handle)
 * 2. If user IS authenticated AND onboardingCompleted === false AND email verified:
 *    → redirect to /onboarding
 * 3. If user IS authenticated AND onboardingCompleted === false AND email NOT verified:
 *    → redirect to /verify-email
 * 4. If user IS authenticated AND onboardingCompleted === true → do nothing (allow access)
 * 5. Manager/admin accounts bypass operator onboarding
 * 6. Excluded routes (auth, legal, invite, /onboarding itself) are never guarded
 */
import { useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";

// Routes that are NEVER guarded (accessible before onboarding)
const EXCLUDED_PATHS = [
  "/onboarding",
  "/onboarding/start",
  "/login",
  "/signup",
  "/logout",
  "/verify-email",
  "/password-reset",
  "/terms",
  "/privacy",
  "/about",
  "/contact",
  "/pricing",
  "/enterprise",
  "/team/invite/",
  "/assessment/",
  "/certificate/",
  "/verify-certificate",
  "/verify/skills/",
  "/manager",
  "/manage",
  "/eas-owner",
  "/admin",
  "/demo",
  "/",
  "/free-training",
  "/prototype/",
];

// Routes that managers/admins should access without onboarding
const MANAGER_ROUTES = ["/manager", "/manage", "/admin", "/eas-owner"];

function isExcluded(pathname: string): boolean {
  // Exact match for root
  if (pathname === "/") return true;
  // Check prefix matches for excluded paths
  return EXCLUDED_PATHS.some((excluded) => {
    if (excluded === "/") return false; // already handled
    return pathname === excluded || pathname.startsWith(excluded);
  });
}

export default function OnboardingGuard({ children }: { children: React.ReactNode }) {
  const { user, loading, isAuthenticated } = useAuth();
  const [location] = useLocation();

  useEffect(() => {
    // Don't act while loading
    if (loading) return;
    // Not authenticated — let auth system handle
    if (!isAuthenticated || !user) return;
    // Already on an excluded route — do nothing
    if (isExcluded(location)) return;
    // Manager/admin bypass — they don't need operator onboarding
    if (user.role === "admin") return;
    // Check if user has manager role via team membership (check onboarding status)
    // If onboarding is already completed — allow access
    if ((user as any).onboardingCompleted === true) return;
    // Email not verified — redirect to verify-email (if that field exists)
    if ((user as any).emailVerified === false) {
      if (location !== "/verify-email") {
        window.location.href = "/verify-email";
      }
      return;
    }
    // Onboarding not completed — redirect to /onboarding
    if (location !== "/onboarding" && location !== "/onboarding/start") {
      window.location.href = "/onboarding";
    }
  }, [loading, isAuthenticated, user, location]);

  return <>{children}</>;
}
