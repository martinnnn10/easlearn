/**
 * EAS Training — Branded Signup Page
 * Professional dark-themed registration page with email/password form.
 */
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useLocation } from "wouter";
import { Zap, Shield, ArrowRight, Loader2, Eye, EyeOff, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { useAnalytics } from "@/hooks/useAnalytics";
import { Link } from "wouter";
import SEO from "@/components/SEO";
import { toast } from "sonner";

export default function Signup() {
  const { isAuthenticated, loading, refresh } = useAuth();
  const [, navigate] = useLocation();
  const { trackSignupCompleted } = useAnalytics();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [showVerificationPending, setShowVerificationPending] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const registerMutation = trpc.auth.register.useMutation({
    onSuccess: (data) => {
      trackSignupCompleted({ method: "email" });
      if (data.requiresVerification) {
        setShowVerificationPending(true);
      } else {
        toast.success("Account created! Welcome to EAS Training.");
        refresh();
        setTimeout(() => {
          window.location.href = "/dashboard";
        }, 200);
      }
    },
    onError: (err) => {
      toast.error(err.message || "Registration failed. Please try again.");
    },
  });

  const resendMutation = trpc.auth.resendVerification.useMutation({
    onSuccess: () => {
      toast.success("Verification email resent. Please check your inbox.");
    },
    onError: () => {
      toast.error("Failed to resend. Please try again in a moment.");
    },
  });

  // If already authenticated, redirect to dashboard
  useEffect(() => {
    if (!loading && isAuthenticated) {
      navigate("/dashboard");
    }
  }, [isAuthenticated, loading, navigate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) return;
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }
    registerMutation.mutate({ name, email, password });
  };

  // Password strength indicator
  const passwordStrength = password.length === 0 ? 0 : password.length < 8 ? 1 : password.length < 12 ? 2 : 3;
  const strengthLabels = ["", "Weak", "Good", "Strong"];
  const strengthColors = ["", "oklch(0.55_0.15_25)", "oklch(0.55_0.12_85)", "oklch(0.55_0.12_155)"];

  if (loading) {
    return (
      <div className="min-h-screen bg-[oklch(0.05_0.003_250)] flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-[oklch(0.55_0.12_155)] animate-spin" />
      </div>
    );
  }

  // Show verification pending screen after successful registration
  if (showVerificationPending) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#060906] via-[#080c08] to-[#0a0f0a] flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 mb-6">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                <Zap className="w-5 h-5 text-emerald-400" />
              </div>
              <span className="text-white font-bold text-lg tracking-wide">EAS</span>
            </div>
          </div>

          <div className="bg-[#0d120d]/80 border border-gray-800/40 rounded-2xl p-8 backdrop-blur-sm text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-8 h-8 text-emerald-400" />
            </div>
            <h2 className="text-white text-xl font-semibold mb-3">Account Created</h2>
            <p className="text-gray-400 text-sm leading-relaxed mb-2">
              We've sent a verification email to:
            </p>
            <p className="text-white text-sm font-medium mb-4">{email}</p>
            <p className="text-gray-500 text-xs mb-6">
              Please click the link in the email to verify your account. The link expires in 24 hours.
            </p>

            <div className="space-y-3">
              <button
                onClick={() => resendMutation.mutate({ email })}
                disabled={resendMutation.isPending}
                className="w-full h-10 bg-transparent border border-gray-700/40 text-gray-300 hover:bg-white/[3%] rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2"
              >
                {resendMutation.isPending ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Sending...</>
                ) : (
                  "Resend Verification Email"
                )}
              </button>
              <Link href="/login">
                <button className="w-full h-10 text-emerald-400 hover:text-emerald-300 text-sm font-medium transition-colors">
                  Go to Login
                </button>
              </Link>
            </div>

            <p className="text-gray-600 text-[11px] mt-6">
              Didn't receive it? Check your spam folder or try resending.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[oklch(0.05_0.003_250)] flex flex-col">
      <SEO
        title="Create Account"
        description="Create your EAS Training account to start learning industrial maintenance skills with hands-on simulators."
        path="/signup"
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

          {/* Signup Card */}
          <div className="bg-[oklch(0.08_0.003_250)] border border-[oklch(0.15_0.004_250)] rounded-xl p-8 shadow-2xl">
            <h2 className="text-lg font-semibold text-white text-center mb-2">
              Create Your Account
            </h2>
            <p className="text-sm text-[oklch(0.50_0.008_250)] text-center mb-6">
              Start your 7-day free trial — no credit card required to browse
            </p>

            {/* Signup Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-xs font-medium text-[oklch(0.55_0.008_250)] mb-1.5 uppercase tracking-wider">
                  Full Name
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Smith"
                  required
                  autoComplete="name"
                  className="w-full h-11 px-4 bg-[oklch(0.06_0.003_250)] border border-[oklch(0.18_0.004_250)] rounded-lg text-white text-sm placeholder:text-[oklch(0.30_0.006_250)] focus:outline-none focus:border-[oklch(0.35_0.10_155)] focus:ring-1 focus:ring-[oklch(0.35_0.10_155/30%)] transition-all"
                />
              </div>

              <div>
                <label htmlFor="signup-email" className="block text-xs font-medium text-[oklch(0.55_0.008_250)] mb-1.5 uppercase tracking-wider">
                  Email Address
                </label>
                <input
                  id="signup-email"
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
                <label htmlFor="signup-password" className="block text-xs font-medium text-[oklch(0.55_0.008_250)] mb-1.5 uppercase tracking-wider">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="signup-password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimum 8 characters"
                    required
                    minLength={8}
                    autoComplete="new-password"
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
                {/* Password strength indicator */}
                {password.length > 0 && (
                  <div className="mt-2 flex items-center gap-2">
                    <div className="flex-1 flex gap-1">
                      {[1, 2, 3].map((level) => (
                        <div
                          key={level}
                          className="h-1 flex-1 rounded-full transition-all"
                          style={{
                            backgroundColor: passwordStrength >= level ? strengthColors[passwordStrength] : "oklch(0.15 0.004 250)",
                          }}
                        />
                      ))}
                    </div>
                    <span className="text-[10px]" style={{ color: strengthColors[passwordStrength] }}>
                      {strengthLabels[passwordStrength]}
                    </span>
                  </div>
                )}
              </div>

              {/* Terms & Privacy Acceptance */}
              <label className="flex items-start gap-2.5 mt-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={acceptedTerms}
                  onChange={(e) => setAcceptedTerms(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded border-[oklch(0.25_0.004_250)] bg-[oklch(0.06_0.003_250)] accent-[oklch(0.35_0.12_155)] cursor-pointer"
                />
                <span className="text-xs text-[oklch(0.45_0.008_250)] leading-relaxed">
                  I agree to the{" "}
                  <Link href="/terms" className="text-[oklch(0.55_0.12_155)] hover:text-[oklch(0.65_0.12_155)] underline underline-offset-2">Terms of Service</Link>
                  {" "}and{" "}
                  <Link href="/privacy" className="text-[oklch(0.55_0.12_155)] hover:text-[oklch(0.65_0.12_155)] underline underline-offset-2">Privacy Policy</Link>
                </span>
              </label>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={registerMutation.isPending || !name || !email || !password || password.length < 8 || !acceptedTerms}
                className="w-full h-12 bg-[oklch(0.30_0.10_155)] hover:bg-[oklch(0.35_0.12_155)] disabled:opacity-60 disabled:cursor-not-allowed text-white rounded-lg font-semibold text-sm tracking-wide transition-all flex items-center justify-center gap-2 group mt-6"
              >
                {registerMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  <>
                    Create Account
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </>
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="flex items-center gap-3 my-6">
              <div className="flex-1 h-px bg-[oklch(0.15_0.004_250)]" />
              <span className="text-[11px] text-[oklch(0.40_0.006_250)] uppercase tracking-wider">already have an account?</span>
              <div className="flex-1 h-px bg-[oklch(0.15_0.004_250)]" />
            </div>

            {/* Sign In Link */}
            <Link
              href="/login"
              className="w-full h-12 bg-transparent border border-[oklch(0.20_0.004_250)] hover:border-[oklch(0.30_0.06_155)] text-[oklch(0.70_0.008_250)] hover:text-white rounded-lg font-medium text-sm transition-all flex items-center justify-center gap-2"
            >
              Sign In to Existing Account
            </Link>

            {/* Security Badge */}
            <div className="flex items-center justify-center gap-1.5 mt-6 text-[10px] text-[oklch(0.35_0.006_250)]">
              <Shield className="w-3 h-3" />
              <span>Secure authentication · Enterprise-grade encryption</span>
            </div>
          </div>

          {/* Benefits */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mt-8 space-y-2"
          >
            {[
              "Access to interactive troubleshooting simulators",
              "Structured course modules with quizzes",
              "Earn certifications to prove your skills",
            ].map((benefit) => (
              <div key={benefit} className="flex items-center gap-2 text-sm text-[oklch(0.50_0.008_250)]">
                <CheckCircle2 className="w-4 h-4 text-[oklch(0.45_0.10_155)] shrink-0" />
                <span>{benefit}</span>
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
