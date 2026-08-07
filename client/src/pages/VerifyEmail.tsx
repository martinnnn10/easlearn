import { useEffect, useState, useCallback } from "react";
import { Link, useSearch } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Zap, CheckCircle2, XCircle, Loader2, Mail, RefreshCw, ArrowLeft } from "lucide-react";

function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!local || !domain) return "***@***";
  const visibleChars = Math.min(3, Math.floor(local.length / 2));
  return local.slice(0, visibleChars) + "***@" + domain;
}

export default function VerifyEmail() {
  const searchString = useSearch();
  const params = new URLSearchParams(searchString);
  const token = params.get("token");
  const { user } = useAuth();

  const [status, setStatus] = useState<"verifying" | "success" | "error" | "no-token">(
    token ? "verifying" : "no-token"
  );
  const [errorMessage, setErrorMessage] = useState("");
  const [userName, setUserName] = useState("");

  // Resend state
  const [resendEmail, setResendEmail] = useState("");
  const [resendStatus, setResendStatus] = useState<"idle" | "sending" | "sent" | "error" | "cooldown">("idle");
  const [resendMessage, setResendMessage] = useState("");
  const [cooldownSeconds, setCooldownSeconds] = useState(0);

  const verifyMutation = trpc.auth.verifyEmail.useMutation({
    onSuccess: (data) => {
      setStatus("success");
      setUserName(data.name);
    },
    onError: (err) => {
      setStatus("error");
      setErrorMessage(err.message);
    },
  });

  const resendMutation = trpc.auth.resendVerification.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        setResendStatus("sent");
        setResendMessage("Verification email sent. Check your inbox and spam folder.");
        // Start a 60s cooldown on the client side
        setCooldownSeconds(60);
      } else if ((data as any).cooldownSeconds) {
        setResendStatus("cooldown");
        setCooldownSeconds((data as any).cooldownSeconds);
        setResendMessage("Please wait before requesting another email.");
      } else {
        setResendStatus("error");
        setResendMessage((data as any).message || "Unable to send. Please try again later.");
      }
    },
    onError: (err) => {
      setResendStatus("error");
      setResendMessage(err.message || "Something went wrong. Please try again.");
    },
  });

  // Cooldown timer
  useEffect(() => {
    if (cooldownSeconds <= 0) return;
    const timer = setInterval(() => {
      setCooldownSeconds((prev) => {
        if (prev <= 1) {
          setResendStatus("idle");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldownSeconds]);

  useEffect(() => {
    if (token && status === "verifying") {
      verifyMutation.mutate({ token });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Pre-fill email from authenticated user if available
  useEffect(() => {
    if (user && (user as any).email && !resendEmail) {
      setResendEmail((user as any).email);
    }
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleResend = useCallback(() => {
    const emailToUse = (user && (user as any).email) || resendEmail;
    if (!emailToUse || !emailToUse.includes("@")) return;
    setResendStatus("sending");
    resendMutation.mutate({ email: emailToUse.toLowerCase().trim() });
  }, [resendEmail, user, resendMutation]);

  if (status === "verifying") {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#060906] via-[#080c08] to-[#0a0f0a] flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center">
          <div className="inline-flex items-center gap-2 mb-8">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <Zap className="w-5 h-5 text-emerald-400" />
            </div>
            <span className="text-white font-bold text-lg tracking-wide">EAS</span>
          </div>
          <div className="bg-[#0d120d]/80 border border-gray-800/40 rounded-2xl p-8 backdrop-blur-sm">
            <Loader2 className="w-12 h-12 text-emerald-400 animate-spin mx-auto mb-4" />
            <h2 className="text-white text-xl font-semibold mb-2">Verifying Your Email</h2>
            <p className="text-gray-400 text-sm">Please wait while we confirm your email address...</p>
          </div>
        </div>
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#060906] via-[#080c08] to-[#0a0f0a] flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center">
          <div className="inline-flex items-center gap-2 mb-8">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <Zap className="w-5 h-5 text-emerald-400" />
            </div>
            <span className="text-white font-bold text-lg tracking-wide">EAS</span>
          </div>
          <div className="bg-[#0d120d]/80 border border-gray-800/40 rounded-2xl p-8 backdrop-blur-sm">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-8 h-8 text-emerald-400" />
            </div>
            <h2 className="text-white text-xl font-semibold mb-3">Email Verified</h2>
            <p className="text-gray-400 text-sm leading-relaxed mb-6">
              {userName ? `Welcome, ${userName}!` : "Welcome!"} Your email has been verified and your account is fully activated.
            </p>
            <Link href="/onboarding">
              <Button className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-medium py-2.5">
                Start Your Training Path
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#060906] via-[#080c08] to-[#0a0f0a] flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center">
          <div className="inline-flex items-center gap-2 mb-8">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <Zap className="w-5 h-5 text-emerald-400" />
            </div>
            <span className="text-white font-bold text-lg tracking-wide">EAS</span>
          </div>
          <div className="bg-[#0d120d]/80 border border-gray-800/40 rounded-2xl p-8 backdrop-blur-sm">
            <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-6">
              <XCircle className="w-8 h-8 text-red-400" />
            </div>
            <h2 className="text-white text-xl font-semibold mb-3">Verification Failed</h2>
            <p className="text-gray-400 text-sm leading-relaxed mb-4">
              {errorMessage || "The verification link is invalid or has expired."}
            </p>
            <p className="text-gray-500 text-xs mb-6">
              Enter your email below to receive a new verification link.
            </p>
            <div className="space-y-3">
              <Input
                type="email"
                placeholder="Your email address"
                value={resendEmail}
                onChange={(e) => setResendEmail(e.target.value)}
                className="bg-[#0a0f0a] border-gray-700/40 text-white placeholder:text-gray-600"
              />
              <Button
                onClick={handleResend}
                disabled={resendStatus === "sending" || resendStatus === "cooldown" || !resendEmail.includes("@")}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-medium py-2.5"
              >
                {resendStatus === "sending" && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {resendStatus === "cooldown" ? `Wait ${cooldownSeconds}s` : "Send New Verification Link"}
              </Button>
              {resendStatus === "sent" && (
                <p className="text-emerald-400 text-xs">{resendMessage}</p>
              )}
              {resendStatus === "error" && (
                <p className="text-red-400 text-xs">{resendMessage}</p>
              )}
              <Link href="/signup">
                <Button variant="outline" className="w-full border-gray-700/40 text-gray-300 hover:bg-white/[3%] mt-2">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Return to Signup
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // No token provided — resend verification UI
  const authenticatedEmail = user && (user as any).email;
  const displayEmail = authenticatedEmail ? maskEmail(authenticatedEmail) : null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#060906] via-[#080c08] to-[#0a0f0a] flex items-center justify-center p-4">
      <div className="w-full max-w-md text-center">
        <div className="inline-flex items-center gap-2 mb-8">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
            <Zap className="w-5 h-5 text-emerald-400" />
          </div>
          <span className="text-white font-bold text-lg tracking-wide">EAS</span>
        </div>
        <div className="bg-[#0d120d]/80 border border-gray-800/40 rounded-2xl p-8 backdrop-blur-sm">
          <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto mb-6">
            <Mail className="w-8 h-8 text-amber-400" />
          </div>
          <h2 className="text-white text-xl font-semibold mb-3">Verify Your Email</h2>
          <p className="text-gray-400 text-sm leading-relaxed mb-2">
            A verification link was sent to your email. Check your inbox and spam folder.
          </p>
          {displayEmail && (
            <p className="text-gray-500 text-xs mb-4">
              Sent to: <span className="text-gray-300 font-mono">{displayEmail}</span>
            </p>
          )}
          <p className="text-gray-500 text-xs mb-6">
            Didn't receive it? Request a new verification link below.
          </p>

          <div className="space-y-3">
            {!authenticatedEmail && (
              <Input
                type="email"
                placeholder="Your email address"
                value={resendEmail}
                onChange={(e) => setResendEmail(e.target.value)}
                className="bg-[#0a0f0a] border-gray-700/40 text-white placeholder:text-gray-600"
              />
            )}
            <Button
              onClick={handleResend}
              disabled={resendStatus === "sending" || resendStatus === "cooldown" || (!authenticatedEmail && !resendEmail.includes("@"))}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-medium py-2.5"
            >
              {resendStatus === "sending" && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {resendStatus === "cooldown" ? (
                <span className="flex items-center gap-2">
                  <RefreshCw className="w-4 h-4" />
                  Wait {cooldownSeconds}s
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <RefreshCw className="w-4 h-4" />
                  Resend Verification Email
                </span>
              )}
            </Button>

            {resendStatus === "sent" && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3 mt-2">
                <p className="text-emerald-400 text-xs">{resendMessage}</p>
              </div>
            )}
            {resendStatus === "error" && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 mt-2">
                <p className="text-red-400 text-xs">{resendMessage}</p>
              </div>
            )}

            <div className="pt-2 border-t border-gray-800/40 mt-4">
              <Link href="/signup">
                <Button variant="outline" className="w-full border-gray-700/40 text-gray-300 hover:bg-white/[3%]">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Change Email or Return to Signup
                </Button>
              </Link>
            </div>

            <p className="text-gray-600 text-[11px] mt-3">
              Still having trouble? Contact support at support@easmaint.com
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
