/**
 * Explore — full platform overview (B2B + learner paths).
 * Operator-first entry is at /; employer sales at /enterprise.
 */
import { motion } from "framer-motion";
import { Link } from "wouter";
import {
  ArrowRight, Users, Zap, Wrench, TrendingDown, Building2,
} from "lucide-react";
import SEO from "@/components/SEO";
import ConveyorHeroPreview from "@/components/home/ConveyorHeroPreview";
import {
  HOMEPAGE_HERO,
  HOMEPAGE_PROBLEM,
  HOMEPAGE_SOLUTION,
  HOMEPAGE_LEARNING_PATH,
  HOMEPAGE_SIMULATIONS,
  HOMEPAGE_EMPLOYER_CTA,
  HOMEPAGE_LEARNER_CTA,
  HOMEPAGE_DIFFERENTIATORS,
} from "@shared/homepageContent";

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.45 },
};

export default function ExploreHome() {
  return (
    <div className="overflow-x-hidden">
      <SEO
        title="Explore EASLearn — Platform Overview"
        description={HOMEPAGE_HERO.subheadline}
        path="/explore"
      />

      <section className="relative py-16 sm:py-20 lg:py-28 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[oklch(0.12_0.02_155/12%)] via-transparent to-[oklch(0.10_0.003_250)]" />
        <div className="container relative z-10">
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-14 items-center">
            <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <p className="text-xs font-mono text-[oklch(0.55_0.12_155)] tracking-widest uppercase mb-4">
                {HOMEPAGE_HERO.eyebrow}
              </p>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-[3.25rem] font-heading text-white leading-tight tracking-wide mb-5">
                {HOMEPAGE_HERO.headline}
              </h1>
              <p className="text-base sm:text-lg text-[oklch(0.68_0.008_250)] leading-relaxed mb-8 max-w-xl">
                {HOMEPAGE_HERO.subheadline}
              </p>
              <div className="flex flex-col sm:flex-row gap-3 mb-8">
                <Link
                  href="/labs?entry=home&mode=practice#conveyor-troubleshoot"
                  className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-7 py-3.5 min-h-11 text-base font-semibold btn-primary rounded-lg"
                >
                  <Zap className="w-4 h-4" />
                  Try the Simulator
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/enterprise"
                  className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-7 py-3.5 min-h-11 text-base font-medium btn-secondary rounded-lg"
                >
                  <Building2 className="w-4 h-4" />
                  For Employers
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
              <div className="grid grid-cols-2 gap-3 max-w-lg">
                {HOMEPAGE_DIFFERENTIATORS.map((d) => (
                  <div key={d.title} className="rounded-lg border border-[oklch(0.16_0.004_250)] bg-[oklch(0.08_0.003_250)] p-3">
                    <p className="text-xs font-medium text-white mb-0.5">{d.title}</p>
                    <p className="text-[11px] text-[oklch(0.50_0.008_250)] leading-relaxed">{d.detail}</p>
                  </div>
                ))}
              </div>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, delay: 0.1 }}>
              <ConveyorHeroPreview />
            </motion.div>
          </div>
        </div>
      </section>

      <section className="py-14 border-t border-[oklch(0.16_0.004_250)] bg-[oklch(0.07_0.003_250)]">
        <div className="container max-w-4xl">
          <motion.div {...fadeUp}>
            <h2 className="text-2xl sm:text-3xl font-heading text-white tracking-wide mb-6">{HOMEPAGE_PROBLEM.headline}</h2>
            <ul className="space-y-3">
              {HOMEPAGE_PROBLEM.points.map((p) => (
                <li key={p} className="flex items-start gap-3 text-[oklch(0.62_0.008_250)]">
                  <TrendingDown className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <span className="text-sm sm:text-base leading-relaxed">{p}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        </div>
      </section>

      <section className="py-14 border-t border-[oklch(0.16_0.004_250)]">
        <div className="container max-w-5xl">
          <motion.div {...fadeUp} className="mb-8">
            <h2 className="text-2xl sm:text-3xl font-heading text-white tracking-wide mb-3">{HOMEPAGE_SOLUTION.headline}</h2>
            <p className="text-[oklch(0.58_0.008_250)] max-w-2xl">{HOMEPAGE_SOLUTION.intro}</p>
          </motion.div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {HOMEPAGE_SOLUTION.steps.map((step, i) => (
              <motion.div key={step.title} {...fadeUp} transition={{ delay: i * 0.04 }} className="card-panel p-5">
                <span className="text-[10px] font-mono text-[oklch(0.55_0.12_155)]">{String(i + 1).padStart(2, "0")}</span>
                <h3 className="text-sm font-semibold text-white mt-1 mb-1">{step.title}</h3>
                <p className="text-xs text-[oklch(0.55_0.008_250)] leading-relaxed">{step.detail}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-14 border-t border-[oklch(0.16_0.004_250)] bg-[oklch(0.08_0.003_250)]">
        <div className="container max-w-3xl">
          <motion.div {...fadeUp} className="mb-8 text-center">
            <h2 className="text-2xl sm:text-3xl font-heading text-white tracking-wide mb-2">Operator-to-Maintenance Pathway</h2>
            <p className="text-sm text-[oklch(0.55_0.008_250)]">Eleven levels from machine operator to verified maintenance technician.</p>
          </motion.div>
          <div className="space-y-2">
            {HOMEPAGE_LEARNING_PATH.map((level) => (
              <motion.div key={level.level} {...fadeUp}>
                {"href" in level && level.href ? (
                  <Link
                    href={level.href}
                    className="flex items-center gap-4 rounded-lg border border-[oklch(0.15_0.004_250)] bg-[oklch(0.09_0.003_250)] px-4 py-3 hover:border-[oklch(0.55_0.12_155/35%)] transition-colors group"
                  >
                    <span className="w-8 h-8 rounded-full bg-[oklch(0.55_0.12_155/10%)] border border-[oklch(0.55_0.12_155/25%)] flex items-center justify-center text-xs font-mono text-[oklch(0.55_0.12_155)] shrink-0">
                      {level.level}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white group-hover:text-[oklch(0.55_0.12_155)] transition-colors">{level.title}</p>
                      <p className="text-xs text-[oklch(0.48_0.008_250)] truncate">{level.topics}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-[oklch(0.35_0.006_250)] group-hover:text-[oklch(0.55_0.12_155)] shrink-0" />
                  </Link>
                ) : (
                  <div className="flex items-center gap-4 rounded-lg border border-[oklch(0.12_0.004_250)] bg-[oklch(0.07_0.003_250)] px-4 py-3 opacity-80">
                    <span className="w-8 h-8 rounded-full border border-[oklch(0.18_0.004_250)] flex items-center justify-center text-xs font-mono text-[oklch(0.45_0.006_250)] shrink-0">
                      {level.level}
                    </span>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-[oklch(0.65_0.008_250)]">{level.title}</p>
                      <p className="text-xs text-[oklch(0.42_0.006_250)]">{level.topics}</p>
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
          <div className="mt-6 text-center">
            <Link href="/become-a-tech" className="text-sm text-[oklch(0.55_0.12_155)] hover:underline inline-flex items-center gap-1">
              View full pathway details <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </section>

      <section className="py-14 border-t border-[oklch(0.16_0.004_250)]">
        <div className="container max-w-5xl">
          <motion.div {...fadeUp} className="mb-8">
            <div className="inline-flex items-center gap-2 text-[oklch(0.55_0.12_155)] text-xs font-mono mb-3">
              <Zap className="w-3.5 h-3.5" /> TROUBLESHOOTING CONFIDENCE
            </div>
            <h2 className="text-2xl sm:text-3xl font-heading text-white tracking-wide mb-2">Practice on Real Plant-Floor Faults</h2>
          </motion.div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {HOMEPAGE_SIMULATIONS.slice(0, 6).map((sim) => (
              <motion.div key={sim.title} {...fadeUp}>
                <Link href={sim.route} className="block card-panel p-4 h-full group hover:border-[oklch(0.55_0.12_155/30%)] transition-colors">
                  <h3 className="text-sm font-medium text-white group-hover:text-[oklch(0.55_0.12_155)]">{sim.title}</h3>
                  <p className="text-xs text-[oklch(0.50_0.008_250)] mt-1">{sim.description}</p>
                </Link>
              </motion.div>
            ))}
          </div>
          <div className="mt-6 text-center">
            <Link href="/labs?mode=practice#conveyor-troubleshoot" className="inline-flex items-center gap-2 px-6 py-3 btn-primary rounded-lg text-sm font-medium">
              Open Simulation Labs <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      <section className="py-14 border-t border-[oklch(0.16_0.004_250)]">
        <div className="container max-w-3xl">
          <motion.div {...fadeUp} className="card-panel p-8 sm:p-10 text-center border-[oklch(0.55_0.12_155/25%)]">
            <Users className="w-8 h-8 text-[oklch(0.55_0.12_155)] mx-auto mb-4" />
            <h2 className="text-2xl font-heading text-white mb-3">{HOMEPAGE_EMPLOYER_CTA.headline}</h2>
            <p className="text-sm text-[oklch(0.55_0.008_250)] mb-6">{HOMEPAGE_EMPLOYER_CTA.subheadline}</p>
            <Link href="/enterprise" className="inline-flex items-center gap-2 px-8 py-3.5 btn-primary rounded-lg text-sm font-semibold">
              {HOMEPAGE_EMPLOYER_CTA.cta.label}
              <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>
        </div>
      </section>

      <section className="py-14 border-t border-[oklch(0.16_0.004_250)] bg-[oklch(0.08_0.003_250)]">
        <div className="container max-w-3xl text-center">
          <motion.div {...fadeUp}>
            <Wrench className="w-8 h-8 text-[oklch(0.55_0.12_155)] mx-auto mb-4" />
            <h2 className="text-2xl font-heading text-white mb-3">{HOMEPAGE_LEARNER_CTA.headline}</h2>
            <p className="text-sm text-[oklch(0.55_0.008_250)] mb-6">{HOMEPAGE_LEARNER_CTA.subheadline}</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href={HOMEPAGE_LEARNER_CTA.cta.href} className="inline-flex items-center gap-2 px-7 py-3.5 btn-primary rounded-lg text-sm font-semibold">
                {HOMEPAGE_LEARNER_CTA.cta.label}
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href={HOMEPAGE_LEARNER_CTA.alt.href} className="inline-flex items-center gap-2 px-7 py-3.5 btn-secondary rounded-lg text-sm font-medium">
                {HOMEPAGE_LEARNER_CTA.alt.label}
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
