/**
 * Resources Page - Premium industrial downloads with visual hierarchy
 */
import { useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { trpc } from "@/lib/trpc";
import SEO from "@/components/SEO";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";
import {
  Download,
  FileText,
  CheckCircle,
  Zap,
  Cpu,
  Shield,
  Wrench,
  ArrowRight,
} from "lucide-react";

interface LeadMagnet {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  pages: string;
  icon: React.ReactNode;
  highlights: string[];
}

const leadMagnets: LeadMagnet[] = [
  {
    id: "troubleshooting-cheat-sheet",
    title: "The Industrial Troubleshooting Cheat Sheet",
    subtitle: "2-Page Printable Reference",
    description:
      "A laminate-ready reference card for your tool bag. Covers the most common fault codes, LED meanings, and diagnostic steps you'll use every shift.",
    pages: "2 pages",
    icon: <Zap className="w-5 h-5" />,
    highlights: [
      "PowerFlex 525 Top 10 Fault Codes with quick-fix steps",
      "Allen-Bradley PLC LED status indicator meanings",
      "Multimeter settings for common industrial measurements",
      "Safety circuit troubleshooting flowchart",
      "EtherNet/IP quick diagnostic steps",
    ],
  },
  {
    id: "powerflex-parameter-reference",
    title: "PowerFlex 525 Parameter Quick Reference",
    subtitle: "1-Page Printable Card",
    description:
      "The most commonly changed PowerFlex 525 parameters organized by function. Stop scrolling through the manual — keep this at the drive.",
    pages: "1 page",
    icon: <Cpu className="w-5 h-5" />,
    highlights: [
      "Motor Data parameters (P031-P036)",
      "Speed Reference & Accel/Decel (P038-P042)",
      "Fault Configuration & Auto-Reset (P044-P049)",
      "Communication setup (P054-P058)",
      "Digital I/O assignment (P061-P066)",
    ],
  },
  {
    id: "plc-troubleshooting-flowchart",
    title: "PLC Troubleshooting Flowchart",
    subtitle: "Visual Decision Tree",
    description:
      "A systematic visual guide: 'Output not energizing? Start here.' Follow the branches to isolate the fault in minutes, not hours.",
    pages: "1 page",
    icon: <Shield className="w-5 h-5" />,
    highlights: [
      "Dead output systematic diagnosis path",
      "Communication fault decision tree",
      "Module fault LED interpretation guide",
      "Forcing I/O safety checklist",
      "Major fault recovery procedure",
    ],
  },
];

const fadeIn = {
  initial: { opacity: 0, y: 15 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.4 }
};

export default function Resources() {
  const { user } = useAuth();
  const [downloadEmail, setDownloadEmail] = useState("");
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [downloadedIds, setDownloadedIds] = useState<Set<string>>(new Set());

  const downloadMutation = trpc.resources.requestDownload.useMutation({
    onSuccess: (data: { success: boolean; downloadUrl?: string }) => {
      if (data.success) {
        setDownloadedIds((prev) => { const next = new Set(prev); next.add(downloadingId!); return next; });
        toast.success("Download link sent! Check your email.", {
          description: "The PDF has also been opened in a new tab.",
        });
        if (data.downloadUrl) {
          window.open(data.downloadUrl, "_blank");
        }
      }
      setDownloadingId(null);
    },
    onError: (error: { message: string }) => {
      toast.error("Download failed", { description: error.message });
      setDownloadingId(null);
    },
  });

  const handleDownload = (resourceId: string) => {
    const email = user?.email || downloadEmail;
    if (!email) {
      toast.error("Please enter your email address");
      return;
    }
    setDownloadingId(resourceId);
    downloadMutation.mutate({
      resourceId,
      email,
      name: user?.name || undefined,
    });
  };

  return (
    <>
      <SEO
        title="Free Resources & Downloads"
        description="Download free industrial troubleshooting cheat sheets, parameter references, and flowcharts. Printable PDFs for maintenance technicians."
        path="/resources"
      />
      <div>
        {/* Hero */}
        <section className="relative py-20 sm:py-28 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-[oklch(0.12_0.02_155/6%)] via-transparent to-transparent" />
          <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-[oklch(0.55_0.12_155/25%)] to-transparent" />
          
          <div className="container relative">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="max-w-3xl mx-auto text-center"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[oklch(0.55_0.12_155/10%)] border border-[oklch(0.55_0.12_155/20%)] text-xs text-[oklch(0.65_0.10_155)] mb-5">
                <Download className="w-3.5 h-3.5" />
                Free Downloads
              </div>
              <h1 className="text-4xl sm:text-5xl font-heading text-white tracking-wide mb-5">
                Free Resources for Maintenance Techs
              </h1>
              <p className="text-lg text-[oklch(0.65_0.008_250)] leading-relaxed">
                Printable cheat sheets, parameter references, and troubleshooting
                flowcharts. Keep them in your tool bag or laminate them for the
                shop floor.
              </p>
            </motion.div>
          </div>
          
          <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-[oklch(0.20_0.004_250)] to-transparent" />
        </section>

        {/* Resources Grid */}
        <section className="py-12 sm:py-16">
          <div className="container">
            <div className="max-w-5xl mx-auto space-y-6">
              {leadMagnets.map((resource, i) => (
                <motion.div key={resource.id} {...fadeIn} transition={{ duration: 0.4, delay: i * 0.1 }}>
                  <div className="card-panel overflow-hidden hover:border-[oklch(0.55_0.12_155/25%)] transition-colors">
                    <div className="grid grid-cols-1 md:grid-cols-[1fr_300px]">
                      <div className="p-6 sm:p-8">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-9 h-9 rounded-lg bg-[oklch(0.55_0.12_155/10%)] border border-[oklch(0.55_0.12_155/20%)] flex items-center justify-center text-[oklch(0.55_0.12_155)]">
                            {resource.icon}
                          </div>
                          <div>
                            <h2 className="text-lg font-heading text-white tracking-wide">
                              {resource.title}
                            </h2>
                            <p className="text-xs text-[oklch(0.45_0.006_250)]">
                              {resource.subtitle} — {resource.pages}
                            </p>
                          </div>
                        </div>

                        <p className="text-sm text-[oklch(0.58_0.008_250)] leading-relaxed mb-4">
                          {resource.description}
                        </p>

                        <div className="space-y-2">
                          <p className="text-xs font-medium text-[oklch(0.65_0.008_250)] uppercase tracking-wider">
                            What's included:
                          </p>
                          <ul className="space-y-1.5">
                            {resource.highlights.map((h, j) => (
                              <li
                                key={j}
                                className="flex items-start gap-2 text-xs text-[oklch(0.55_0.008_250)]"
                              >
                                <CheckCircle className="w-3.5 h-3.5 text-[oklch(0.55_0.12_155)] mt-0.5 shrink-0" />
                                {h}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      {/* Download Panel */}
                      <div className="bg-[oklch(0.07_0.003_250)] p-6 sm:p-8 flex flex-col justify-center border-t md:border-t-0 md:border-l border-[oklch(0.15_0.004_250)]">
                        {downloadedIds.has(resource.id) ? (
                          <div className="text-center space-y-3">
                            <CheckCircle className="w-10 h-10 text-[oklch(0.55_0.12_155)] mx-auto" />
                            <p className="text-sm font-medium text-white">
                              Download Ready!
                            </p>
                            <p className="text-xs text-[oklch(0.50_0.008_250)]">
                              Check your email or the new tab that opened.
                            </p>
                            <button
                              onClick={() => handleDownload(resource.id)}
                              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-[oklch(0.20_0.004_250)] text-xs text-[oklch(0.65_0.008_250)] hover:border-[oklch(0.55_0.12_155/30%)] transition-colors"
                            >
                              Download Again
                            </button>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            <div className="text-center">
                              <FileText className="w-8 h-8 text-[oklch(0.40_0.006_250)] mx-auto mb-2" />
                              <p className="text-xs font-medium text-[oklch(0.65_0.008_250)]">
                                Get your free PDF
                              </p>
                            </div>

                            {!user && (
                              <input
                                type="email"
                                placeholder="Your work email"
                                value={downloadEmail}
                                onChange={(e) => setDownloadEmail(e.target.value)}
                                className="w-full px-3 py-2.5 rounded-lg bg-[oklch(0.10_0.003_250)] border border-[oklch(0.18_0.004_250)] text-sm text-white placeholder:text-[oklch(0.40_0.006_250)] focus:outline-none focus:border-[oklch(0.55_0.12_155/50%)] transition-colors"
                              />
                            )}

                            <button
                              className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 btn-primary text-sm font-medium rounded"
                              onClick={() => handleDownload(resource.id)}
                              disabled={downloadingId === resource.id}
                            >
                              {downloadingId === resource.id ? (
                                "Preparing..."
                              ) : (
                                <>
                                  <Download className="w-4 h-4" />
                                  Download Free PDF
                                </>
                              )}
                            </button>

                            <p className="text-[10px] text-[oklch(0.40_0.006_250)] text-center">
                              {user
                                ? "Instant download — no email required for subscribers"
                                : "We'll send the PDF to your email. No spam, ever."}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* CTA Section */}
            <motion.div {...fadeIn} className="max-w-3xl mx-auto mt-16 text-center">
              <div className="card-panel p-8 border-[oklch(0.55_0.12_155/20%)] relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-[oklch(0.55_0.12_155/5%)] to-transparent" />
                <div className="relative">
                  <Wrench className="w-8 h-8 text-[oklch(0.55_0.12_155)] mx-auto mb-4" />
                  <h3 className="text-xl font-heading text-white tracking-wide mb-3">
                    Want hands-on practice?
                  </h3>
                  <p className="text-sm text-[oklch(0.55_0.008_250)] mb-6 max-w-lg mx-auto">
                    These cheat sheets are great references, but real learning
                    happens in our interactive troubleshooting simulator. Practice
                    diagnosing faults with realistic meter readings and branching
                    decisions.
                  </p>
                  <div className="flex flex-wrap gap-3 justify-center">
                    <Link
                      href="/simulator"
                      className="inline-flex items-center gap-2 px-6 py-3 btn-primary text-sm font-medium rounded"
                    >
                      Try the Simulator
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                    <Link
                      href="/courses"
                      className="inline-flex items-center gap-2 px-6 py-3 rounded border border-[oklch(0.20_0.004_250)] text-sm text-[oklch(0.65_0.008_250)] hover:border-[oklch(0.55_0.12_155/30%)] transition-colors"
                    >
                      Browse Courses
                    </Link>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>
      </div>
    </>
  );
}
