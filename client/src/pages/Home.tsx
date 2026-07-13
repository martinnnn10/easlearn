/**
 * EAS Home Page — technician-first, mobile-friendly
 */
import { motion } from "framer-motion";
import { Link } from "wouter";
import { ArrowRight, BookOpen, Cpu, Gauge, Zap } from "lucide-react";
import SEO from "@/components/SEO";
import ConveyorHeroPreview from "@/components/home/ConveyorHeroPreview";
import { trpc } from "@/lib/trpc";
import { getHubById } from "@shared/hubRegistry";

const CONVEYOR_LAB_ENTRY = "/labs?entry=home&mode=practice#conveyor-troubleshoot";

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.5 },
};

const HOME_HUB_IDS = ["plc", "vfd", "motor_controls"] as const;

const HOME_HUB_LABELS: Record<(typeof HOME_HUB_IDS)[number], string> = {
  plc: "PLC / Controls",
  vfd: "VFD / Drives",
  motor_controls: "Electrical",
};

export default function Home() {
  const { data: modules } = trpc.courses.listModules.useQuery();
  const featuredModules = (modules ?? []).slice(0, 4);

  const homeHubs = HOME_HUB_IDS.map((id) => getHubById(id)).filter(Boolean);

  return (
    <div className="overflow-x-hidden">
      <SEO
        title="EASLearn — Industrial Training for Maintenance Technicians"
        description="PLC troubleshooting, VFD diagnostics, and electrical fundamentals — built by technicians, for technicians."
        path="/"
      />

      {/* 1. Hero */}
      <section className="relative py-16 sm:py-20 lg:py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[oklch(0.12_0.02_155/10%)] via-transparent to-[oklch(0.10_0.003_250)]" />
        <div className="container relative z-10">
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-heading text-white leading-tight tracking-wide mb-4">
                Industrial Training Built for the Plant Floor
              </h1>
              <p className="text-base sm:text-lg text-[oklch(0.68_0.008_250)] leading-relaxed mb-8 max-w-xl">
                PLC troubleshooting, VFD diagnostics, and electrical fundamentals — built by technicians, for technicians.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  href="/courses"
                  className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3.5 min-h-11 text-base font-medium btn-primary rounded-lg"
                >
                  Start Learning
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href={CONVEYOR_LAB_ENTRY}
                  className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3.5 min-h-11 text-base font-medium btn-secondary rounded-lg"
                >
                  Try a Simulator
                  <Zap className="w-4 h-4" />
                </Link>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.1 }}
            >
              <ConveyorHeroPreview />
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.25, duration: 0.5 }}
            className="mt-10 pt-8 border-t border-[oklch(0.16_0.004_250)] max-w-3xl"
          >
            <p className="text-sm text-[oklch(0.55_0.008_250)] mb-2">
              Built by maintenance leaders, controls engineers, and manufacturing professionals.
            </p>
            <p className="text-sm font-mono text-[oklch(0.62_0.10_155)] tracking-wide">
              Learn → Practice → Troubleshoot → Prove Root Cause
            </p>
          </motion.div>
        </div>
      </section>

      {/* 2. Skill tracks (hubs) */}
      <section className="py-14 border-t border-[oklch(0.16_0.004_250)]">
        <div className="container">
          <motion.div {...fadeIn} className="mb-8">
            <h2 className="text-2xl sm:text-3xl font-heading text-white tracking-wide mb-2">
              Skill Tracks
            </h2>
            <p className="text-base text-[oklch(0.58_0.008_250)]">
              Enter a hub to follow lessons, practice labs, and benchmark simulators.
            </p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {homeHubs.map((hub, i) => {
              const Icon = hub!.id === "plc" ? Cpu : hub!.id === "vfd" ? Gauge : BookOpen;
              const displayName = HOME_HUB_LABELS[hub!.id as (typeof HOME_HUB_IDS)[number]] ?? hub!.title;
              return (
                <motion.div key={hub!.id} {...fadeIn} transition={{ delay: i * 0.08 }}>
                  <Link
                    href={hub!.route}
                    className="block card-panel p-6 h-full group hover:border-[oklch(0.55_0.12_155/30%)] transition-colors"
                  >
                    <Icon className="w-7 h-7 text-[oklch(0.55_0.12_155)] mb-4" />
                    <h3 className="text-lg font-heading text-white mb-2">{displayName}</h3>
                    <p className="text-base text-[oklch(0.58_0.008_250)] leading-relaxed mb-4">
                      {hub!.description}
                    </p>
                    <span className="text-sm text-[oklch(0.55_0.12_155)] font-medium inline-flex items-center gap-1 group-hover:gap-2 transition-all">
                      Enter Hub <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 3. Course modules */}
      <section className="py-14 bg-[oklch(0.08_0.003_250)] border-t border-[oklch(0.16_0.004_250)]">
        <div className="container">
          <motion.div {...fadeIn} className="mb-8 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <h2 className="text-2xl sm:text-3xl font-heading text-white tracking-wide mb-2">
                Course Modules
              </h2>
              <p className="text-base text-[oklch(0.58_0.008_250)]">
                Structured lessons with quizzes and hands-on practice.
              </p>
            </div>
            <Link href="/courses" className="text-sm text-[oklch(0.55_0.12_155)] hover:underline shrink-0">
              View All Courses
            </Link>
          </motion.div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {featuredModules.map((mod, i) => (
              <motion.div key={mod.slug} {...fadeIn} transition={{ delay: i * 0.06 }}>
                <Link
                  href={`/courses/${mod.slug}`}
                  className="block card-panel p-5 h-full group hover:border-[oklch(0.55_0.12_155/30%)] transition-colors"
                >
                  <h3 className="text-lg font-heading text-white mb-2 group-hover:text-[oklch(0.55_0.12_155)] transition-colors">
                    {mod.title}
                  </h3>
                  <p className="text-sm text-[oklch(0.58_0.008_250)] leading-relaxed line-clamp-2 mb-3">
                    {mod.description}
                  </p>
                  <span className="text-xs text-[oklch(0.50_0.008_250)]">
                    {mod.actualLessonCount ?? mod.totalLessons ?? 0} lessons
                    {mod.estimatedHours ? ` · ~${mod.estimatedHours}h` : ""}
                  </span>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. Simulator preview */}
      <section className="py-14 border-t border-[oklch(0.16_0.004_250)]">
        <div className="container">
          <motion.div {...fadeIn} className="card-panel p-8 sm:p-10 flex flex-col lg:flex-row lg:items-center gap-6">
            <div className="flex-1">
              <h2 className="text-2xl font-heading text-white mb-3">
                Practice on Real Equipment Logic
              </h2>
              <p className="text-base text-[oklch(0.60_0.008_250)] leading-relaxed mb-0 max-w-xl">
                Conveyor PLC and PowerFlex VFD benchmark labs — diagnose faults with live I/O, ladder logic, and drive status.
              </p>
            </div>
            <Link
              href={CONVEYOR_LAB_ENTRY}
              className="inline-flex items-center justify-center gap-2 w-full lg:w-auto px-8 py-3.5 min-h-11 text-base font-medium btn-primary rounded-lg shrink-0"
            >
              Open Simulators
              <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* 5. Final CTA */}
      <section className="py-14 border-t border-[oklch(0.16_0.004_250)]">
        <div className="container">
          <motion.div {...fadeIn} className="text-center max-w-xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-heading text-white mb-4">Ready to level up?</h2>
            <p className="text-base text-[oklch(0.60_0.008_250)] mb-6">
              Full access to every track, simulator, and progress certificate.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/pricing"
                className="inline-flex items-center justify-center gap-2 px-8 py-3.5 min-h-11 text-base font-medium btn-primary rounded-lg"
              >
                View Pricing
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/courses"
                className="inline-flex items-center justify-center gap-2 px-8 py-3.5 min-h-11 text-base font-medium btn-secondary rounded-lg"
              >
                Browse Courses
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
