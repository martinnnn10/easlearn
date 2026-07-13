/**
 * About Page - Clean professional layout
 * Real company story, real credibility
 */
import { motion } from "framer-motion";
import { Link } from "wouter";
import { ArrowRight } from "lucide-react";
import SEO from "@/components/SEO";

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.5 }
};

export default function About() {
  return (
    <div>
      <SEO
        title="About EAS"
        description="Electrical Automation Services delivers real-world industrial training for maintenance technicians — built from plant-floor troubleshooting experience."
        path="/about"
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
              About EAS
            </h1>
            <p className="text-lg text-[oklch(0.65_0.008_250)] leading-relaxed">
              Electrical Automation Services was founded on a simple idea: the best way to train maintenance technicians is with real scenarios from real plants — not textbook exercises that never match what you see on the floor.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Story */}
      <section className="py-20">
        <div className="container">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">
            <motion.div {...fadeIn} className="lg:col-span-3 space-y-6">
              <h2 className="text-3xl font-heading text-white tracking-wide mb-6">
                Our Story
              </h2>
              <p className="text-[oklch(0.65_0.008_250)] leading-relaxed">
                EAS was built by maintenance leaders with years of hands-on experience in manufacturing plants. After watching new technicians struggle with the gap between classroom training and actual plant-floor troubleshooting, the platform was designed around what technicians need on the floor.
              </p>
              <p className="text-[oklch(0.65_0.008_250)] leading-relaxed">
                The troubleshooting simulator isn't based on theory — it's based on real faults that happen in real plants. The training courses teach methodology, not memorization. Every module is built around the skills that actually matter on the plant floor.
              </p>
              <p className="text-[oklch(0.65_0.008_250)] leading-relaxed">
                We use AI-assisted tools where they make sense — for scenario generation and skill assessment — but the foundation is always real industrial experience.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="lg:col-span-2"
            >
              <img
                src="https://d2xsxph8kpxj0f.cloudfront.net/310519663631243604/dBvv3KQQ9K9tWbpcptY97y/eas-plc-panel-YCEb66TPr5tCScojQHdgkj.webp"
                alt="PLC Control Panel"
                className="w-full rounded"
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* What We Believe */}
      <section className="py-20 bg-[oklch(0.08_0.003_250)] border-y border-[oklch(0.18_0.004_250)]">
        <div className="container">
          <motion.div {...fadeIn} className="mb-12">
            <h2 className="text-3xl font-heading text-white tracking-wide">
              What We Believe
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl">
            {[
              {
                title: "Experience over theory",
                desc: "The best training comes from people who've actually done the work. Every scenario, every program, every assessment is grounded in real plant-floor experience.",
              },
              {
                title: "Methodology over memorization",
                desc: "A good troubleshooter doesn't memorize every fault code — they know how to think through problems systematically. That's what we teach.",
              },
              {
                title: "Skills over resumes",
                desc: "Our assessment system verifies actual technical ability. A technician who can troubleshoot a VFD fault in our simulator has proven real-world competence.",
              },
              {
                title: "Honesty over hype",
                desc: "We don't inflate numbers or make promises we can't keep. If the training doesn't improve performance, we adjust. Real results, not marketing fluff.",
              },
            ].map((item, i) => (
              <motion.div
                key={i}
                {...fadeIn}
                transition={{ duration: 0.4, delay: i * 0.1 }}
              >
                <h3 className="text-base font-semibold text-white mb-2">{item.title}</h3>
                <p className="text-sm text-[oklch(0.58_0.008_250)] leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Technology */}
      <section className="py-20">
        <div className="container">
          <div className="max-w-3xl">
            <motion.div {...fadeIn}>
              <h2 className="text-3xl font-heading text-white tracking-wide mb-6">
                Technology
              </h2>
              <p className="text-[oklch(0.65_0.008_250)] leading-relaxed mb-6">
                We use AI-assisted tools to enhance what we do — not replace the human expertise behind it. Our technology helps with:
              </p>
              <ul className="space-y-3 mb-6">
                {[
                  "Generating realistic fault scenarios based on real equipment data",
                  "Assessing technician skill levels with real-world scenarios",
                  "Tracking technician development and identifying skill gaps",
                  "Providing adaptive difficulty in training scenarios",
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-[oklch(0.65_0.005_250)]">
                    <div className="w-1.5 h-1.5 rounded-full bg-[oklch(0.55_0.12_155)] mt-2 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <p className="text-sm text-[oklch(0.50_0.008_250)] italic">
                The AI is the tool. The industrial experience is the foundation.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-[oklch(0.08_0.003_250)] border-t border-[oklch(0.18_0.004_250)]">
        <div className="container text-center">
          <motion.div {...fadeIn}>
            <h2 className="text-3xl font-heading text-white tracking-wide mb-4">
              Let's Talk
            </h2>
            <p className="text-[oklch(0.60_0.008_250)] max-w-xl mx-auto mb-8">
              Whether you need training for your team or just want to learn more about what we offer — reach out.
            </p>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 px-6 py-3 btn-primary text-sm font-medium rounded"
            >
              Contact Us
              <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
