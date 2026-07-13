/**
 * TutorialDetail Page - Premium industrial article reader
 */
import { useEffect } from "react";
import { Link, useParams } from "wouter";
import { motion } from "framer-motion";
import { trpc } from "@/lib/trpc";
import SEO from "@/components/SEO";
import { Badge } from "@/components/ui/badge";
import {
  Clock,
  BookOpen,
  ArrowLeft,
  ArrowRight,
  Share2,
  Zap,
  GraduationCap,
} from "lucide-react";
import { Streamdown } from "streamdown";
import { toast } from "sonner";

const difficultyColors: Record<string, string> = {
  beginner: "bg-[oklch(0.55_0.15_145/12%)] text-[oklch(0.65_0.15_145)] border-[oklch(0.55_0.15_145/25%)]",
  intermediate: "bg-[oklch(0.60_0.15_85/12%)] text-[oklch(0.70_0.15_85)] border-[oklch(0.60_0.15_85/25%)]",
  advanced: "bg-[oklch(0.55_0.15_25/12%)] text-[oklch(0.65_0.15_25)] border-[oklch(0.55_0.15_25/25%)]",
};

export default function TutorialDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { data, isLoading } = trpc.tutorials.getBySlug.useQuery({ slug: slug || "" });

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: data?.tutorial.title,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied to clipboard!");
    }
  };

  // SEO: JSON-LD structured data — must be before any early returns to satisfy React hooks rules
  useEffect(() => {
    const tutorial = data?.tutorial;
    if (!tutorial) return;
    const tags = (tutorial.tags as string[] | null) || [];
    const existingLd = document.querySelector('#tutorial-jsonld');
    if (existingLd) existingLd.remove();
    const script = document.createElement('script');
    script.id = 'tutorial-jsonld';
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "TechArticle",
      "headline": tutorial.title,
      "description": tutorial.metaDescription,
      "author": {
        "@type": "Organization",
        "name": "Electrical Automation Services Inc."
      },
      "publisher": {
        "@type": "Organization",
        "name": "Electrical Automation Services Inc.",
        "url": "https://easlearn.org"
      },
      "datePublished": tutorial.publishedAt,
      "dateModified": tutorial.updatedAt,
      "mainEntityOfPage": {
        "@type": "WebPage",
        "@id": `https://easlearn.org/tutorials/${tutorial.slug}`
      },
      "keywords": tags.join(", "),
      "articleSection": tutorial.category,
      "timeRequired": `PT${tutorial.readingTime}M`,
      "proficiencyLevel": tutorial.difficulty === "beginner" ? "Beginner" : tutorial.difficulty === "intermediate" ? "Intermediate" : "Expert"
    });
    document.head.appendChild(script);

    return () => {
      const ldScript = document.querySelector('#tutorial-jsonld');
      if (ldScript) ldScript.remove();
    };
  }, [data?.tutorial]);

  if (isLoading) {
    return (
      <div className="py-20">
        <div className="container max-w-4xl">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-[oklch(0.15_0.003_250)] rounded w-1/4" />
            <div className="h-10 bg-[oklch(0.15_0.003_250)] rounded w-3/4" />
            <div className="h-4 bg-[oklch(0.15_0.003_250)] rounded w-1/2 mb-8" />
            <div className="space-y-3 mt-8">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-4 bg-[oklch(0.12_0.003_250)] rounded" style={{ width: `${70 + Math.random() * 30}%` }} />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="py-20 text-center">
        <BookOpen className="w-12 h-12 mx-auto text-[oklch(0.35_0.006_250)] mb-4" />
        <h2 className="text-xl font-heading text-white tracking-wide mb-2">Tutorial Not Found</h2>
        <p className="text-sm text-[oklch(0.50_0.008_250)] mb-4">
          This tutorial may have been moved or doesn't exist.
        </p>
        <Link href="/tutorials" className="inline-flex items-center gap-2 text-sm text-[oklch(0.55_0.12_155)] hover:gap-3 transition-all">
          <ArrowLeft className="w-4 h-4" />
          Back to Tutorials
        </Link>
      </div>
    );
  }

  const { tutorial, related } = data;
  const tags = (tutorial.tags as string[] | null) || [];

  return (
    <>
      <SEO
        title={tutorial.title}
        description={tutorial.metaDescription}
        path={`/tutorials/${tutorial.slug}`}
        type="article"
      />
      <div>
        {/* Article Header */}
        <section className="relative py-12 sm:py-16 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-[oklch(0.12_0.02_155/5%)] via-transparent to-transparent" />
          <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-[oklch(0.55_0.12_155/20%)] to-transparent" />
          
          <div className="container max-w-4xl relative">
            {/* Breadcrumb */}
            <nav className="flex items-center gap-2 text-xs text-[oklch(0.45_0.006_250)] mb-6">
              <Link href="/tutorials" className="hover:text-[oklch(0.55_0.12_155)] transition-colors">
                Tutorials
              </Link>
              <span>/</span>
              <span className="text-[oklch(0.55_0.008_250)] truncate">{tutorial.title}</span>
            </nav>

            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-medium border ${difficultyColors[tutorial.difficulty]}`}>
                  {tutorial.difficulty}
                </span>
                <span className="text-xs px-2 py-0.5 rounded bg-[oklch(0.12_0.003_250)] border border-[oklch(0.18_0.004_250)] text-[oklch(0.55_0.008_250)]">
                  {tutorial.category}
                </span>
                <span className="text-xs text-[oklch(0.45_0.006_250)] flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {tutorial.readingTime} min read
                </span>
              </div>

              <h1 className="text-3xl sm:text-4xl font-heading text-white tracking-wide mb-4">
                {tutorial.title}
              </h1>

              <p className="text-[oklch(0.60_0.008_250)] leading-relaxed">
                {tutorial.metaDescription}
              </p>

              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-4">
                  {tags.map((tag) => (
                    <span key={tag} className="text-[10px] px-2 py-0.5 rounded bg-[oklch(0.10_0.003_250)] border border-[oklch(0.15_0.004_250)] text-[oklch(0.50_0.008_250)]">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </motion.div>
          </div>
          
          <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-[oklch(0.20_0.004_250)] to-transparent" />
        </section>

        {/* Content Area — 2 column on desktop */}
        <section className="container py-10">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-10 max-w-6xl mx-auto">
            {/* Main Article */}
            <article className="min-w-0">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.15 }}
                className="prose prose-invert prose-lg max-w-none
                  prose-headings:font-heading prose-headings:tracking-wide
                  prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-4
                  prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-3
                  prose-p:text-[oklch(0.72_0.008_250)] prose-p:leading-relaxed
                  prose-strong:text-white
                  prose-code:text-[oklch(0.75_0.06_155)] prose-code:bg-[oklch(0.12_0.003_250)] prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm
                  prose-pre:bg-[oklch(0.08_0.003_250)] prose-pre:border prose-pre:border-[oklch(0.15_0.004_250)]
                  prose-table:border-collapse
                  prose-th:bg-[oklch(0.12_0.003_250)] prose-th:p-3 prose-th:text-left prose-th:border prose-th:border-[oklch(0.15_0.004_250)]
                  prose-td:p-3 prose-td:border prose-td:border-[oklch(0.15_0.004_250)]
                  prose-li:text-[oklch(0.72_0.008_250)]
                  prose-a:text-[oklch(0.55_0.12_155)] prose-a:no-underline hover:prose-a:underline
                  prose-blockquote:border-l-[oklch(0.55_0.12_155)] prose-blockquote:text-[oklch(0.65_0.008_250)]
                "
              >
                <Streamdown parseIncompleteMarkdown={false}>{tutorial.content}</Streamdown>
              </motion.div>

              {/* Separator */}
              <div className="my-10 h-px bg-gradient-to-r from-transparent via-[oklch(0.20_0.004_250)] to-transparent" />

              {/* Bottom CTAs */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="card-panel p-5 border-[oklch(0.55_0.12_155/20%)] relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-[oklch(0.55_0.12_155/5%)] to-transparent" />
                  <div className="relative flex items-start gap-3">
                    <Zap className="w-5 h-5 text-[oklch(0.55_0.12_155)] mt-0.5 shrink-0" />
                    <div>
                      <h3 className="text-sm font-medium text-white mb-1">Practice in the Simulator</h3>
                      <p className="text-xs text-[oklch(0.50_0.008_250)] mb-3">
                        Apply what you learned in a hands-on troubleshooting scenario.
                      </p>
                      <Link href="/simulator" className="inline-flex items-center gap-1.5 text-xs text-[oklch(0.55_0.12_155)] font-medium hover:gap-2 transition-all">
                        Open Simulator <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                </div>

                <div className="card-panel p-5 border-[oklch(0.60_0.15_85/20%)] relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-[oklch(0.60_0.15_85/5%)] to-transparent" />
                  <div className="relative flex items-start gap-3">
                    <GraduationCap className="w-5 h-5 text-[oklch(0.70_0.15_85)] mt-0.5 shrink-0" />
                    <div>
                      <h3 className="text-sm font-medium text-white mb-1">Get Full Access with Pro</h3>
                      <p className="text-xs text-[oklch(0.50_0.008_250)] mb-3">
                        Unlock all courses, scenarios, and earn certificates.
                      </p>
                      <Link href="/pricing" className="inline-flex items-center gap-1.5 text-xs text-[oklch(0.70_0.15_85)] font-medium hover:gap-2 transition-all">
                        View Plans <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>

              {/* Share */}
              <div className="flex items-center gap-3 mt-6">
                <button
                  onClick={handleShare}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-[oklch(0.18_0.004_250)] text-xs text-[oklch(0.60_0.008_250)] hover:border-[oklch(0.55_0.12_155/30%)] hover:text-[oklch(0.55_0.12_155)] transition-all"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  Share this tutorial
                </button>
              </div>
            </article>

            {/* Sidebar */}
            <aside className="hidden lg:block">
              <div className="sticky top-24 space-y-5">
                {/* Related Tutorials */}
                {related.length > 0 && (
                  <div className="card-panel p-5">
                    <h3 className="text-sm font-heading text-white tracking-wide mb-4 flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-[oklch(0.55_0.12_155)]" />
                      Related Tutorials
                    </h3>
                    <div className="space-y-2">
                      {related.map((r) => (
                        <Link key={r.id} href={`/tutorials/${r.slug}`}>
                          <div className="group p-2.5 -mx-1 rounded-lg hover:bg-[oklch(0.12_0.003_250)] transition-colors cursor-pointer">
                            <p className="text-xs font-medium text-[oklch(0.75_0.008_250)] group-hover:text-[oklch(0.55_0.12_155)] transition-colors line-clamp-2">
                              {r.title}
                            </p>
                            <div className="flex items-center gap-2 mt-1.5">
                              <span className={`inline-flex px-1.5 py-0 rounded text-[9px] border ${difficultyColors[r.difficulty]}`}>
                                {r.difficulty}
                              </span>
                              <span className="text-[10px] text-[oklch(0.40_0.006_250)]">
                                {r.readingTime} min
                              </span>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* Quick CTA */}
                <div className="card-panel p-5 text-center border-[oklch(0.55_0.12_155/20%)] relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-[oklch(0.55_0.12_155/8%)] to-transparent" />
                  <div className="relative">
                    <Zap className="w-7 h-7 text-[oklch(0.55_0.12_155)] mx-auto mb-2" />
                    <h3 className="text-xs font-heading text-white tracking-wide mb-1">Try the Simulator</h3>
                    <p className="text-[10px] text-[oklch(0.50_0.008_250)] mb-3">
                      Practice troubleshooting in a safe virtual environment
                    </p>
                    <Link
                      href="/simulator"
                      className="inline-flex items-center gap-1.5 px-4 py-2 btn-primary text-xs font-medium rounded"
                    >
                      Launch Simulator
                    </Link>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </section>
      </div>
    </>
  );
}
