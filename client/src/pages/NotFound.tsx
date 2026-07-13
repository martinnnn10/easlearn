import { Link } from "wouter";
import { AlertTriangle, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center pt-20">
      <div className="text-center">
        <div className="flex items-center justify-center gap-3 mb-6">
          <AlertTriangle className="w-5 h-5 text-[oklch(0.8_0.15_75)]" />
          <span className="text-xs font-mono-industrial text-[oklch(0.8_0.15_75)] tracking-wider uppercase">
            FAULT DETECTED
          </span>
        </div>
        <h1 className="text-7xl sm:text-9xl font-heading text-white mb-4">404</h1>
        <p className="text-lg text-[oklch(0.5_0.01_250)] mb-2">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <p className="text-sm text-[oklch(0.4_0.008_250)] mb-8">
          If you followed a link here, it may be outdated. Try one of the options below.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-3 px-6 py-3 bg-[oklch(0.55_0.12_155)] text-[oklch(0.1_0.01_135)] font-semibold text-sm tracking-wider uppercase rounded-sm hover:bg-[oklch(0.48_0.10_155)] transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            Return to Home
          </Link>
          <Link
            href="/courses"
            className="inline-flex items-center gap-3 px-6 py-3 bg-transparent border border-[oklch(0.20_0.004_250)] text-[oklch(0.65_0.008_250)] hover:text-white font-medium text-sm tracking-wider uppercase rounded-sm hover:border-[oklch(0.30_0.06_155)] transition-all"
          >
            Browse Courses
          </Link>
        </div>
      </div>
    </div>
  );
}
