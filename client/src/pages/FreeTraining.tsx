/**
 * Free Training Hub Page
 * 
 * Centralized entry point for all free training experiences.
 * Phase 1: Links to external sites with EASLearn branding.
 * Future: Native routes with full progress tracking.
 */
import { motion } from "framer-motion";
import SEO from "@/components/SEO";
import {
  Cpu,
  Wrench,
  Search,
  Zap,
  ArrowRight,
  ExternalLink,
  BookOpen,
  Target,
  Clock,
  Users,
} from "lucide-react";

interface TrainingExperience {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  duration: string;
  level: string;
  icon: React.ReactNode;
  color: string;
  highlights: string[];
  url: string;
  badge: string;
}

const trainingExperiences: TrainingExperience[] = [
  {
    id: "plc-tutorial",
    title: "PLC Fundamentals Tutorial",
    subtitle: "Ladder Logic & Troubleshooting",
    description:
      "Learn PLC basics from scratch — inputs, outputs, ladder logic, and real fault scenarios. Includes an interactive ladder logic simulator with live scan cycle visualization.",
    duration: "45 min",
    level: "Beginner → Intermediate",
    icon: <Cpu className="w-5 h-5" />,
    color: "155",
    highlights: [
      "5 progressive lessons (beginner & experienced tracks)",
      "Interactive ladder logic simulator with live I/O",
      "4 real-world fault scenarios to diagnose",
      "Motor start/stop circuit with seal-in logic",
    ],
    url: "https://eas-plc-tutorial.netlify.app",
    badge: "Interactive Simulator",
  },
  {
    id: "maintenance-basics",
    title: "Maintenance Fundamentals",
    subtitle: "Electrical, Motors, PLC & Troubleshooting",
    description:
      "Structured training covering core maintenance topics — Ohm's Law, motor types, PLC I/O, and systematic troubleshooting methods. Each module includes a knowledge quiz.",
    duration: "2–3 hrs",
    level: "Beginner",
    icon: <Wrench className="w-5 h-5" />,
    color: "200",
    highlights: [
      "4 training modules with 20 lessons total",
      "Electrical Fundamentals (Ohm's Law, circuits, safety)",
      "Motor Controls (types, starters, VFDs)",
      "End-of-module quizzes with instant feedback",
    ],
    url: "https://eas-maintenance-training.netlify.app",
    badge: "Self-Paced Course",
  },
  {
    id: "root-cause",
    title: "Root Cause Analysis Training",
    subtitle: "5-Why, Fishbone & Work Order Writing",
    description:
      "Master the RCA methodology used in industrial maintenance — from identifying failure modes to writing clear, actionable work orders that prevent repeat failures.",
    duration: "30 min",
    level: "All Levels",
    icon: <Search className="w-5 h-5" />,
    color: "35",
    highlights: [
      "5-Why analysis with real maintenance examples",
      "Fishbone (Ishikawa) diagram construction",
      "Effective work order writing techniques",
      "Knowledge assessment quiz",
    ],
    url: "https://root-cause-training.netlify.app",
    badge: "Methodology",
  },
  {
    id: "troubleshooting-simulator",
    title: "Troubleshooting Simulator",
    subtitle: "Hands-On Fault Diagnosis Practice",
    description:
      "Practice diagnosing real electrical faults using a virtual multimeter on interactive circuit panels. Progress from basic open circuits to complex VFD and safety relay failures.",
    duration: "1–2 hrs",
    level: "Beginner → Advanced",
    icon: <Zap className="w-5 h-5" />,
    color: "0",
    highlights: [
      "6 progressive fault scenarios",
      "Virtual multimeter with realistic readings",
      "Interactive circuit panel diagrams",
      "Difficulty progression: Beginner → Advanced",
    ],
    url: "https://eastraining.com",
    badge: "Hands-On Practice",
  },
];

const fadeIn = {
  initial: { opacity: 0, y: 15 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.4 },
};

