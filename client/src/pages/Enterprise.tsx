/**
 * Enterprise Page — Showcases enterprise-grade capabilities.
 * Includes SSO, SCORM, compliance tracking, and manager analytics placeholders.
 * Designed to signal "enterprise-ready" to decision-makers evaluating the platform.
 */
import { motion } from "framer-motion";
import { Link } from "wouter";
import {
  Shield, Lock, BarChart3, Users, FileCheck, Server,
  ArrowRight, CheckCircle, Building2, Globe, Headphones,
  BookOpen, Award, Zap, Database, Network
} from "lucide-react";
import { Button } from "@/components/ui/button";
import SEO from "@/components/SEO";

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
};

const enterpriseFeatures = [
  {
    icon: Lock,
    title: "Single Sign-On (SSO)",
    description: "SAML 2.0 and OAuth integration with your existing identity provider. Active Directory, Okta, Azure AD — your team logs in once.",
    status: "Coming Q3 2026",
    statusColor: "text-amber-400",
  },
  {
    icon: FileCheck,
    title: "SCORM / xAPI Export",
    description: "Export any course as a SCORM 1.2 or xAPI package for your existing LMS. Track completions in your system of record.",
    status: "Coming Q3 2026",
    statusColor: "text-amber-400",
  },
  {
    icon: Shield,
    title: "Compliance Tracking",
    description: "Automated OSHA, NFPA 70E, and NEC compliance tracking. Generate audit-ready reports showing who completed what training and when.",
    status: "Coming Q4 2026",
    statusColor: "text-amber-400",
  },
  {
    icon: BarChart3,
    title: "Manager Analytics",
    description: "Real-time dashboards showing team progress, skill gaps, certification status, and training ROI metrics.",
    status: "Available Now",
    statusColor: "text-[oklch(0.55_0.12_155)]",
  },
  {
    icon: Users,
    title: "Team Management",
    description: "Assign courses, set deadlines, manage seats, and track individual progress across your entire maintenance department.",
    status: "Available Now",
    statusColor: "text-[oklch(0.55_0.12_155)]",
  },
  {
    icon: Database,
    title: "API Access",
    description: "RESTful API for integrating training data with your CMMS, ERP, or HR systems. Webhooks for real-time event notifications.",
    status: "Coming Q4 2026",
    statusColor: "text-amber-400",
  },
];

const trustSignals = [
  { icon: Building2, label: "Built for Industrial", description: "Not a generic LMS — purpose-built for maintenance and electrical teams" },
  { icon: Server, label: "Enterprise Security", description: "TLS encryption in transit, encrypted data at rest, role-based access controls" },
  { icon: Globe, label: "99.9% Uptime SLA", description: "Hosted on redundant infrastructure with guaranteed availability" },
  { icon: Headphones, label: "Dedicated Support", description: "Named account manager and priority technical support" },
];

