/**
 * EAS Pricing Page
 * Clean, professional pricing tiers with team per-seat pricing
 */
import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { Check, Shield, Zap, Users, Minus, Plus, Building2, ArrowRight } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import SEO from "@/components/SEO";

export default function Pricing() {
  const { user, isAuthenticated } = useAuth();
  const [teamSeats, setTeamSeats] = useState(10);
  const [teamName, setTeamName] = useState("");
  const [billingInterval, setBillingInterval] = useState<"month" | "year">("month");
  const { data: subscription } = trpc.stripe.getSubscription.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const createCheckout = trpc.stripe.createCheckout.useMutation({
    onSuccess: (data) => {
      if (data.url) {
        window.open(data.url, "_blank");
        toast.info("Redirecting to checkout...");
      }
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create checkout session");
    },
  });

  const handleSubscribe = (planId: string) => {
    if (!isAuthenticated) {
      window.location.href = "/login";
      return;
    }
    if (planId === "free") return;
    const actualPlan = billingInterval === "year"
      ? (planId === "pro" ? "proAnnual" : "teamAnnual")
      : planId;
    if (planId === "team" || planId === "teamAnnual") {
      createCheckout.mutate({
        plan: actualPlan as any,
        seats: teamSeats,
        teamName: teamName || undefined,
      });
    } else {
      createCheckout.mutate({ plan: actualPlan as any });
    }
  };

  const teamMonthly = billingInterval === "year" ? teamSeats * 200 : teamSeats * 20;
  const teamMonthlyEquivalent = billingInterval === "year" ? Math.round(teamSeats * 16.67) : teamSeats * 20;

  return (
    <div>
      <SEO
        title="Pricing & Plans"
        description="Affordable industrial maintenance training. Start free, go individual from $6.67/mo (become a tech), or Team at $20/seat/mo with a manager dashboard, assignments, and reporting. Your plant can reimburse it."
        path="/pricing"
      />
      {/* Hero */}
      <section className="py-20 sm:py-28 border-b border-[oklch(0.18_0.004_250)]">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-3xl mx-auto text-center"
          >
            <h1 className="text-4xl sm:text-5xl font-heading text-white tracking-wide mb-5">
              PRICING
            </h1>
            <p className="text-lg text-[oklch(0.65_0.008_250)] leading-relaxed mb-8">
              Invest in your team's troubleshooting capability. Real scenarios, real skill development.
            </p>

            {/* Billing Toggle */}
            <div className="inline-flex items-center gap-3 bg-[oklch(0.09_0.003_250)] rounded-full p-1 border border-[oklch(0.18_0.004_250)]">
              <button
                onClick={() => setBillingInterval("month")}
                className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
                  billingInterval === "month"
                    ? "bg-[oklch(0.55_0.12_155)] text-white"
                    : "text-[oklch(0.55_0.008_250)] hover:text-white"
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingInterval("year")}
                className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
                  billingInterval === "year"
                    ? "bg-[oklch(0.55_0.12_155)] text-white"
                    : "text-[oklch(0.55_0.008_250)] hover:text-white"
                }`}
              >
                Annual
                <span className="ml-1.5 text-[10px] font-bold bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded">SAVE 20%</span>
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-16 bg-[oklch(0.07_0.003_250)]">
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {/* Free Plan */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0 }}
              className="relative rounded-lg p-6 bg-[oklch(0.09_0.003_250)] border border-[oklch(0.18_0.004_250)]"
            >
              <div className="mb-6">
                <h3 className="text-lg font-heading text-white tracking-wide mb-2">STARTER</h3>
                <div className="flex items-baseline gap-1 mb-3">
                  <span className="text-3xl font-heading text-white">$0</span>
                </div>
                <p className="text-[13px] text-[oklch(0.55_0.008_250)] leading-relaxed">
                  Try the simulator with 2 free scenarios. No credit card required.
                </p>
              </div>
              <ul className="space-y-3 mb-8">
                {[
                  "2 troubleshooting scenarios",
                  "Full decision tree experience",
                  "Score tracking",
                  "Tool panels (Multimeter, Prints, Flashlight)",
                ].map((f, j) => (
                  <li key={j} className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-[oklch(0.55_0.12_155)] shrink-0 mt-0.5" />
                    <span className="text-[13px] text-[oklch(0.65_0.008_250)]">{f}</span>
                  </li>
                ))}
              </ul>
              {subscription?.tier === "free" ? (
                <div className="w-full text-center py-3 rounded border border-[oklch(0.55_0.12_155/30%)] text-[oklch(0.55_0.12_155)] text-[13px] font-semibold tracking-wider uppercase">
                  Current Plan
                </div>
              ) : (
                <Link href="/simulator">
                  <div className="w-full text-center py-3 rounded border border-[oklch(0.25_0.004_250)] text-[oklch(0.7_0.008_250)] text-[13px] font-semibold tracking-wider uppercase cursor-pointer hover:border-[oklch(0.35_0.004_250)] hover:text-white transition-colors">
                    Get Started Free
                  </div>
                </Link>
              )}
            </motion.div>

            {/* Pro Plan */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="relative rounded-lg p-6 bg-[oklch(0.09_0.006_155)] border-2 border-[oklch(0.55_0.12_155/40%)]"
            >
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-[oklch(0.55_0.12_155)] rounded text-[10px] font-mono-industrial text-white tracking-wider">
                MOST POPULAR
              </div>
              <div className="mb-6">
                <h3 className="text-lg font-heading text-white tracking-wide mb-2">INDIVIDUAL — BECOME A TECH</h3>
                <div className="flex items-baseline gap-1 mb-1">
                  <span className="text-3xl font-heading text-white">
                    ${billingInterval === "year" ? "6.67" : "7.99"}
                  </span>
                  <span className="text-sm text-[oklch(0.5_0.006_250)]">/month</span>
                  {billingInterval === "year" && (
                    <span className="text-[11px] text-amber-300 ml-2">billed $80/yr</span>
                  )}
                </div>
                <p className="text-[12px] text-[oklch(0.55_0.12_155)] mb-3">💡 Your plant can reimburse this — ask your supervisor.</p>
                <p className="text-[13px] text-[oklch(0.55_0.008_250)] leading-relaxed">
                  Everything an operator needs to learn maintenance and get job-ready.
                </p>
              </div>
              <ul className="space-y-3 mb-8">
                {[
                  "The full Operator → Maintenance Tech path",
                  "Full course library + every lab",
                  "AI tutor coaching + scored simulators",
                  "Spaced-repetition review so it sticks",
                  "Skills Passport + certificates",
                  "Progress & methodology tracking",
                ].map((f, j) => (
                  <li key={j} className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-[oklch(0.55_0.12_155)] shrink-0 mt-0.5" />
                    <span className="text-[13px] text-[oklch(0.65_0.008_250)]">{f}</span>
                  </li>
                ))}
              </ul>
              {subscription?.tier === "pro" ? (
                <div className="w-full text-center py-3 rounded border border-[oklch(0.55_0.12_155/30%)] text-[oklch(0.55_0.12_155)] text-[13px] font-semibold tracking-wider uppercase">
                  Current Plan
                </div>
              ) : (
                <button
                  onClick={() => handleSubscribe("pro")}
                  disabled={createCheckout.isPending}
                  className="w-full py-3 rounded text-[13px] font-semibold tracking-wider uppercase transition-colors btn-primary"
                >
                  {createCheckout.isPending ? "Processing..." : "Start Pro Plan"}
                </button>
              )}
            </motion.div>

            {/* Team Plan */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="relative rounded-lg p-6 bg-[oklch(0.09_0.003_250)] border border-[oklch(0.18_0.004_250)]"
            >
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-blue-600 rounded text-[10px] font-mono-industrial text-white tracking-wider">
                BEST VALUE
              </div>
              <div className="mb-6">
                <h3 className="text-lg font-heading text-white tracking-wide mb-2">TEAM / COMPANY</h3>
                <div className="flex items-baseline gap-1 mb-3">
                  <span className="text-3xl font-heading text-white">
                    ${billingInterval === "year" ? "16.67" : "20"}
                  </span>
                  <span className="text-sm text-[oklch(0.5_0.006_250)]">/seat/month</span>
                  {billingInterval === "year" && (
                    <span className="text-[11px] text-amber-300 ml-2">billed annually</span>
                  )}
                </div>
                <p className="text-[13px] text-[oklch(0.55_0.008_250)] leading-relaxed">
                  For maintenance departments. Manage your team's training with admin oversight.
                </p>
              </div>
              <ul className="space-y-3 mb-4">
                {[
                  "Everything in Pro",
                  "5-50 team seats",
                  "Team admin dashboard",
                  "Invite members via email link",
                  "Team progress tracking & reporting",
                  "Priority support",
                ].map((f, j) => (
                  <li key={j} className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-[oklch(0.55_0.12_155)] shrink-0 mt-0.5" />
                    <span className="text-[13px] text-[oklch(0.65_0.008_250)]">{f}</span>
                  </li>
                ))}
              </ul>

              {/* Seat selector */}
              <div className="mb-4 p-3 bg-[oklch(0.07_0.003_250)] rounded border border-[oklch(0.18_0.004_250)]">
                <label className="text-[11px] text-[oklch(0.5_0.006_250)] uppercase tracking-wider block mb-2">
                  Team Size
                </label>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setTeamSeats(Math.max(5, teamSeats - 1))}
                    className="w-8 h-8 rounded bg-zinc-800 text-white flex items-center justify-center hover:bg-zinc-700 transition-colors"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="text-xl font-bold text-white min-w-[3ch] text-center">{teamSeats}</span>
                  <button
                    onClick={() => setTeamSeats(Math.min(50, teamSeats + 1))}
                    className="w-8 h-8 rounded bg-zinc-800 text-white flex items-center justify-center hover:bg-zinc-700 transition-colors"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                  <span className="text-[12px] text-[oklch(0.5_0.006_250)] ml-auto">seats</span>
                </div>
                <div className="mt-2 text-right">
                  <span className="text-[13px] text-white font-semibold">
                    {billingInterval === "year"
                      ? `$${teamMonthly}/yr total (~$${teamMonthlyEquivalent}/mo)`
                      : `$${teamMonthly}/mo total`}
                  </span>
                  <span className="text-[11px] text-[oklch(0.5_0.006_250)] ml-1">
                    {billingInterval === "year" ? "(save 17% vs monthly)" : "(admin dashboard + reporting)"}
                  </span>
                </div>
              </div>

              {/* Team name input */}
              <div className="mb-4">
                <Input
                  type="text"
                  placeholder="Team name (e.g., Plant 3 Maintenance)"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  className="bg-zinc-800 border-zinc-700 text-white text-[13px]"
                />
              </div>

              {subscription?.tier === "team" ? (
                <div className="w-full text-center py-3 rounded border border-[oklch(0.55_0.12_155/30%)] text-[oklch(0.55_0.12_155)] text-[13px] font-semibold tracking-wider uppercase">
                  Current Plan
                </div>
              ) : (
                <button
                  onClick={() => handleSubscribe("team")}
                  disabled={createCheckout.isPending}
                  className="w-full py-3 rounded text-[13px] font-semibold tracking-wider uppercase transition-colors border border-[oklch(0.55_0.12_155/30%)] text-[oklch(0.55_0.12_155)] hover:bg-[oklch(0.55_0.12_155/8%)]"
                >
                  {createCheckout.isPending ? "Processing..." : "Start Team Plan"}
                </button>
              )}
            </motion.div>
          </div>

          {/* Enterprise band — the procurement-friendly buying path */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.25 }}
            className="max-w-5xl mx-auto mt-6 rounded-lg border border-[oklch(0.35_0.05_260)] bg-gradient-to-br from-[oklch(0.10_0.02_260)] to-[oklch(0.08_0.003_250)] p-6 sm:p-8"
          >
            <div className="flex flex-col lg:flex-row lg:items-center gap-6">
              <div className="lg:w-1/3">
                <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded bg-[oklch(0.35_0.05_260)]/30 text-[10px] font-mono-industrial tracking-wider text-blue-200 mb-3">
                  <Building2 className="w-3 h-3" /> ENTERPRISE
                </div>
                <h3 className="text-2xl font-heading text-white tracking-wide mb-2">Enterprise / Multi-Plant</h3>
                <div className="flex items-baseline gap-1 mb-2">
                  <span className="text-2xl font-heading text-white">Custom</span>
                  <span className="text-sm text-[oklch(0.5_0.006_250)]">· annual contract</span>
                </div>
                <p className="text-[13px] text-[oklch(0.55_0.008_250)] leading-relaxed mb-4">
                  Deploy verified competency across your workforce, with the security, reporting, and procurement
                  path a plant network needs. <span className="text-white">We reduce downtime by improving workforce competency.</span>
                </p>
                <a
                  href="/contact"
                  className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3 rounded bg-[oklch(0.55_0.12_155)] hover:bg-[oklch(0.6_0.13_155)] text-white text-[13px] font-semibold tracking-wider uppercase transition-colors"
                >
                  Contact Sales <ArrowRight className="w-4 h-4" />
                </a>
                <a href="/enterprise" className="block mt-2 text-[12px] text-[oklch(0.55_0.12_155)] hover:underline">See enterprise capabilities →</a>
              </div>
              <div className="lg:w-2/3 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2.5">
                {[
                  "Annual contracts & volume seat pricing",
                  "SSO / SAML (Okta, Azure AD, Active Directory)",
                  "Manager & multi-site dashboards",
                  "Competency analytics & workforce readiness tracking",
                  "Audit-ready reports & CSV / data exports",
                  "Skill-gap analysis across lines and shifts",
                  "Procurement-friendly invoicing & POs",
                  "Onboarding support & custom implementation",
                  "Dedicated success contact & priority SLA",
                  "Standards-alignment records (NFPA 70E, NEC, OSHA)",
                ].map((f, j) => (
                  <div key={j} className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-[oklch(0.55_0.12_155)] shrink-0 mt-0.5" />
                    <span className="text-[13px] text-[oklch(0.7_0.008_250)]">{f}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Trust indicators */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
            className="mt-12 text-center"
          >
            <div className="flex items-center justify-center gap-8 flex-wrap text-[12px] text-[oklch(0.45_0.006_250)]">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                <span>Cancel anytime</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4" />
                <span>Instant access</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                <span>Team billing available</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 border-t border-[oklch(0.18_0.004_250)]">
        <div className="container max-w-3xl">
          <h2 className="text-2xl font-heading text-white tracking-wide mb-8 text-center">
            QUESTIONS
          </h2>
          <div className="space-y-4">
            {[
              {
                q: "What happens after I subscribe?",
                a: "You get immediate access to all courses and scenarios. New content is added monthly based on real plant-floor situations.",
              },
              {
                q: "How does the Team plan work?",
                a: "Purchase seats for your team (5-50 technicians). You'll get an admin dashboard where you can invite members via email, track their progress, and see completion reports. Each member gets full Pro access.",
              },
              {
                q: "Can I add more seats later?",
                a: "Yes — you can adjust your seat count anytime from your Stripe billing portal. Changes are prorated.",
              },
              {
                q: "Is this real troubleshooting or just multiple choice?",
                a: "Real troubleshooting. Each scenario has branching decision trees, simulated meter readings, circuit prints, and consequence-based scoring. Wrong choices teach you why they're wrong.",
              },
              {
                q: "What if I want to cancel?",
                a: "Cancel anytime from your account. No contracts, no cancellation fees. You keep access through the end of your billing period.",
              },
              {
                q: "Do you have an enterprise or multi-plant plan?",
                a: "Yes. Enterprise adds SSO/SAML, multi-site manager dashboards, competency analytics, workforce-readiness tracking, audit-ready reports and data exports, procurement-friendly invoicing/POs, and custom implementation with onboarding support. Contact Sales for annual, volume-seat pricing.",
              },
            ].map((faq, i) => (
              <div key={i} className="p-4 bg-[oklch(0.09_0.003_250)] rounded border border-[oklch(0.18_0.004_250)]">
                <h4 className="text-[14px] font-semibold text-white mb-2">{faq.q}</h4>
                <p className="text-[13px] text-[oklch(0.55_0.008_250)] leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