export default function FreeTraining() {
  return (
    <>
      <SEO
        title="Free Training for Maintenance Technicians"
        description="Free industrial maintenance training — PLC tutorials, troubleshooting simulators, root cause analysis, and electrical fundamentals. No subscription required."
        path="/free-training"
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
                <BookOpen className="w-3.5 h-3.5" />
                100% Free — No Account Required
              </div>
              <h1 className="text-4xl sm:text-5xl font-heading text-white tracking-wide mb-5">
                Free Training for Maintenance Techs
              </h1>
              <p className="text-lg text-[oklch(0.65_0.008_250)] leading-relaxed max-w-2xl mx-auto">
                Start building your skills today. Interactive simulators, structured courses, and
                real-world troubleshooting practice — all free, no strings attached.
              </p>
            </motion.div>
          </div>

          <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-[oklch(0.20_0.004_250)] to-transparent" />
        </section>

        {/* Stats Bar */}
        <section className="py-6 border-b border-[oklch(0.16_0.004_250)]">
          <div className="container">
            <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-center">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[oklch(0.55_0.12_155)]" />
                <span className="text-sm text-[oklch(0.60_0.008_250)]">
                  <strong className="text-white">4+ hours</strong> of content
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-[oklch(0.55_0.12_155)]" />
                <span className="text-sm text-[oklch(0.60_0.008_250)]">
                  <strong className="text-white">10+</strong> fault scenarios
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-[oklch(0.55_0.12_155)]" />
                <span className="text-sm text-[oklch(0.60_0.008_250)]">
                  <strong className="text-white">No login</strong> required
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Training Cards */}
        <section className="py-12 sm:py-16">
          <div className="container">
            <div className="max-w-5xl mx-auto space-y-6">
              {trainingExperiences.map((experience, i) => (
                <motion.div
                  key={experience.id}
                  {...fadeIn}
                  transition={{ duration: 0.4, delay: i * 0.1 }}
                >
                  <a
                    href={experience.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block card-panel overflow-hidden hover:border-[oklch(0.55_0.12_155/25%)] transition-all duration-200 group"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-[1fr_240px]">
                      {/* Content */}
                      <div className="p-6 sm:p-8">
                        <div className="flex items-start gap-3 mb-4">
                          <div
                            className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                            style={{
                              background: `oklch(0.55 0.12 ${experience.color} / 10%)`,
                              border: `1px solid oklch(0.55 0.12 ${experience.color} / 20%)`,
                              color: `oklch(0.55 0.12 ${experience.color})`,
                            }}
                          >
                            {experience.icon}
                          </div>
                          <div>
                            <h2 className="text-lg font-heading text-white tracking-wide group-hover:text-[oklch(0.75_0.10_155)] transition-colors">
                              {experience.title}
                            </h2>
                            <p className="text-xs text-[oklch(0.45_0.006_250)]">
                              {experience.subtitle}
                            </p>
                          </div>
                        </div>

                        <p className="text-sm text-[oklch(0.58_0.008_250)] leading-relaxed mb-4">
                          {experience.description}
                        </p>

                        <div className="space-y-2">
                          <p className="text-xs font-medium text-[oklch(0.65_0.008_250)] uppercase tracking-wider">
                            What you'll learn:
                          </p>
                          <ul className="space-y-1.5">
                            {experience.highlights.map((h, j) => (
                              <li
                                key={j}
                                className="flex items-start gap-2 text-xs text-[oklch(0.55_0.008_250)]"
                              >
                                <ArrowRight className="w-3 h-3 mt-0.5 text-[oklch(0.55_0.12_155)] shrink-0" />
                                {h}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      {/* Right Panel */}
                      <div className="flex flex-col items-center justify-center gap-4 p-6 sm:p-8 border-t md:border-t-0 md:border-l border-[oklch(0.16_0.004_250)] bg-[oklch(0.08_0.003_250/50%)]">
                        <div className="text-center">
                          <div
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium mb-3"
                            style={{
                              background: `oklch(0.55 0.12 ${experience.color} / 10%)`,
                              border: `1px solid oklch(0.55 0.12 ${experience.color} / 20%)`,
                              color: `oklch(0.65 0.10 ${experience.color})`,
                            }}
                          >
                            {experience.badge}
                          </div>
                          <div className="space-y-1">
                            <p className="text-xs text-[oklch(0.50_0.006_250)]">
                              Duration: <span className="text-white">{experience.duration}</span>
                            </p>
                            <p className="text-xs text-[oklch(0.50_0.006_250)]">
                              Level: <span className="text-white">{experience.level}</span>
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[oklch(0.55_0.12_155/10%)] border border-[oklch(0.55_0.12_155/20%)] text-[oklch(0.65_0.10_155)] text-sm font-medium group-hover:bg-[oklch(0.55_0.12_155/15%)] group-hover:border-[oklch(0.55_0.12_155/30%)] transition-all">
                          Start Training
                          <ExternalLink className="w-3.5 h-3.5" />
                        </div>
                      </div>
                    </div>
                  </a>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 sm:py-20 border-t border-[oklch(0.16_0.004_250)]">
          <div className="container">
            <motion.div
              {...fadeIn}
              className="max-w-2xl mx-auto text-center"
            >
              <h2 className="text-2xl sm:text-3xl font-heading text-white tracking-wide mb-4">
                Ready for the Full Training Platform?
              </h2>
              <p className="text-[oklch(0.58_0.008_250)] leading-relaxed mb-6">
                EASLearn offers 144 structured lessons, advanced simulators, team management,
                certifications, and progress tracking — built for maintenance departments
                that need measurable results.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <a
                  href="/courses"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-lg btn-primary text-sm font-medium"
                >
                  Explore Full Courses
                  <ArrowRight className="w-4 h-4" />
                </a>
                <a
                  href="/pricing"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-lg border border-[oklch(0.20_0.004_250)] text-sm font-medium text-[oklch(0.65_0.008_250)] hover:border-[oklch(0.30_0.004_250)] hover:text-white transition-colors"
                >
                  View Pricing
                </a>
              </div>
            </motion.div>
          </div>
        </section>
      </div>
    </>
  );
}