export default function Enterprise() {
  return (
    <div>
      <SEO
        title="Enterprise Solutions"
        description="Enterprise-grade industrial training with SSO, SCORM, compliance tracking, and manager analytics."
        path="/enterprise"
      />

      {/* Hero */}
      <section className="relative py-20 sm:py-28 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[oklch(0.12_0.02_155/8%)] via-transparent to-transparent" />
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-[oklch(0.55_0.12_155/30%)] to-transparent" />

        <div className="container max-w-5xl relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[oklch(0.55_0.12_155/8%)] border border-[oklch(0.55_0.12_155/20%)] text-xs font-mono text-[oklch(0.55_0.12_155)] mb-6">
              <Building2 className="w-3.5 h-3.5" />
              Enterprise Solutions
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-heading text-white tracking-wide mb-5 leading-tight">
              Industrial Training at Scale
            </h1>
            <p className="text-lg text-[oklch(0.60_0.008_250)] max-w-2xl mx-auto mb-8 leading-relaxed">
              Deploy standardized electrical and maintenance training across your entire organization. 
              Track compliance, measure competency, and reduce downtime.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 px-8 py-3.5 btn-primary text-sm font-semibold rounded-lg shadow-lg shadow-[oklch(0.55_0.12_155/15%)]"
              >
                Contact Sales
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="/pricing" className="inline-flex items-center gap-2 px-6 py-3 text-sm text-[oklch(0.55_0.12_155)] border border-[oklch(0.55_0.12_155/30%)] rounded-lg hover:bg-[oklch(0.55_0.12_155/8%)] transition-colors">
                View Team Pricing
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Enterprise Features Grid */}
      <section className="py-16 sm:py-20">
        <div className="container max-w-5xl">
          <motion.div {...fadeUp} className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-heading text-white tracking-wide mb-3">
              Enterprise-Grade Capabilities
            </h2>
            <p className="text-[oklch(0.55_0.008_250)] max-w-xl mx-auto">
              Everything your organization needs to deploy, manage, and track industrial training at scale.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {enterpriseFeatures.map((feature, i) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.title}
                  {...fadeUp}
                  transition={{ delay: i * 0.06 }}
                  className="card-panel p-5 rounded-xl group"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 rounded-lg bg-[oklch(0.55_0.12_155/8%)] border border-[oklch(0.55_0.12_155/18%)] flex items-center justify-center">
                      <Icon className="w-5 h-5 text-[oklch(0.55_0.12_155)]" />
                    </div>
                    <span className={`text-[10px] font-mono ${feature.statusColor}`}>
                      {feature.status}
                    </span>
                  </div>
                  <h3 className="text-sm font-semibold text-white mb-2">{feature.title}</h3>
                  <p className="text-xs text-[oklch(0.50_0.008_250)] leading-relaxed">{feature.description}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Trust Signals */}
      <section className="py-16 border-t border-[oklch(0.14_0.004_250)]">
        <div className="container max-w-5xl">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {trustSignals.map((signal, i) => {
              const Icon = signal.icon;
              return (
                <motion.div
                  key={signal.label}
                  {...fadeUp}
                  transition={{ delay: i * 0.08 }}
                  className="text-center p-5"
                >
                  <div className="w-12 h-12 rounded-xl bg-[oklch(0.10_0.003_250)] border border-[oklch(0.16_0.004_250)] flex items-center justify-center mx-auto mb-3">
                    <Icon className="w-5 h-5 text-[oklch(0.55_0.12_155)]" />
                  </div>
                  <h4 className="text-sm font-semibold text-white mb-1">{signal.label}</h4>
                  <p className="text-[11px] text-[oklch(0.45_0.006_250)] leading-relaxed">{signal.description}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Skill-Gap Analysis Preview */}
      <section className="py-16 sm:py-20 border-t border-[oklch(0.14_0.004_250)]">
        <div className="container max-w-5xl">
          <motion.div {...fadeUp} className="grid lg:grid-cols-2 gap-8 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/8 border border-amber-500/20 text-[10px] font-mono text-amber-400 mb-4">
                <BarChart3 className="w-3 h-3" />
                Coming Q4 2026
              </div>
              <h2 className="text-2xl sm:text-3xl font-heading text-white tracking-wide mb-4">
                Skill-Gap Analysis
              </h2>
              <p className="text-sm text-[oklch(0.55_0.008_250)] leading-relaxed mb-6">
                Identify exactly where your team needs training. Our skill-gap analysis maps each technician's 
                competencies against your facility's requirements, generating targeted training plans that close 
                gaps efficiently.
              </p>
              <ul className="space-y-3">
                {[
                  "Per-technician competency heat maps",
                  "Facility-specific skill requirements mapping",
                  "Auto-generated training recommendations",
                  "Quarterly progress trend reports",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2.5 text-xs text-[oklch(0.60_0.008_250)]">
                    <CheckCircle className="w-3.5 h-3.5 text-[oklch(0.55_0.12_155)] shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Mockup Dashboard Card */}
            <div className="card-panel p-5 rounded-xl">
              <div className="text-[10px] uppercase tracking-[0.12em] font-bold text-[oklch(0.45_0.006_250)] mb-4">Skill-Gap Dashboard Preview</div>
              <div className="space-y-3">
                {[
                  { skill: "VFD Troubleshooting", team: 72, required: 90 },
                  { skill: "Motor Control Circuits", team: 85, required: 85 },
                  { skill: "PLC Programming", team: 45, required: 75 },
                  { skill: "Electrical Safety (NFPA 70E)", team: 91, required: 95 },
                  { skill: "Instrumentation & Sensors", team: 58, required: 80 },
                ].map((item) => {
                  const gap = item.required - item.team;
                  const hasGap = gap > 0;
                  return (
                    <div key={item.skill}>
                      <div className="flex items-center justify-between text-[11px] mb-1">
                        <span className="text-[oklch(0.65_0.008_250)]">{item.skill}</span>
                        <span className={hasGap ? "text-amber-400 font-mono" : "text-[oklch(0.55_0.12_155)] font-mono"}>
                          {hasGap ? `−${gap}% gap` : "On target"}
                        </span>
                      </div>
                      <div className="h-1.5 bg-[oklch(0.12_0.003_250)] rounded-full overflow-hidden relative">
                        <div
                          className={`h-full rounded-full ${hasGap ? "bg-amber-500/60" : "bg-[oklch(0.55_0.12_155)]"}`}
                          style={{ width: `${item.team}%` }}
                        />
                        <div
                          className="absolute top-0 h-full w-0.5 bg-white/40"
                          style={{ left: `${item.required}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-4 pt-3 border-t border-[oklch(0.15_0.004_250)] flex items-center justify-between">
                <span className="text-[10px] text-[oklch(0.40_0.006_250)]">White line = required level</span>
                <span className="text-[10px] text-amber-400 font-mono">3 skills need attention</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-16 sm:py-20 border-t border-[oklch(0.14_0.004_250)]">
        <div className="container max-w-5xl">
          <motion.div {...fadeUp} className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-heading text-white tracking-wide mb-3">
              Built for Your Industry
            </h2>
          </motion.div>

          <div className="grid sm:grid-cols-3 gap-5">
            {[
              {
                title: "Manufacturing Plants",
                description: "Standardize maintenance training across shifts and facilities. Reduce unplanned downtime by ensuring every technician has the skills to troubleshoot effectively.",
                stats: "40% faster fault resolution",
                icon: Zap,
              },
              {
                title: "Utilities & Energy",
                description: "Meet regulatory training requirements with auditable completion records. OSHA, NFPA 70E, and NEC compliance tracking built in.",
                stats: "100% audit-ready records",
                icon: Network,
              },
              {
                title: "Facilities Management",
                description: "Train multi-trade teams on electrical systems, HVAC controls, and building automation. One platform for all technical training needs.",
                stats: "Unified training platform",
                icon: Building2,
              },
            ].map((useCase, i) => {
              const Icon = useCase.icon;
              return (
                <motion.div
                  key={useCase.title}
                  {...fadeUp}
                  transition={{ delay: i * 0.08 }}
                  className="card-panel p-6 rounded-xl"
                >
                  <Icon className="w-8 h-8 text-[oklch(0.55_0.12_155)] mb-4" />
                  <h3 className="text-base font-heading text-white mb-2">{useCase.title}</h3>
                  <p className="text-xs text-[oklch(0.50_0.008_250)] leading-relaxed mb-4">{useCase.description}</p>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[oklch(0.55_0.12_155/8%)] text-[10px] font-mono text-[oklch(0.55_0.12_155)]">
                    <CheckCircle className="w-3 h-3" />
                    {useCase.stats}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 sm:py-20 border-t border-[oklch(0.14_0.004_250)]">
        <div className="container max-w-3xl text-center">
          <motion.div {...fadeUp}>
            <h2 className="text-2xl sm:text-3xl font-heading text-white tracking-wide mb-4">
              Ready to Train Your Team?
            </h2>
            <p className="text-[oklch(0.55_0.008_250)] mb-8 max-w-lg mx-auto">
              Get a custom demo and pricing for your organization. We'll show you how EAS can 
              reduce training costs and improve technician competency.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 px-8 py-3.5 btn-primary text-sm font-semibold rounded-lg shadow-lg shadow-[oklch(0.55_0.12_155/15%)]"
              >
                Schedule a Demo
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="/pricing" className="text-sm text-[oklch(0.55_0.12_155)] hover:underline">
                Or start with a Team plan →
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
