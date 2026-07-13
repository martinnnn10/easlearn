/**
 * Contact Page - Connected to backend
 * Real contact info, form submits to database
 */
import { useState } from "react";
import { motion } from "framer-motion";
import { Send, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import SEO from "@/components/SEO";

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.5 }
};

export default function Contact() {
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    company: "",
    inquiryType: "general" as "general" | "training" | "simulator" | "assessment",
    message: "",
  });

  const submitMutation = trpc.contact.submit.useMutation({
    onSuccess: () => {
      setSubmitted(true);
      toast.success("Message sent. We'll be in touch within 24 hours.");
    },
    onError: (error) => {
      toast.error("Failed to send message. Please try again or use the contact form.");
      console.error("Contact form error:", error);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitMutation.mutate({
      name: formData.name,
      email: formData.email,
      company: formData.company || undefined,
      inquiryType: formData.inquiryType,
      message: formData.message,
    });
  };

  return (
    <div>
      <SEO
        title="Contact Us"
        description="Contact Electrical Automation Services for training courses, troubleshooting simulation, or candidate assessments."
        path="/contact"
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
              Contact Us
            </h1>
            <p className="text-lg text-[oklch(0.65_0.008_250)] leading-relaxed">
              Whether you need training for your team, help with a technical hire, or want to see the simulator in action — reach out. No pressure, no sales pitch.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Contact Content */}
      <section className="py-20">
        <div className="container">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            {/* Contact Info */}
            <motion.div {...fadeIn}>
              <h2 className="text-2xl font-heading text-white tracking-wide mb-6">
                Get in Touch
              </h2>

              <div className="space-y-6 mb-10">
                <div>
                  <p className="text-white font-medium mb-1">Electrical Automation Services, Inc.</p>
                  <p className="text-sm text-[oklch(0.55_0.008_250)]">Use the form to reach our team.</p>
                </div>
              </div>

              <div className="border-t border-[oklch(0.18_0.004_250)] pt-8 mb-10" />

              <div>
                <h3 className="text-lg font-semibold text-white mb-4">What to expect</h3>
                <ul className="space-y-3">
                  {[
                    "Response within 24 hours",
                    "No obligation conversation about your needs",
                    "Straightforward pricing — no hidden fees",
                    "Demo of the simulator if you're interested",
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-3 text-sm text-[oklch(0.65_0.005_250)]">
                      <CheckCircle className="w-4 h-4 text-[oklch(0.55_0.12_155)] shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>

            {/* Form */}
            <motion.div
              {...fadeIn}
              transition={{ duration: 0.5, delay: 0.15 }}
            >
              {submitted ? (
                <div className="card-panel p-10 text-center">
                  <CheckCircle className="w-12 h-12 text-[oklch(0.55_0.12_155)] mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">Message Sent</h3>
                  <p className="text-sm text-[oklch(0.60_0.008_250)]">
                    Thanks for reaching out. We'll get back to you within 24 hours.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="card-panel p-8 space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-[oklch(0.70_0.005_250)] mb-1.5">Name</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-2.5 bg-[oklch(0.10_0.003_250)] border border-[oklch(0.22_0.004_250)] rounded text-white text-sm focus:border-[oklch(0.55_0.12_155/50%)] focus:outline-none transition-colors"
                      placeholder="Your name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[oklch(0.70_0.005_250)] mb-1.5">Email</label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-2.5 bg-[oklch(0.10_0.003_250)] border border-[oklch(0.22_0.004_250)] rounded text-white text-sm focus:border-[oklch(0.55_0.12_155/50%)] focus:outline-none transition-colors"
                      placeholder="you@company.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[oklch(0.70_0.005_250)] mb-1.5">Company</label>
                    <input
                      type="text"
                      value={formData.company}
                      onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                      className="w-full px-4 py-2.5 bg-[oklch(0.10_0.003_250)] border border-[oklch(0.22_0.004_250)] rounded text-white text-sm focus:border-[oklch(0.55_0.12_155/50%)] focus:outline-none transition-colors"
                      placeholder="Company name (optional)"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[oklch(0.70_0.005_250)] mb-1.5">I'm interested in</label>
                    <select
                      value={formData.inquiryType}
                      onChange={(e) => setFormData({ ...formData, inquiryType: e.target.value as typeof formData.inquiryType })}
                      className="w-full px-4 py-2.5 bg-[oklch(0.10_0.003_250)] border border-[oklch(0.22_0.004_250)] rounded text-white text-sm focus:border-[oklch(0.55_0.12_155/50%)] focus:outline-none transition-colors"
                    >
                      <option value="general">General inquiry</option>
                      <option value="training">Training programs</option>
                      <option value="simulator">Troubleshooting simulator demo</option>
                      <option value="assessment">Candidate assessments</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[oklch(0.70_0.005_250)] mb-1.5">Message</label>
                    <textarea
                      rows={4}
                      required
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      className="w-full px-4 py-2.5 bg-[oklch(0.10_0.003_250)] border border-[oklch(0.22_0.004_250)] rounded text-white text-sm focus:border-[oklch(0.55_0.12_155/50%)] focus:outline-none transition-colors resize-none"
                      placeholder="Tell us about your needs..."
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={submitMutation.isPending}
                    className="w-full flex items-center justify-center gap-2 px-6 py-3 btn-primary text-sm font-medium rounded disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitMutation.isPending ? "Sending..." : "Send Message"}
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              )}
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
}
