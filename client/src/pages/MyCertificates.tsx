/**
 * My Certificates Page - Shows all certificates earned by the logged-in user
 */
import { motion } from "framer-motion";
import { Link } from "wouter";
import { Award, Download, ExternalLink, BookOpen, ArrowRight } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";

export default function MyCertificates() {
  const { user, isAuthenticated, loading } = useAuth();
  const { data: certificates, isLoading } = trpc.certificates.getMyCertificates.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  if (loading) {
    return (
      <div className="py-20">
        <div className="container max-w-4xl">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-[oklch(0.15_0.003_250)] rounded w-1/3" />
            <div className="h-5 bg-[oklch(0.15_0.003_250)] rounded w-2/3" />
            <div className="space-y-4 mt-8">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-24 bg-[oklch(0.12_0.003_250)] rounded" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="py-20 text-center">
        <SEO title="My Certificates" description="View your earned course completion certificates" path="/my-certificates" />
        <Award className="w-12 h-12 text-[oklch(0.45_0.006_250)] mx-auto mb-4" />
        <h2 className="text-xl font-heading text-white tracking-wide mb-2">Sign In to View Certificates</h2>
        <p className="text-[oklch(0.55_0.008_250)] mb-6">Log in to see your earned course completion certificates.</p>
        <a href="/login" className="inline-flex items-center gap-2 px-6 py-3 btn-primary text-sm font-medium rounded">
          Sign In
        </a>
      </div>
    );
  }

  return (
    <div>
      <SEO title="My Certificates" description="View your earned course completion certificates" path="/my-certificates" />

      {/* Header */}
      <section className="py-16 sm:py-20 border-b border-[oklch(0.18_0.004_250)]">
        <div className="container max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-3xl sm:text-4xl font-heading text-white tracking-wide mb-4">
              My Certificates
            </h1>
            <p className="text-[oklch(0.65_0.008_250)] leading-relaxed">
              Your earned course completion certificates. Each certificate verifies your knowledge and can be shared with employers.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Certificates List */}
      <section className="py-12">
        <div className="container max-w-4xl">
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-24 bg-[oklch(0.12_0.003_250)] rounded animate-pulse" />
              ))}
            </div>
          ) : certificates && certificates.length > 0 ? (
            <div className="space-y-4">
              {certificates.map((cert, i) => {
                const issuedDate = new Date(cert.issuedAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                });

                return (
                  <motion.div
                    key={cert.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="p-6 rounded-lg border border-[oklch(0.18_0.004_250)] bg-[oklch(0.09_0.003_250)] hover:border-[oklch(0.55_0.12_155/40%)] transition-all"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-full bg-[oklch(0.55_0.12_155/15%)] flex items-center justify-center shrink-0">
                        <Award className="w-6 h-6 text-[oklch(0.55_0.12_155)]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-medium text-white mb-1">
                          {cert.moduleTitle}
                        </h3>
                        <div className="flex flex-wrap items-center gap-4 text-sm text-[oklch(0.50_0.008_250)]">
                          <span>Score: <span className="text-[oklch(0.55_0.12_155)] font-medium">{cert.quizScore}%</span></span>
                          <span>Issued: {issuedDate}</span>
                          <span className="font-mono text-xs text-[oklch(0.40_0.006_250)]">ID: {cert.certificateCode}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Link href={`/certificate/${cert.certificateCode}`}>
                          <Button variant="outline" size="sm" className="gap-1.5">
                            <ExternalLink className="w-3.5 h-3.5" />
                            View
                          </Button>
                        </Link>
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1.5"
                          onClick={() => {
                            const printWindow = window.open(`/certificate/${cert.certificateCode}`, '_blank');
                            if (printWindow) {
                              printWindow.addEventListener('load', () => {
                                setTimeout(() => printWindow.print(), 500);
                              });
                            }
                          }}
                        >
                          <Download className="w-3.5 h-3.5" />
                          PDF
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16"
            >
              <BookOpen className="w-12 h-12 text-[oklch(0.35_0.006_250)] mx-auto mb-4" />
              <h3 className="text-lg font-heading text-white tracking-wide mb-2">
                No Certificates Yet
              </h3>
              <p className="text-[oklch(0.55_0.008_250)] mb-6 max-w-md mx-auto">
                Complete course modules and pass the end-of-module quizzes (70% or higher) to earn your certificates.
              </p>
              <Link href="/courses">
                <Button className="gap-2">
                  <BookOpen className="w-4 h-4" />
                  Browse Courses
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </motion.div>
          )}
        </div>
      </section>
    </div>
  );
}
