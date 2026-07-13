/**
 * Tutorials Page - Premium industrial knowledge base with visual hierarchy
 */
import { useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { trpc } from "@/lib/trpc";
import SEO from "@/components/SEO";
import { Search, Clock, BookOpen, ArrowRight, Filter, X, Zap } from "lucide-react";

const difficultyColors: Record<string, string> = {
  beginner: "bg-[oklch(0.55_0.15_145/12%)] text-[oklch(0.65_0.15_145)] border-[oklch(0.55_0.15_145/25%)]",
  intermediate: "bg-[oklch(0.60_0.15_85/12%)] text-[oklch(0.70_0.15_85)] border-[oklch(0.60_0.15_85/25%)]",
  advanced: "bg-[oklch(0.55_0.15_25/12%)] text-[oklch(0.65_0.15_25)] border-[oklch(0.55_0.15_25/25%)]",
};

const fadeIn = {
  initial: { opacity: 0, y: 15 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.4 }
};

export default function Tutorials() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string | undefined>(undefined);
  const [difficulty, setDifficulty] = useState<string | undefined>(undefined);
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setTimeout(() => setDebouncedSearch(value), 300);
  };

  const { data, isLoading } = trpc.tutorials.list.useQuery({
    search: debouncedSearch || undefined,
    category: category,
    difficulty: difficulty as "beginner" | "intermediate" | "advanced" | undefined,
    limit: 20,
    offset: 0,
  });

  const { data: categories } = trpc.tutorials.getCategories.useQuery();

  const clearFilters = () => {
    setSearch("");
    setDebouncedSearch("");
    setCategory(undefined);
    setDifficulty(undefined);
  };

  const hasFilters = search || category || difficulty;

  return (
    <>
      <SEO
        title="Industrial Automation Tutorials"
        description="Free troubleshooting guides for PowerFlex VFDs, Allen-Bradley PLCs, motors, and industrial control systems. Written by experienced maintenance technicians."
        path="/tutorials"
      />
      <div>
        {/* Hero Section — premium layered */}
        <section className="relative py-20 sm:py-28 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-[oklch(0.12_0.02_155/6%)] via-transparent to-transparent" />
          <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-[oklch(0.55_0.12_155/25%)] to-transparent" />
          
          <div className="container relative">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="max-w-3xl mx-auto text-center"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[oklch(0.55_0.12_155/10%)] border border-[oklch(0.55_0.12_155/20%)] text-xs text-[oklch(0.65_0.10_155)] mb-5">
                <BookOpen className="w-3.5 h-3.5" />
                Free Knowledge Base
              </div>
              <h1 className="text-4xl sm:text-5xl font-heading text-white tracking-wide mb-5">
                Industrial Automation Tutorials
              </h1>
              <p className="text-lg text-[oklch(0.65_0.008_250)] leading-relaxed mb-8">
                Free, in-depth troubleshooting guides for PowerFlex VFDs, Allen-Bradley PLCs, 
                motors, and industrial control systems. Written by experienced maintenance technicians.
              </p>

              {/* Search Bar — premium styled */}
              <div className="relative max-w-xl mx-auto">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[oklch(0.45_0.006_250)]" />
                <input
                  type="text"
                  placeholder="Search tutorials... (e.g., F004 fault, ladder logic, IGBT)"
                  value={search}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 rounded-lg bg-[oklch(0.08_0.003_250)] border border-[oklch(0.18_0.004_250)] text-white placeholder:text-[oklch(0.40_0.006_250)] focus:outline-none focus:border-[oklch(0.55_0.12_155/50%)] focus:shadow-[0_0_15px_oklch(0.55_0.12_155/10%)] transition-all"
                />
              </div>
            </motion.div>
          </div>
          
          <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-[oklch(0.20_0.004_250)] to-transparent" />
        </section>

        {/* Filters + Results */}
        <section className="container py-12">
          {/* Filter Bar — premium chips */}
          <div className="flex flex-wrap items-center gap-3 mb-8">
            <Filter className="w-4 h-4 text-[oklch(0.45_0.006_250)]" />
            
            {/* Category filter */}
            <select
              value={category || ""}
              onChange={(e) => setCategory(e.target.value || undefined)}
              className="px-3 py-2 rounded-lg bg-[oklch(0.09_0.003_250)] border border-[oklch(0.18_0.004_250)] text-sm text-[oklch(0.75_0.008_250)] focus:outline-none focus:border-[oklch(0.55_0.12_155/50%)] transition-colors appearance-none cursor-pointer"
            >
              <option value="">All Categories</option>
              {categories?.map((cat) => (
                <option key={cat.category} value={cat.category}>
                  {cat.category} ({cat.count})
                </option>
              ))}
            </select>

            {/* Difficulty filter */}
            <select
              value={difficulty || ""}
              onChange={(e) => setDifficulty(e.target.value || undefined)}
              className="px-3 py-2 rounded-lg bg-[oklch(0.09_0.003_250)] border border-[oklch(0.18_0.004_250)] text-sm text-[oklch(0.75_0.008_250)] focus:outline-none focus:border-[oklch(0.55_0.12_155/50%)] transition-colors appearance-none cursor-pointer"
            >
              <option value="">All Levels</option>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>

            {hasFilters && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs text-[oklch(0.55_0.12_155)] hover:bg-[oklch(0.55_0.12_155/10%)] transition-colors"
              >
                <X className="w-3.5 h-3.5" />
                Clear
              </button>
            )}

            <span className="ml-auto text-xs text-[oklch(0.45_0.006_250)] font-mono">
              {data?.total || 0} result{(data?.total || 0) !== 1 ? "s" : ""}
            </span>
          </div>

          {/* Tutorial Cards */}
          {isLoading ? (
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="card-panel p-6 animate-pulse">
                  <div className="h-4 bg-[oklch(0.15_0.003_250)] rounded w-1/3 mb-3" />
                  <div className="h-5 bg-[oklch(0.15_0.003_250)] rounded w-full mb-2" />
                  <div className="h-4 bg-[oklch(0.15_0.003_250)] rounded w-2/3 mb-4" />
                  <div className="h-4 bg-[oklch(0.15_0.003_250)] rounded w-full" />
                </div>
              ))}
            </div>
          ) : data?.tutorials.length === 0 ? (
            <div className="text-center py-16">
              <BookOpen className="w-12 h-12 mx-auto text-[oklch(0.35_0.006_250)] mb-4" />
              <h3 className="text-lg font-heading text-white tracking-wide mb-2">No tutorials found</h3>
              <p className="text-sm text-[oklch(0.50_0.008_250)] mb-4">
                Try adjusting your search or filters
              </p>
              <button
                onClick={clearFilters}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-[oklch(0.20_0.004_250)] text-sm text-[oklch(0.65_0.008_250)] hover:border-[oklch(0.55_0.12_155/30%)] transition-colors"
              >
                Clear all filters
              </button>
            </div>
          ) : (
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {data?.tutorials.map((tutorial, i) => (
                <motion.div key={tutorial.id} {...fadeIn} transition={{ duration: 0.3, delay: i * 0.04 }}>
                  <Link href={`/tutorials/${tutorial.slug}`} className="block h-full">
                    <div className="card-panel p-6 h-full group relative overflow-hidden transition-all duration-300 hover:border-[oklch(0.55_0.12_155/30%)] hover:shadow-[0_0_20px_oklch(0.55_0.12_155/6%)]">
                      <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-[oklch(0.55_0.12_155/40%)] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      
                      <div className="flex items-center gap-2 mb-3">
                        <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-medium border ${difficultyColors[tutorial.difficulty]}`}>
                          {tutorial.difficulty}
                        </span>
                        <span className="text-[11px] text-[oklch(0.45_0.006_250)] flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {tutorial.readingTime} min
                        </span>
                      </div>

                      <h3 className="text-sm font-medium text-white mb-2 line-clamp-2 group-hover:text-[oklch(0.55_0.12_155)] transition-colors">
                        {tutorial.title}
                      </h3>

                      <p className="text-xs text-[oklch(0.50_0.008_250)] leading-relaxed mb-4 line-clamp-2">
                        {tutorial.metaDescription}
                      </p>

                      <div className="flex items-center justify-between mt-auto pt-3 border-t border-[oklch(0.13_0.004_250)]">
                        <span className="text-[10px] px-2 py-0.5 rounded bg-[oklch(0.12_0.003_250)] border border-[oklch(0.18_0.004_250)] text-[oklch(0.55_0.008_250)]">
                          {tutorial.category}
                        </span>
                        <ArrowRight className="w-3.5 h-3.5 text-[oklch(0.35_0.006_250)] group-hover:text-[oklch(0.55_0.12_155)] transition-colors" />
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </section>

        {/* CTA Section */}
        <section className="relative py-16 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[oklch(0.08_0.003_250)] to-transparent" />
          <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-[oklch(0.20_0.004_250)] to-transparent" />
          
          <div className="container relative text-center">
            <Zap className="w-8 h-8 text-[oklch(0.55_0.12_155)] mx-auto mb-4" />
            <h2 className="text-2xl font-heading text-white tracking-wide mb-3">
              Ready to Practice What You've Learned?
            </h2>
            <p className="text-[oklch(0.55_0.008_250)] mb-6 max-w-lg mx-auto">
              Put your troubleshooting skills to the test with our interactive simulator. 
              Diagnose real-world faults in a safe, virtual environment.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link
                href="/simulator"
                className="inline-flex items-center gap-2 px-6 py-3 btn-primary text-sm font-medium rounded"
              >
                Try the Simulator
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/pricing"
                className="inline-flex items-center gap-2 px-6 py-3 rounded border border-[oklch(0.20_0.004_250)] text-sm text-[oklch(0.65_0.008_250)] hover:border-[oklch(0.55_0.12_155/30%)] transition-colors"
              >
                View Pro Plans
              </Link>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
