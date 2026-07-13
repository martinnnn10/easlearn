import { motion } from "framer-motion";

/**
 * Premium industrial-themed loading skeleton.
 * Shows animated bars with a SCADA-style scanning effect.
 */
export function IndustrialSkeleton({ lines = 4, className = "" }: { lines?: number; className?: string }) {
  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <motion.div
          key={i}
          className="h-3 rounded bg-[oklch(0.14_0.004_250)] overflow-hidden relative"
          style={{ width: `${70 + Math.random() * 30}%` }}
        >
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-[oklch(0.20_0.008_155/20%)] to-transparent"
            animate={{ x: ["-100%", "200%"] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.15, ease: "linear" }}
          />
        </motion.div>
      ))}
    </div>
  );
}

/**
 * Full-page industrial loading state with SCADA-style scanner.
 */
export function IndustrialPageLoader({ message = "Loading..." }: { message?: string }) {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-6">
      {/* SCADA-style rotating indicator */}
      <div className="relative w-16 h-16">
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-[oklch(0.55_0.12_155/30%)]"
          animate={{ rotate: 360 }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
        />
        <motion.div
          className="absolute inset-1 rounded-full border-2 border-transparent border-t-[oklch(0.55_0.12_155)]"
          animate={{ rotate: -360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
        />
        <motion.div
          className="absolute inset-3 rounded-full bg-[oklch(0.55_0.12_155/10%)]"
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
        <motion.div
          className="absolute inset-[18px] rounded-full bg-[oklch(0.55_0.12_155)]"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1, repeat: Infinity }}
        />
      </div>
      <div className="text-center">
        <p className="text-sm text-gray-400 font-mono uppercase tracking-wider">{message}</p>
        <motion.div
          className="mt-2 h-0.5 w-24 mx-auto bg-[oklch(0.15_0.004_250)] rounded-full overflow-hidden"
        >
          <motion.div
            className="h-full bg-[oklch(0.55_0.12_155)]"
            animate={{ x: ["-100%", "100%"] }}
            transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
            style={{ width: "50%" }}
          />
        </motion.div>
      </div>
    </div>
  );
}

/**
 * Card skeleton for module/course cards
 */
export function CardSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: i * 0.1 }}
          className="p-5 rounded-lg border border-[oklch(0.18_0.004_250)] bg-[oklch(0.09_0.003_250)]"
        >
          <div className="flex items-start justify-between mb-4">
            <div className="w-10 h-10 rounded bg-[oklch(0.14_0.004_250)] animate-pulse" />
            <div className="w-16 h-4 rounded bg-[oklch(0.14_0.004_250)] animate-pulse" />
          </div>
          <div className="h-4 w-3/4 rounded bg-[oklch(0.14_0.004_250)] animate-pulse mb-3" />
          <div className="h-2 w-full rounded bg-[oklch(0.14_0.004_250)] animate-pulse mb-2" />
          <div className="h-3 w-1/2 rounded bg-[oklch(0.14_0.004_250)] animate-pulse" />
        </motion.div>
      ))}
    </div>
  );
}
