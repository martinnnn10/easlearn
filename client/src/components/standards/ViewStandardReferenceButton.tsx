import { Link } from "wouter";
import { BookOpen } from "lucide-react";

export default function ViewStandardReferenceButton({
  symbolId,
  className = "",
}: {
  symbolId: string;
  className?: string;
}) {
  return (
    <Link
      href={`/reference/electrical/${symbolId}`}
      className={`inline-flex items-center gap-1 text-[10px] font-mono text-[oklch(0.55_0.12_155)] hover:text-[oklch(0.65_0.12_155)] border border-[oklch(0.55_0.12_155/25%)] rounded px-2 py-1 transition-colors ${className}`}
      onClick={(e: React.MouseEvent) => e.stopPropagation()}
    >
      <BookOpen className="w-3 h-3" />
      View Standard
    </Link>
  );
}
