/**
 * PreviewFrame — wraps a logged-out evaluator preview with a clear "sample data"
 * banner and the two actions that matter before login: request an employer demo,
 * or sign in to see live records. Keeps the previews honest and sales-ready.
 */
import { useLocation } from "wouter";
import { Eye, ArrowRight } from "lucide-react";
import { SAMPLE_BADGE } from "@/lib/sampleCompetency";

export default function PreviewFrame({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  const [, navigate] = useLocation();
  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8">
      <div className="mb-4 flex items-center gap-2 text-[11px] uppercase tracking-widest text-amber-300/90">
        <Eye className="w-3.5 h-3.5" /> {SAMPLE_BADGE}
      </div>
      <div className="flex items-start justify-between gap-4 flex-wrap mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">{title}</h1>
          <p className="text-gray-500 text-sm mt-1 max-w-xl">{subtitle}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => navigate("/contact")} className="inline-flex items-center gap-2 rounded bg-emerald-600 hover:bg-emerald-500 px-4 py-2 text-sm font-semibold text-white">
            Request employer demo <ArrowRight className="w-4 h-4" />
          </button>
          <button onClick={() => navigate("/login")} className="rounded border border-gray-700 hover:bg-gray-800 px-4 py-2 text-sm text-gray-300">Sign in</button>
        </div>
      </div>
      {children}
      <div className="mt-8 rounded-xl border border-emerald-500/20 bg-[#0c130c] p-5 text-center">
        <p className="text-gray-300 text-sm mb-3">This is exactly what your team's live data looks like. See it with your own operators.</p>
        <button onClick={() => navigate("/contact")} className="inline-flex items-center gap-2 rounded bg-emerald-600 hover:bg-emerald-500 px-6 py-2.5 text-sm font-semibold text-white">
          Request an employer demo <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
