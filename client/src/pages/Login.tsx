/**
 * EAS Training — Branded Login Page
 * Professional dark-themed email/password authentication page.
 */
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useLocation, useSearch, Link } from "wouter";
import { Zap, Shield, ArrowRight, Loader2, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import SEO from "@/components/SEO";
import { toast } from "sonner";

export default function Login() {
  const { isAuthenticated, loading, refresh } = useAuth();
  const [, navigate] = useLocation();
  const search = useSearch();
  const redirectParam = new URLSearchParams(search).get("redirect");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: () => {
      toast.success("Welcome back!");
      refresh();
      // Small delay for cookie to be set
      setTimeout(() => {
        window.location.href = redirectParam || "/dashboard";
      }, 200);
    },
    onError: (err) => {
      toast.error(err.message || "Login failed. Please try again.");
    },
  });

  // If already authenticated, redirect to dashboard
  useEffect(() => {
    if (!loading && isAuthenticated) {
      navigate(redirectParam || "/dashboard");
    }
  }, [isAuthenticated, loading, navigate, redirectParam]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    loginMutation.mutate({ email, password });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[oklch(0.05_0.003_250)] flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-[oklch(0.55_0.12_155)] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[oklch(0.05_0.003_250)] flex flex-col">
      <SEO
        title="Sign In"
        description="Sign in to EAS Training to access your courses, simulator, and certifications."
        path="/login"
      />

      {/* Background Pattern */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-[oklch(0.15_0.06_155/8%)] rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-[oklch(0.12_0.04_200/6%)] rounded-full blur-[100px]" />
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `linear-gradient(oklch(0.5 0.01 250) 1px, transparent 1px), linear-gradient(90deg, oklch(0.5 0.01 250) 1px, transparent 1px)`,
          backgroundSize: "60px 60px"
        }} />
      </div>

      {/* Content */}
      <div className="relative flex-1 flex items-center justify-center px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-[420px]"
        >
          {/* Brand Header */}
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.4 }}
              className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-[oklch(0.35_0.12_155)] to-[oklch(0.22_0.08_155)] border border-[oklch(0.35_0.12_155/30%)] mb-5"
            >
              <Zap className="w-8 h-8 text-white" />
            </motion.div>
            <h1 className="text-2xl font-heading text-white tracking-wide mb-2">
              EAS TRAINING
            </h1>
            <p className="text-sm text-[oklch(0.50_0.008_250)]">
              Industrial Maintenance Training Platform
            </p>
          </div>

          {/* Login Card */}
          <div className="bg-[oklch(0.08_0.003_250)] border border-[oklch(0.15_0.004_250)] rounded-xl p-8 shadow-2xl">
            <h2 className="text-lg font-semibold text-white text-center mb-2">
              Welcome Back
            </h2>
            <p className="text-sm text-[oklch(0.50_0.008_250)] text-center mb-6">
              Sign in to access your courses, simulator, and certifications
            </p>

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-xs font-medium text-[oklch(0.55_0.008_250)] mb-1.5 uppercase tracking-wider">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  required
                  autoComplete="email"
                  className="w-full h-11 px-4 bg-[oklch(0.06_0.003_250)] border border-[oklch(0.18_0.004_250)] rounded-lg text-white text-sm placeholder:text-[oklch(0.30_0.006_250)] focus:outline-none focus:border-[oklch(0.35_0.10_155)] focus:ring-1 focus:ring-[oklch(0.35_0.10_155/30%)] transition-all"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-xs font-medium text-[oklch(0.55_0.008_250)] mb-1.5 uppercase tracking-wider">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                    autoComplete="current-password"
                    className="w-full h-11 px-4 pr-11 bg-[oklch(0.06_0.003_250)] border border-[oklch(0.18_0.004_250)] rounded-lg text-white text-sm placeholder:text-[oklch(0.30_0.006_250)] focus:outline-none focus:border-[oklch(0.35_0.10_155)] focus:ring-1 focus:ring-[oklch(0.35_0.10_155/30%)] transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[oklch(0.40_0.006_250)] hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Forgot Password */}
              <div className="text-right">
                <Link href="/forgot-password" className="text-xs text-[oklch(0.50_0.10_155)] hover:text-[oklch(0.60_0.12_155)] transition-colors">
                  Forgot password?
                </Link>
              </div>

              {/* Inline error message */}
              {loginMutation.isError && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
                  {loginMutation.error?.message === "Rate limit exceeded. Please slow down."
                    ? "Too many login attempts. Please wait a moment and try again."
                    : loginMutation.error?.message || "Login failed. Please check your credentials and try again."}
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loginMutation.isPending || !email || !password}
                className="w-full h-12 bg-[oklch(0.30_0.10_155)] hover:bg-[oklch(0.35_0.12_155)] disabled:opacity-60 disabled:cursor-not-allowed text-white rounded-lg font-semibold text-sm tracking-wide transition-all flex items-center justify-center gap-2 group mt-6"
              >
                {loginMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Signing In...
                  </>
                ) : (
                  <>
                    Sign In
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </>
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="flex items-center gap-3 my-6">
              <div className="flex-1 h-px bg-[oklch(0.15_0.004_250)]" />
              <span className="text-[11px] text-[oklch(0.40_0.006_250)] uppercase tracking-wider">new here?</span>
              <div className="flex-1 h-px bg-[oklch(0.15_0.004_250)]" />
            </div>

            {/* Create Account */}
            <Link
              href="/signup"
              className="w-full h-12 bg-transparent border border-[oklch(0.20_0.004_250)] hover:border-[oklch(0.30_0.06_155)] text-[oklch(0.70_0.008_250)] hover:text-white rounded-lg font-medium text-sm transition-all flex items-center justify-center gap-2"
            >
              Create New Account
            </Link>

            {/* Security Badge */}
            <div className="flex items-center justify-center gap-1.5 mt-6 text-[10px] text-[oklch(0.35_0.006_250)]">
              <Shield className="w-3 h-3" />
              <span>Secure authentication · Enterprise-grade encryption</span>
            </div>
          </div>

          {/* Features Preview */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mt-8 grid grid-cols-3 gap-3"
          >
            {[
              { label: "Courses", count: "6+" },
              { label: "Scenarios", count: "8+" },
              { label: "Labs", count: "5+" },
            ].map((item) => (
              <div key={item.label} className="text-center py-3 px-2 rounded-lg bg-[oklch(0.07_0.003_250)] border border-[oklch(0.12_0.004_250)]">
                <div className="text-lg font-heading text-[oklch(0.55_0.12_155)]">{item.count}</div>
                <div className="text-[10px] text-[oklch(0.40_0.006_250)] uppercase tracking-wider">{item.label}</div>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </div>

      {/* Footer */}
      <div className="relative text-center py-4 text-[11px] text-[oklch(0.35_0.006_250)]">
        <span>&copy; {new Date().getFullYear()} Electrical Automation Services Inc. All rights reserved.</span>
      </div>
    </div>
  );
}
