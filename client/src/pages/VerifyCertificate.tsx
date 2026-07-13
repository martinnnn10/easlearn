/**
 * Unified certificate verification — module certs + skill certifications.
 */
import { useState } from "react";
import { useRoute, Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import SEO from "@/components/SEO";
import { Shield, CheckCircle, XCircle, Search, Award, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

export default function VerifyCertificate() {
  const [, params] = useRoute("/verify-certificate/:code");
  const urlCode = params?.code || "";

  const [inputCode, setInputCode] = useState(urlCode);
  const [searchCode, setSearchCode] = useState(urlCode);

  const { data: result, isLoading, isFetched } = trpc.verification.verifyCode.useQuery(
    { code: searchCode },
    { enabled: searchCode.length > 0 },
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputCode.trim()) setSearchCode(inputCode.trim());
  };

  const issuedDate = result?.issuedAt
    ? new Date(result.issuedAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "";

  return (
    <div className="py-12 sm:py-20 px-4">
      <SEO title="Verify Certificate" description="Verify EAS module or skill certifications." path="/verify-certificate" />
      <div className="container max-w-2xl">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
          <Shield className="w-12 h-12 text-primary mx-auto mb-4" />
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">Certificate Verification</h1>
          <p className="text-sm text-muted-foreground">
            Enter any EAS verification code — module completion or skill certification.
          </p>
        </motion.div>

        <form onSubmit={handleSearch} className="flex gap-2 mb-8">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={inputCode}
              onChange={(e) => setInputCode(e.target.value)}
              placeholder="Verification code"
              className="w-full pl-10 pr-4 py-3 rounded-xl border bg-background text-sm font-mono"
            />
          </div>
          <Button type="submit" disabled={!inputCode.trim()}>Verify</Button>
        </form>

        {isLoading && searchCode && (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {result && !isLoading && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="card-panel p-6 rounded-xl border">
            <div className="flex items-center gap-2 mb-6">
              <CheckCircle className="w-5 h-5 text-primary" />
              <span className="text-sm font-semibold text-primary">VERIFIED</span>
              <BadgeType type={result.type} />
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-xs uppercase text-muted-foreground mb-1">Awarded To</p>
                <p className="text-xl font-semibold">{result.userName}</p>
              </div>
              <div>
                <p className="text-xs uppercase text-muted-foreground mb-1">Credential</p>
                <p className="text-primary font-medium">{result.title}</p>
              </div>
              {"score" in result && result.score != null && (
                <div>
                  <p className="text-xs uppercase text-muted-foreground mb-1">Quiz Score</p>
                  <p className="text-lg">{result.score}%</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs uppercase text-muted-foreground mb-1">Date Issued</p>
                  <p className="text-sm">{issuedDate}</p>
                </div>
                <div>
                  <p className="text-xs uppercase text-muted-foreground mb-1">Code</p>
                  <p className="text-sm font-mono">{result.code}</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {!result && !isLoading && isFetched && searchCode && (
          <div className="card-panel p-8 rounded-xl text-center">
            <XCircle className="w-12 h-12 text-red-400/60 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Not Found</h3>
            <p className="text-sm text-muted-foreground">
              No certificate matches <span className="font-mono">{searchCode}</span>.
            </p>
          </div>
        )}

        <div className="mt-8 text-center">
          <Link href="/" className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
            <ArrowRight className="w-3 h-3 rotate-180" /> Back to EASLearn
          </Link>
        </div>
      </div>
    </div>
  );
}

function BadgeType({ type }: { type: "module" | "skill" }) {
  return (
    <span className="text-xs px-2 py-0.5 rounded-full bg-muted">
      {type === "module" ? "Module Certificate" : "Skill Certification"}
    </span>
  );
}
