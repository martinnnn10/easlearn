import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { Zap, ArrowLeft, Mail, CheckCircle2 } from "lucide-react";
import SEO from "@/components/SEO";
import { useAuth } from "@/_core/hooks/useAuth";

export default function ForgotPassword() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [, navigate] = useLocation();

  // Redirect authenticated users to dashboard
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      navigate("/dashboard");
    }
  }, [authLoading, isAuthenticated, navigate]);
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const requestReset = trpc.auth.requestPasswordReset.useMutation({
    onSuccess: () => {
      setSubmitted(true);
      setError("");
    },
    onError: (err) => {
      setError(err.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }
    requestReset.mutate({ email: email.trim() });
  };

  if (submitted) {
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
            <h2 className="text-white text-xl font-semibold mb-3">Check Your Email</h2>
            <p className="text-gray-400 text-sm leading-relaxed mb-6">
              If an account exists with <span className="text-gray-200">{email}</span>, 
              you'll receive a password reset link shortly. The link expires in 1 hour.
            </p>
            <p className="text-gray-500 text-xs mb-6">
              Didn't receive it? Check your spam folder or try resending below.
            </p>
            <div className="space-y-3">
              <Button
                variant="outline"
                className="w-full border-gray-700/40 text-gray-300 hover:bg-white/[3%]"
                onClick={() => {
                  setSubmitted(false);
                }}
              >
                Try a Different Email
              </Button>
              <Link href="/login">
                <Button variant="outline" className="w-full border-gray-700/40 text-gray-300 hover:bg-white/[3%]">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Sign In
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#060906] via-[#080c08] to-[#0a0f0a] flex items-center justify-center p-4">
      <SEO title="Reset Password" description="Reset your EAS training platform password." path="/forgot-password" />
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <Zap className="w-5 h-5 text-emerald-400" />
            </div>
            <span className="text-white font-bold text-lg tracking-wide">EAS</span>
          </div>
          <h1 className="text-white text-2xl font-bold mb-2">Reset Your Password</h1>
          <p className="text-gray-400 text-sm">
            Enter the email address associated with your account and we'll send you a reset link.
          </p>
        </div>

        {/* Form */}
        <div className="bg-[#0d120d]/80 border border-gray-800/40 rounded-2xl p-8 backdrop-blur-sm">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-300 text-sm font-medium">
                Email Address
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  className="pl-10 bg-[#080c08] border-gray-700/40 text-white placeholder:text-gray-600 focus:border-emerald-500/40 focus:ring-emerald-500/20"
                  autoComplete="email"
                  autoFocus
                />
              </div>
            </div>

            {error && (
              <p className="text-red-400 text-sm bg-red-500/5 border border-red-500/10 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <Button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-medium py-2.5"
              disabled={requestReset.isPending}
            >
              {requestReset.isPending ? "Sending..." : "Send Reset Link"}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <Link href="/login" className="text-emerald-400 hover:text-emerald-300 text-sm font-medium inline-flex items-center gap-1.5">
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
