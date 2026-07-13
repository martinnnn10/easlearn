/**
 * RequestAccessForm - Lead capture form for full simulator access
 * Typography: Oswald (headings), Inter (body), Share Tech Mono (labels)
 */
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  CheckCircle2,
  X,
  Building2,
  User,
  Mail,
  Briefcase,
  Factory,
} from "lucide-react";

interface FormData {
  name: string;
  email: string;
  company: string;
  role: string;
  plantType: string;
  teamSize: string;
  message: string;
}

const initialFormData: FormData = {
  name: "",
  email: "",
  company: "",
  role: "",
  plantType: "",
  teamSize: "",
  message: "",
};

const roleOptions = [
  "Maintenance Manager",
  "Plant Manager",
  "Controls Engineer",
  "Maintenance Technician",
  "Training Coordinator",
  "Operations Manager",
  "Reliability Engineer",
  "Other",
];

const plantTypes = [
  "Food & Beverage",
  "Automotive",
  "Pharmaceutical",
  "Chemical Processing",
  "Packaging / CPG",
  "Metal Fabrication",
  "Pulp & Paper",
  "Water / Wastewater",
  "Oil & Gas",
  "Other",
];

const teamSizes = [
  "1-5 technicians",
  "6-15 technicians",
  "16-30 technicians",
  "31-50 technicians",
  "50+ technicians",
];

export default function RequestAccessForm({
  onClose,
}: {
  onClose: () => void;
}) {
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    // Simulate submission delay
    setTimeout(() => {
      setSubmitting(false);
      setSubmitted(true);
      // In production, this would POST to an API
      console.log("Lead captured:", formData);
    }, 1500);
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const inputClass =
    "w-full bg-[oklch(0.08_0.003_250)] border border-[oklch(0.2_0.004_250)] rounded px-4 py-3 text-[14px] text-white placeholder:text-[oklch(0.4_0.006_250)] focus:border-[oklch(0.55_0.12_155/50%)] focus:outline-none focus:ring-1 focus:ring-[oklch(0.55_0.12_155/20%)] transition-colors";

  const selectClass =
    "w-full bg-[oklch(0.08_0.003_250)] border border-[oklch(0.2_0.004_250)] rounded px-4 py-3 text-[14px] text-white focus:border-[oklch(0.55_0.12_155/50%)] focus:outline-none focus:ring-1 focus:ring-[oklch(0.55_0.12_155/20%)] transition-colors appearance-none cursor-pointer";

  const labelClass =
    "font-mono-industrial text-[10px] text-[oklch(0.5_0.008_250)] tracking-wider block mb-1.5";

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.3 }}
          className="w-full max-w-lg max-h-[90vh] overflow-y-auto bg-[oklch(0.1_0.003_250)] border border-[oklch(0.2_0.004_250)] rounded-lg shadow-2xl"
          style={{ WebkitOverflowScrolling: "touch", overscrollBehavior: "contain" }}
        >
          {/* Header */}
          <div className="sticky top-0 z-10 flex items-center justify-between p-5 border-b border-[oklch(0.18_0.004_250)] bg-[oklch(0.1_0.003_250)]">
            <div>
              <span className="font-mono-industrial text-[10px] text-[oklch(0.55_0.12_155)] tracking-wider block mb-0.5">
                FULL ACCESS REQUEST
              </span>
              <h3 className="text-lg font-heading text-white tracking-wide">
                GET YOUR TEAM STARTED
              </h3>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded flex items-center justify-center border border-[oklch(0.2_0.004_250)] hover:border-[oklch(0.3_0.004_250)] hover:bg-[oklch(0.15_0.003_250)] transition-colors"
            >
              <X className="w-4 h-4 text-[oklch(0.5_0.008_250)]" />
            </button>
          </div>

          {/* Form Content */}
          <div className="p-5">
            {submitted ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-10"
              >
                <div className="w-14 h-14 rounded-full bg-[oklch(0.55_0.12_155/10%)] border border-[oklch(0.55_0.12_155/25%)] flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-7 h-7 text-[oklch(0.55_0.12_155)]" />
                </div>
                <h4 className="text-xl font-heading text-white mb-2">
                  REQUEST RECEIVED
                </h4>
                <p className="text-[14px] text-[oklch(0.55_0.008_250)] max-w-sm mx-auto mb-6">
                  We'll review your request and get back to you within 24 hours
                  with full access credentials and onboarding details.
                </p>
                <button
                  onClick={onClose}
                  className="btn-primary inline-flex items-center gap-2 px-6 py-3 font-semibold text-[13px] tracking-wider uppercase rounded"
                >
                  Close
                </button>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Name & Email Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>FULL NAME *</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[oklch(0.35_0.006_250)]" />
                      <input
                        type="text"
                        name="name"
                        required
                        placeholder="John Smith"
                        value={formData.name}
                        onChange={handleChange}
                        className={`${inputClass} pl-10`}
                      />
                    </div>
                  </div>
                  <div>
                    <label className={labelClass}>EMAIL *</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[oklch(0.35_0.006_250)]" />
                      <input
                        type="email"
                        name="email"
                        required
                        placeholder="john@company.com"
                        value={formData.email}
                        onChange={handleChange}
                        className={`${inputClass} pl-10`}
                      />
                    </div>
                  </div>
                </div>

                {/* Company */}
                <div>
                  <label className={labelClass}>COMPANY *</label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[oklch(0.35_0.006_250)]" />
                    <input
                      type="text"
                      name="company"
                      required
                      placeholder="Acme Manufacturing"
                      value={formData.company}
                      onChange={handleChange}
                      className={`${inputClass} pl-10`}
                    />
                  </div>
                </div>

                {/* Role & Plant Type */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>YOUR ROLE *</label>
                    <div className="relative">
                      <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[oklch(0.35_0.006_250)]" />
                      <select
                        name="role"
                        required
                        value={formData.role}
                        onChange={handleChange}
                        className={`${selectClass} pl-10`}
                      >
                        <option value="">Select role...</option>
                        {roleOptions.map((role) => (
                          <option key={role} value={role}>
                            {role}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className={labelClass}>PLANT TYPE *</label>
                    <div className="relative">
                      <Factory className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[oklch(0.35_0.006_250)]" />
                      <select
                        name="plantType"
                        required
                        value={formData.plantType}
                        onChange={handleChange}
                        className={`${selectClass} pl-10`}
                      >
                        <option value="">Select type...</option>
                        {plantTypes.map((type) => (
                          <option key={type} value={type}>
                            {type}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Team Size */}
                <div>
                  <label className={labelClass}>MAINTENANCE TEAM SIZE</label>
                  <select
                    name="teamSize"
                    value={formData.teamSize}
                    onChange={handleChange}
                    className={selectClass}
                  >
                    <option value="">Select team size...</option>
                    {teamSizes.map((size) => (
                      <option key={size} value={size}>
                        {size}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Message */}
                <div>
                  <label className={labelClass}>
                    ANYTHING ELSE WE SHOULD KNOW?
                  </label>
                  <textarea
                    name="message"
                    rows={3}
                    placeholder="Tell us about your training goals, current challenges, or specific scenarios you'd like to see..."
                    value={formData.message}
                    onChange={handleChange}
                    className={`${inputClass} resize-none`}
                  />
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full btn-primary flex items-center justify-center gap-3 px-6 py-3.5 font-semibold text-[13px] tracking-wider uppercase rounded disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      Request Full Access
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                <p className="text-[11px] text-[oklch(0.4_0.006_250)] text-center">
                  We'll respond within 24 hours. No spam, no sales calls unless
                  you want them.
                </p>
              </form>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
