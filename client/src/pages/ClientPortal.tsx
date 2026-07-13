/**
 * Client Portal - Clean demo page
 * Shows what the client portal would look like
 */
import { motion } from "framer-motion";
import { Link } from "wouter";
import { ArrowRight, Lock, BarChart3, Users, FileText } from "lucide-react";
import SEO from "@/components/SEO";

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.5 }
};

export default function ClientPortal() {
  return (
    <div>
      <SEO
        title="Client Portal"
        description="Access your EAS client dashboard for training progress, team analytics, and scenario management."
        path="/client-portal"
      />
      {/* Hero */}
      <section className="py-20 sm:py-28 border-b border-[oklch(0.18_0.004_250)]">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-3xl"
          >
            <h1 className="text-4xl sm:text-5xl font-heading text-white tracking-wide mb-5">
              Client Portal
            </h1>
            <p className="text-lg text-[oklch(0.65_0.008_250)] leading-relaxed">
              Track your team's training progress, manage simulator access, and view assessment results — all in one place.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Demo Preview */}
      <section className="py-20">
        <div className="container">
          <motion.div {...fadeIn} className="mb-12">
            <div className="flex items-center gap-3 mb-4">
              <Lock className="w-4 h-4 text-[oklch(0.55_0.12_155)]" />
              <span className="text-sm font-mono-industrial text-[oklch(0.50_0.008_250)]">
                DEMO MODE — Login required for full access
              </span>
            </div>
            <h2 className="text-2xl font-heading text-white tracking-wide">
              What You'll See Inside
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
            {[
              {
                icon: BarChart3,
                title: "Training Progress",
                desc: "See which technicians have completed which modules, their scores, and areas that need attention.",
              },
              {
                icon: Users,
                title: "Assessment Results",
                desc: "Track active searches, candidate status, interview schedules, and placement history.",
              },
              {
                icon: FileText,
                title: "Reports & Analytics",
                desc: "Skill gap analysis, team competency mapping, and training ROI documentation for your leadership.",
              },
            ].map((item, i) => (
              <motion.div
                key={i}
                {...fadeIn}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className="card-panel p-6"
              >
                <item.icon className="w-6 h-6 text-[oklch(0.55_0.12_155)] mb-4" />
                <h4 className="text-base font-semibold text-white mb-2">{item.title}</h4>
                <p className="text-sm text-[oklch(0.58_0.008_250)] leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>

          {/* CTA */}
          <motion.div {...fadeIn} className="text-center">
            <p className="text-[oklch(0.60_0.008_250)] mb-6">
              Contact us to set up your client portal account.
            </p>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 px-6 py-3 btn-primary text-sm font-medium rounded"
            >
              Request Access
              <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
