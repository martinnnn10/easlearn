/**
 * Plant Floor Callout Blocks
 * 
 * Premium industrial info panels for embedding real-world knowledge
 * throughout course and tutorial content.
 * 
 * Variants:
 * - FIELD NOTE — practical observation from the field
 * - COMMON FAILURE — frequently seen failure mode
 * - TECH TIP — actionable shortcut or best practice
 * - REAL WORLD WARNING — safety or critical warning
 * - MISTAKE TECHS MAKE — common error to avoid
 * - PLANT FLOOR EXAMPLE — real scenario illustration
 * 
 * Supports collapsible mode for long callouts.
 */
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Wrench, Lightbulb, ShieldAlert, XCircle, Factory, ChevronDown } from "lucide-react";

export type CalloutVariant = 
  | "field_note"
  | "common_failure"
  | "tech_tip"
  | "warning"
  | "mistake"
  | "plant_example";

interface PlantFloorCalloutProps {
  variant: CalloutVariant;
  title?: string;
  children: React.ReactNode;
  className?: string;
  /** When true, content is collapsed by default and can be expanded */
  collapsible?: boolean;
  /** When collapsible is true, controls initial state. Defaults to false (collapsed). */
  defaultOpen?: boolean;
}

const VARIANT_CONFIG: Record<CalloutVariant, {
  label: string;
  icon: typeof AlertTriangle;
  accentColor: string;
  bgColor: string;
  borderColor: string;
  iconColor: string;
  labelColor: string;
}> = {
  field_note: {
    label: "FIELD NOTE",
    icon: Wrench,
    accentColor: "oklch(0.55 0.12 155)",
    bgColor: "bg-emerald-950/20",
    borderColor: "border-emerald-500/30",
    iconColor: "text-emerald-400",
    labelColor: "text-emerald-400",
  },
  common_failure: {
    label: "COMMON FAILURE",
    icon: AlertTriangle,
    accentColor: "oklch(0.65 0.15 30)",
    bgColor: "bg-red-950/15",
    borderColor: "border-red-500/25",
    iconColor: "text-red-400",
    labelColor: "text-red-400",
  },
  tech_tip: {
    label: "TECH TIP",
    icon: Lightbulb,
    accentColor: "oklch(0.70 0.12 80)",
    bgColor: "bg-amber-950/15",
    borderColor: "border-amber-500/25",
    iconColor: "text-amber-400",
    labelColor: "text-amber-400",
  },
  warning: {
    label: "REAL WORLD WARNING",
    icon: ShieldAlert,
    accentColor: "oklch(0.60 0.18 30)",
    bgColor: "bg-red-950/20",
    borderColor: "border-red-500/40",
    iconColor: "text-red-500",
    labelColor: "text-red-400",
  },
  mistake: {
    label: "MISTAKE TECHS MAKE",
    icon: XCircle,
    accentColor: "oklch(0.60 0.12 300)",
    bgColor: "bg-purple-950/15",
    borderColor: "border-purple-500/25",
    iconColor: "text-purple-400",
    labelColor: "text-purple-400",
  },
  plant_example: {
    label: "PLANT FLOOR EXAMPLE",
    icon: Factory,
    accentColor: "oklch(0.55 0.10 220)",
    bgColor: "bg-blue-950/15",
    borderColor: "border-blue-500/25",
    iconColor: "text-blue-400",
    labelColor: "text-blue-400",
  },
};

export default function PlantFloorCallout({ 
  variant, 
  title, 
  children, 
  className = "",
  collapsible = false,
  defaultOpen = false,
}: PlantFloorCalloutProps) {
  const config = VARIANT_CONFIG[variant];
  const Icon = config.icon;
  const [isOpen, setIsOpen] = useState(collapsible ? defaultOpen : true);

  const headerContent = (
    <div className="flex items-center gap-2.5">
      <div className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 ${config.bgColor}`} style={{ border: `1px solid ${config.accentColor}40` }}>
        <Icon className={`w-3.5 h-3.5 ${config.iconColor}`} />
      </div>
      <span className={`text-[10px] uppercase tracking-[0.12em] font-bold ${config.labelColor}`}>
        {config.label}
      </span>
      {title && (
        <>
          <span className="text-[oklch(0.30_0.006_250)]">—</span>
          <span className="text-xs font-semibold text-white truncate">{title}</span>
        </>
      )}
      {collapsible && (
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="ml-auto shrink-0"
        >
          <ChevronDown className={`w-4 h-4 ${config.iconColor} opacity-60`} />
        </motion.div>
      )}
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4 }}
      className={`relative rounded-lg border-l-[3px] ${config.bgColor} ${config.borderColor} p-4 md:p-5 my-6 backdrop-blur-sm ${className}`}
      style={{ borderLeftColor: config.accentColor }}
    >
      {/* Header — clickable when collapsible */}
      {collapsible ? (
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full text-left mb-0 focus:outline-none group"
          aria-expanded={isOpen}
        >
          {headerContent}
        </button>
      ) : (
        <div className="mb-2.5">
          {headerContent}
        </div>
      )}

      {/* Content — animated collapse */}
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={collapsible ? { height: 0, opacity: 0 } : false}
            animate={{ height: "auto", opacity: 1 }}
            exit={collapsible ? { height: 0, opacity: 0 } : undefined}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className={`text-[13px] text-gray-300 leading-relaxed ${collapsible ? "mt-3 pt-3 border-t border-white/5" : ""}`}>
              {/* Non-collapsible title (shown below header when not inline) */}
              {!collapsible && title && (
                <h4 className="text-sm font-semibold text-white mb-2">{title}</h4>
              )}
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Subtle corner accent */}
      <div
        className="absolute top-0 right-0 w-12 h-12 opacity-[0.04] rounded-bl-full pointer-events-none"
        style={{ background: config.accentColor }}
      />
    </motion.div>
  );
}

/**
 * Inline callout for use within Streamdown/markdown content.
 * Wraps text in a styled callout block.
 */
export function InlineCallout({ variant, text }: { variant: CalloutVariant; text: string }) {
  return (
    <PlantFloorCallout variant={variant}>
      <p>{text}</p>
    </PlantFloorCallout>
  );
}
