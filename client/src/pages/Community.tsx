/**
 * Community Page — Placeholder for future discussion forum and technician networking.
 * Shows what's coming: forums, Q&A, knowledge sharing, mentorship.
 */
import { motion } from "framer-motion";
import { Link } from "wouter";
import {
  MessageSquare, Users, Award, BookOpen, Wrench,
  ArrowRight, Clock, Lightbulb, HelpCircle, Share2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import SEO from "@/components/SEO";

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
};

const communityFeatures = [
  {
    icon: MessageSquare,
    title: "Discussion Forums",
    description: "Topic-based forums for troubleshooting, best practices, and equipment-specific discussions. Get answers from experienced technicians.",
    status: "In Development",
  },
  {
    icon: HelpCircle,
    title: "Q&A Board",
    description: "Post questions with photos and diagrams. Get peer-reviewed answers from the community and verified experts.",
    status: "In Development",
  },
  {
    icon: Share2,
    title: "Knowledge Sharing",
    description: "Share maintenance tips, wiring diagrams, and troubleshooting procedures. Build a searchable knowledge base together.",
    status: "In Development",
  },
  {
    icon: Lightbulb,
    title: "Mentorship Program",
    description: "Connect with experienced technicians for guidance. Structured mentorship paths for apprentices and journeymen.",
    status: "Planned",
  },
  {
    icon: Award,
    title: "Technician Profiles",
    description: "Showcase your certifications, completed courses, and specializations. Build your professional reputation.",
    status: "In Development",
  },
  {
    icon: Wrench,
    title: "Equipment Library",
    description: "Community-maintained equipment guides, common fault databases, and manufacturer-specific troubleshooting trees.",
    status: "Planned",
  },
];

const sampleTopics = [
  { title: "PowerFlex 525 Fault Code F064 — Intermittent", replies: 23, category: "VFD Troubleshooting" },
  { title: "Best practices for motor alignment on 200HP pumps", replies: 15, category: "Alignment" },
  { title: "NEC 2023 changes affecting industrial panel wiring", replies: 31, category: "Code Compliance" },
  { title: "PLC-5 to ControlLogix migration tips", replies: 42, category: "PLC Programming" },
  { title: "Preventive maintenance schedule for hydraulic presses", replies: 8, category: "Fluid Power" },
];

export default function Community() {
  return (
    <div>
      <SEO
        title="Community"
        description="Connect with fellow electrical and maintenance technicians. Forums, Q&A, knowledge sharing, and mentorship — launching soon."
        path="/community"
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
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/8 border border-amber-500/20 text-xs font-mono text-amber-400 mb-6">
              <Clock className="w-3.5 h-3.5" />
              In Development
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-heading text-white tracking-wide mb-5 leading-tight">
              Technician Community
            </h1>
            <p className="text-lg text-[oklch(0.60_0.008_250)] max-w-2xl mx-auto mb-8 leading-relaxed">
              A place for maintenance professionals to connect, share knowledge, and solve problems together. 
              Built by technicians, for technicians.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/courses" className="inline-flex items-center gap-2 px-8 py-3.5 btn-primary text-sm font-semibold rounded-lg shadow-lg shadow-[oklch(0.55_0.12_155/15%)]">
                Browse Courses While You Wait
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-16 sm:py-20">
        <div className="container max-w-5xl">
          <motion.div {...fadeUp} className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-heading text-white tracking-wide mb-3">
              What's Coming
            </h2>
            <p className="text-[oklch(0.55_0.008_250)] max-w-xl mx-auto">
              We're building a community platform designed specifically for industrial maintenance professionals.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {communityFeatures.map((feature, i) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.title}
                  {...fadeUp}
                  transition={{ delay: i * 0.06 }}
                  className="card-panel p-5 rounded-xl"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 rounded-lg bg-[oklch(0.55_0.12_155/8%)] border border-[oklch(0.55_0.12_155/18%)] flex items-center justify-center">
                      <Icon className="w-5 h-5 text-[oklch(0.55_0.12_155)]" />
                    </div>
                    <span className="text-[10px] font-mono text-amber-400">
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

      {/* Sample Topics Preview */}
      <section className="py-16 border-t border-[oklch(0.14_0.004_250)]">
        <div className="container max-w-3xl">
          <motion.div {...fadeUp} className="text-center mb-8">
            <h2 className="text-xl sm:text-2xl font-heading text-white tracking-wide mb-2">
              Preview: Discussion Topics
            </h2>
            <p className="text-sm text-[oklch(0.50_0.008_250)]">
              The kind of conversations you'll find in the community.
            </p>
          </motion.div>

          <div className="space-y-2">
            {sampleTopics.map((topic, i) => (
              <motion.div
                key={topic.title}
                {...fadeUp}
                transition={{ delay: i * 0.05 }}
                className="card-panel p-4 rounded-lg flex items-center justify-between gap-4 opacity-70"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <MessageSquare className="w-4 h-4 text-[oklch(0.40_0.006_250)] shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm text-[oklch(0.65_0.008_250)] truncate">{topic.title}</p>
                    <span className="text-[10px] font-mono text-[oklch(0.40_0.006_250)]">{topic.category}</span>
                  </div>
                </div>
                <div className="text-[10px] font-mono text-[oklch(0.40_0.006_250)] whitespace-nowrap">
                  {topic.replies} replies
                </div>
              </motion.div>
            ))}
          </div>

          <motion.p {...fadeUp} className="text-center text-xs text-[oklch(0.40_0.006_250)] mt-6">
            These are example topics. Real discussions will be available when the community launches.
          </motion.p>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 sm:py-20 border-t border-[oklch(0.14_0.004_250)]">
        <div className="container max-w-3xl text-center">
          <motion.div {...fadeUp}>
            <Users className="w-10 h-10 text-[oklch(0.55_0.12_155)] mx-auto mb-4" />
            <h2 className="text-2xl sm:text-3xl font-heading text-white tracking-wide mb-4">
              Want Early Access?
            </h2>
            <p className="text-[oklch(0.55_0.008_250)] mb-8 max-w-lg mx-auto">
              Pro and Team subscribers will get early access to the community when it launches. 
              Start learning today and be among the first to join.
            </p>
            <Link href="/pricing" className="inline-flex items-center gap-2 px-8 py-3.5 btn-primary text-sm font-semibold rounded-lg shadow-lg shadow-[oklch(0.55_0.12_155/15%)]">
              View Plans
              <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
