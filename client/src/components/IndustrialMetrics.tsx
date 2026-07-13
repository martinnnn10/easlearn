/**
 * Animated industrial metrics display component
 * Used on homepage and other pages for live-looking data
 */
import { useEffect, useState } from "react";
import { motion } from "framer-motion";

interface MetricProps {
  label: string;
  value: number;
  unit: string;
  min: number;
  max: number;
}

export function AnimatedGauge({ label, value, unit, min, max }: MetricProps) {
  const [displayValue, setDisplayValue] = useState(min);
  const percentage = ((displayValue - min) / (max - min)) * 100;

  useEffect(() => {
    const timer = setTimeout(() => setDisplayValue(value), 500);
    return () => clearTimeout(timer);
  }, [value]);

  return (
    <div className="card-panel p-4 text-center">
      <div className="text-[10px] font-mono-industrial text-[oklch(0.5_0.01_250)] mb-2 tracking-wider">
        {label}
      </div>
      <div className="relative w-full h-2 bg-[oklch(0.15_0.005_250)] rounded-full overflow-hidden mb-2">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          className="absolute inset-y-0 left-0 bg-[oklch(0.55_0.12_155)] rounded-full"
          style={{
            boxShadow: "0 0 8px oklch(0.78 0.22 135 / 50%)",
          }}
        />
      </div>
      <div className="flex items-baseline justify-center gap-1">
        <span className="text-xl font-mono-industrial text-white">{displayValue}</span>
        <span className="text-xs text-[oklch(0.5_0.01_250)]">{unit}</span>
      </div>
    </div>
  );
}

export function StatusIndicator({ label, status }: { label: string; status: "online" | "warning" | "offline" }) {
  const colors = {
    online: "oklch(0.78 0.22 135)",
    warning: "oklch(0.8 0.15 75)",
    offline: "oklch(0.6 0.2 25)",
  };

  return (
    <div className="flex items-center gap-2">
      <div
        className="w-2 h-2 rounded-full"
        style={{
          backgroundColor: colors[status],
          boxShadow: `0 0 6px ${colors[status]}`,
        }}
      />
      <span className="text-xs font-mono-industrial text-[oklch(0.6_0.01_250)]">{label}</span>
    </div>
  );
}
