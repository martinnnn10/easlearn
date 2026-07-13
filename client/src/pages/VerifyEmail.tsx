import { useEffect, useState } from "react";
import { Link, useSearch } from "wouter";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { Zap, CheckCircle2, XCircle, Loader2, Mail } from "lucide-react";

export default function VerifyEmail() {
  const searchString = useSearch();
  const params = new URLSearchParams(searchString);
  const token = params.get("token");
  
  const [status, setStatus] = useState<"verifying" | "success" | "error" | "no-token">(
    token ? "verifying" : "no-token"
  );
  const [errorMessage, setErrorMessage] = useState("");
  const [userName, setUserName] = useState("");

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

  useEffect(() => {
    if (token && status === "verifying") {
      verifyMutation.mutate({ token });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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
            <Link href="/labs">
              <Button className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-medium py-2.5">
                Start Learning
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
            <p className="text-gray-400 text-sm leading-relaxed mb-6">
              {errorMessage || "The verification link is invalid or has expired."}
            </p>
            <div className="space-y-3">
              <Link href="/login">
                <Button className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-medium py-2.5">
                  Go to Login
                </Button>
              </Link>
              <p className="text-gray-500 text-xs">
                Need a new verification link? Sign in and request one from your account.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // No token provided
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
          <h2 className="text-white text-xl font-semibold mb-3">No Verification Token</h2>
          <p className="text-gray-400 text-sm leading-relaxed mb-6">
            This page requires a valid verification link. Please check your email for the verification link we sent you.
          </p>
          <Link href="/login">
            <Button variant="outline" className="w-full border-gray-700/40 text-gray-300 hover:bg-white/[3%]">
              Go to Login
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
