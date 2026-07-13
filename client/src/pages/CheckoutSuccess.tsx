/**
 * EAS Training — Checkout Success Page
 * Shown after successful Stripe checkout. Provides onboarding guidance.
 */
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "wouter";
import {
  CheckCircle, ArrowRight, BookOpen, Zap, Award, Rocket
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/_core/hooks/useAuth";
import SEO from "@/components/SEO";

export default function CheckoutSuccess() {
  const { user } = useAuth();
  const [showConfetti, setShowConfetti] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShowConfetti(false), 4000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-16">
      <SEO
        title="Welcome to EAS Pro"
        description="Your subscription is active. Start your training journey."
        path="/checkout/success"
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="max-w-lg w-full text-center"
      >
        {/* Success Icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
          className="relative mx-auto mb-8"
        >
          <div className="w-20 h-20 rounded-full bg-[oklch(0.55_0.12_155/15%)] border-2 border-[oklch(0.55_0.12_155/40%)] flex items-center justify-center mx-auto">
            <CheckCircle className="w-10 h-10 text-[oklch(0.55_0.12_155)]" />
          </div>
          {showConfetti && (
            <motion.div
              initial={{ opacity: 1 }}
              animate={{ opacity: 0 }}
              transition={{ duration: 3, delay: 1 }}
              className="absolute inset-0 pointer-events-none"
            >
              {[...Array(8)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 1, x: 0, y: 0 }}
                  animate={{
                    opacity: 0,
                    x: (Math.random() - 0.5) * 120,
                    y: (Math.random() - 0.5) * 120,
                  }}
                  transition={{ duration: 1.5, delay: 0.3 + i * 0.05 }}
                  className="absolute top-1/2 left-1/2 w-2 h-2 rounded-full"
                  style={{
                    backgroundColor: ["#22c55e", "#3b82f6", "#f59e0b", "#8b5cf6", "#ec4899"][i % 5],
                  }}
                />
              ))}
            </motion.div>
          )}
        </motion.div>

        {/* Heading */}
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-2xl sm:text-3xl font-heading text-white mb-3"
        >
          You're All Set{user?.name ? `, ${user.name.split(' ')[0]}` : ''}!
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="text-[oklch(0.55_0.008_250)] mb-10 leading-relaxed"
        >
          Your subscription is active. You now have full access to all courses, scenarios, and certifications. Here's how to get started:
        </motion.p>

        {/* Onboarding Steps */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-10"
        >
          {[
            {
              icon: BookOpen,
              title: "Start a Course",
              desc: "Begin with Electrical Fundamentals",
              href: "/courses",
            },
            {
              icon: Zap,
              title: "Try the Simulator",
              desc: "Diagnose your first VFD fault",
              href: "/simulator",
            },
            {
              icon: Award,
              title: "Earn Certificates",
              desc: "Complete modules to certify",
              href: "/certifications",
            },
          ].map((step, i) => (
            <Link key={i} href={step.href}>
              <div className="p-4 rounded-xl border border-[oklch(0.16_0.004_250)] bg-[oklch(0.08_0.003_250)] hover:border-[oklch(0.55_0.12_155/35%)] transition-all cursor-pointer group text-left">
                <step.icon className="w-5 h-5 text-[oklch(0.55_0.12_155)] mb-2 group-hover:scale-110 transition-transform" />
                <h3 className="text-sm font-medium text-white mb-1">{step.title}</h3>
                <p className="text-[11px] text-[oklch(0.45_0.006_250)]">{step.desc}</p>
              </div>
            </Link>
          ))}
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <Link href="/dashboard">
            <Button className="gap-2 btn-primary px-8 py-3 text-sm shadow-lg shadow-[oklch(0.55_0.12_155/15%)]">
              <Rocket className="w-4 h-4" />
              Go to Dashboard
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </motion.div>
      </motion.div>
    </div>
  );
}
