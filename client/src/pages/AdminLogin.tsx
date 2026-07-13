/**
 * Hidden Admin Login Page
 * Accessible at /admin/login — not linked from anywhere in the UI.
 * Uses Manus OAuth for owner access.
 */
import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Zap, Shield, Loader2 } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";

export default function AdminLogin() {
  const { isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    if (!loading && isAuthenticated) {
      navigate("/admin");
    }
  }, [isAuthenticated, loading, navigate]);

  const handleOAuthLogin = () => {
    setRedirecting(true);
    // Build the Manus OAuth URL
    const oauthPortalUrl = import.meta.env.VITE_OAUTH_PORTAL_URL;
    const appId = import.meta.env.VITE_APP_ID;
    const redirectUri = `${window.location.origin}/api/oauth/callback`;
    const state = btoa(redirectUri);

    const url = new URL(`${oauthPortalUrl}/app-auth`);
    url.searchParams.set("appId", appId);
    url.searchParams.set("redirectUri", redirectUri);
    url.searchParams.set("state", state);
    url.searchParams.set("type", "signIn");

    window.location.href = url.toString();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[oklch(0.03_0.003_250)] flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-[oklch(0.55_0.12_155)] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[oklch(0.03_0.003_250)] flex items-center justify-center px-4">
      <div className="w-full max-w-[380px]">
        {/* Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br from-[oklch(0.35_0.12_155)] to-[oklch(0.22_0.08_155)] border border-[oklch(0.35_0.12_155/30%)] mb-4">
            <Zap className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-xl font-heading text-white tracking-wide mb-1">
            EAS ADMIN
          </h1>
          <p className="text-xs text-[oklch(0.40_0.006_250)] uppercase tracking-wider">
            Owner Access Only
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-[oklch(0.06_0.003_250)] border border-[oklch(0.12_0.004_250)] rounded-xl p-6">
          <p className="text-sm text-[oklch(0.50_0.008_250)] text-center mb-6">
            This page is for platform administrators only.
          </p>

          <button
            onClick={handleOAuthLogin}
            disabled={redirecting}
            className="w-full h-11 bg-[oklch(0.25_0.08_155)] hover:bg-[oklch(0.30_0.10_155)] disabled:opacity-60 text-white rounded-lg font-medium text-sm transition-all flex items-center justify-center gap-2"
          >
            {redirecting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Redirecting...
              </>
            ) : (
              <>
                <Shield className="w-4 h-4" />
                Sign In as Owner
              </>
            )}
          </button>

          <p className="text-[10px] text-[oklch(0.30_0.006_250)] text-center mt-4">
            Authenticated via platform provider
          </p>
        </div>
      </div>
    </div>
  );
}
