/**
 * CommandPalette — Sitewide search accessible via Cmd+K / Ctrl+K
 * Uses Fuse.js for fuzzy matching across courses, lessons, labs, scenarios, and pages.
 */
import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import Fuse from "fuse.js";
import {
  Search, BookOpen, Zap, Cpu, Activity, GraduationCap,
  ArrowRight, Command, X, Wrench, FlaskConical, Gauge, FileText
} from "lucide-react";
import { trpc } from "@/lib/trpc";

interface SearchItem {
  id: string;
  title: string;
  description: string;
  category: "course" | "lesson" | "lab" | "simulator" | "page" | "resource" | "tutorial";
  href: string;
  tags: string[];
  synonyms?: string;
}

// Static pages and features
const staticItems: SearchItem[] = [
  { id: "page-home", title: "Home", description: "EASLearn training platform home", category: "page", href: "/", tags: ["home", "start", "landing"] },
  { id: "page-courses", title: "Learn", description: "Browse courses by skill track", category: "page", href: "/courses", tags: ["courses", "training", "learn", "academy"] },
  { id: "page-labs", title: "Simulate", description: "Interactive labs and flagship simulators", category: "lab", href: "/labs", tags: ["labs", "interactive", "hands-on", "simulation", "simulate"] },
  { id: "page-hub-plc", title: "PLC Hub", description: "PLC fundamentals and Conveyor benchmark lab", category: "page", href: "/hubs/plc", tags: ["hub", "plc", "ladder", "conveyor"] },
  { id: "page-hub-vfd", title: "VFD Hub", description: "PowerFlex drive diagnostics and benchmark lab", category: "page", href: "/hubs/vfd", tags: ["hub", "vfd", "powerflex", "drive"] },
  { id: "page-pricing", title: "Pricing", description: "Pro and Team subscription options", category: "page", href: "/pricing", tags: ["pricing", "plans", "subscription", "pro", "team"] },
  { id: "page-enterprise", title: "Enterprise", description: "Team training and employer programs", category: "page", href: "/enterprise", tags: ["enterprise", "team", "employer", "b2b"] },
  { id: "page-simulator", title: "Troubleshooting Simulator", description: "Practice real-world fault scenarios", category: "simulator", href: "/simulator", tags: ["simulator", "troubleshooting", "faults", "practice"] },
  { id: "page-certifications", title: "Certifications", description: "Professional certification programs", category: "page", href: "/certifications", tags: ["certification", "certificate", "credential", "professional"] },
  { id: "page-resources", title: "Resources", description: "Reference materials and downloads", category: "resource", href: "/resources", tags: ["resources", "reference", "downloads", "materials"] },
  { id: "page-mastery", title: "Fault Mastery Map", description: "Track faults you've diagnosed and mastered", category: "page", href: "/mastery", tags: ["mastery", "faults", "competency", "troubleshooting", "progress"] },
  { id: "page-hireready", title: "HireReady Assessments", description: "Team technician competency assessments", category: "page", href: "/hire-ready", tags: ["hireready", "hiring", "assessment", "employer", "team"] },
  { id: "page-free-training", title: "Free Training", description: "Free courses, simulators, and tutorials — no account required", category: "page", href: "/free-training", tags: ["free", "training", "beginner", "tutorial", "no subscription", "open"] },
  { id: "free-plc", title: "Free: PLC Fundamentals Tutorial", description: "Ladder logic basics with interactive simulator", category: "tutorial", href: "/free-training", tags: ["plc", "ladder logic", "free", "tutorial", "beginner", "inputs", "outputs"] },
  { id: "free-maintenance", title: "Free: Maintenance Fundamentals", description: "Electrical, motors, PLC & troubleshooting basics", category: "tutorial", href: "/free-training", tags: ["maintenance", "electrical", "motors", "free", "fundamentals", "ohms law"] },
  { id: "free-rca", title: "Free: Root Cause Analysis", description: "5-Why, Fishbone diagrams & work order writing", category: "tutorial", href: "/free-training", tags: ["root cause", "rca", "5 why", "fishbone", "ishikawa", "free", "work order"] },
  { id: "free-troubleshooting", title: "Free: Troubleshooting Simulator", description: "Practice fault diagnosis with virtual multimeter", category: "tutorial", href: "/free-training", tags: ["troubleshooting", "simulator", "multimeter", "free", "fault", "diagnosis"] },
  { id: "page-vfd-sandbox", title: "VFD Sandbox", description: "Variable frequency drive experimentation lab", category: "lab", href: "/vfd-sandbox", tags: ["vfd", "variable frequency drive", "sandbox", "lab", "powerflex"] },
  // Labs
  { id: "lab-circuit", title: "Circuit Flow Animator", description: "Animated current flow through a basic circuit", category: "lab", href: "/labs#circuit", tags: ["circuit", "current", "flow", "animation", "electrical"] },
  { id: "lab-relay", title: "Relay Simulator", description: "Interactive relay energization and contact states", category: "lab", href: "/labs#relay", tags: ["relay", "energize", "contacts", "coil", "control"] },
  { id: "lab-plc", title: "PLC Logic Visualizer", description: "Ladder logic with live rung evaluation", category: "lab", href: "/labs#plc", tags: ["plc", "ladder logic", "rung", "programmable", "controller"] },
  { id: "lab-ohms", title: "Ohm's Law Calculator", description: "Interactive calculator with circuit response", category: "lab", href: "/labs#ohms", tags: ["ohms law", "voltage", "current", "resistance", "calculator"] },
  { id: "ref-semiconductor", title: "Semiconductor Symbol Reference", description: "Printable quick reference: diode, transistor, thyristor SVG symbols with test procedures", category: "resource", href: "/reference/semiconductor", tags: ["semiconductor", "diode", "transistor", "thyristor", "symbol", "reference", "schematic", "ANSI", "IEEE 315", "print", "SVG"] },
  { id: "page-leaderboard", title: "Leaderboard", description: "XP rankings, training streaks, and top learners", category: "page", href: "/leaderboard", tags: ["leaderboard", "ranking", "streak", "xp", "competition", "top", "score"] },
  { id: "lab-wiring-diagram", title: "Wiring Diagram Reading Lab", description: "Trace circuit paths, identify wire numbers, and find breakers in one-line diagrams", category: "lab", href: "/labs#wiring-diagram", tags: ["wiring", "diagram", "one-line", "three-line", "breaker", "trace", "wire number", "schematic reading"] },
  // Simulator scenarios (static, always available)
  { id: "sim-multi-fault", title: "Multi-Fault Diagnosis", description: "Adaptive multi-fault troubleshooting scenario", category: "simulator", href: "/simulator", tags: ["multi-fault", "diagnosis", "advanced", "troubleshooting"] },
  { id: "sim-vfd-overcurrent", title: "VFD Overcurrent", description: "VFD overcurrent fault scenario", category: "simulator", href: "/simulator", tags: ["vfd", "overcurrent", "fault", "drive", "motor"] },
  { id: "sim-vfd-undervoltage", title: "VFD Undervoltage", description: "VFD undervoltage fault scenario", category: "simulator", href: "/simulator", tags: ["vfd", "undervoltage", "fault", "bus", "voltage"] },
  { id: "sim-vfd-ground-fault", title: "VFD Ground Fault", description: "VFD ground fault detection scenario", category: "simulator", href: "/simulator", tags: ["vfd", "ground fault", "insulation", "leakage"] },
  { id: "sim-vfd-cooling-fan", title: "VFD Cooling Fan Failure", description: "VFD cooling fan fault scenario", category: "simulator", href: "/simulator", tags: ["vfd", "cooling", "fan", "thermal", "overheat"] },
  { id: "sim-vfd-phase-loss", title: "VFD Phase Loss", description: "VFD input phase loss scenario", category: "simulator", href: "/simulator", tags: ["vfd", "phase loss", "input", "power", "three-phase"] },
  { id: "sim-blown-fuse", title: "Blown Fuse Diagnosis", description: "Diagnose and trace blown fuse faults", category: "simulator", href: "/simulator", tags: ["fuse", "blown", "overcurrent", "protection", "trace"] },
  { id: "sim-failed-relay", title: "Failed Relay Diagnosis", description: "Diagnose relay contact failures", category: "simulator", href: "/simulator", tags: ["relay", "failed", "contacts", "coil", "control circuit"] },
  { id: "sim-conveyor-estop", title: "Conveyor E-Stop", description: "Conveyor emergency stop chain troubleshooting", category: "simulator", href: "/simulator", tags: ["conveyor", "e-stop", "emergency", "safety", "chain"] },
];

// Category icons
const categoryIcons: Record<string, React.ReactNode> = {
  course: <BookOpen className="w-4 h-4" />,
  lesson: <FileText className="w-4 h-4" />,
  lab: <FlaskConical className="w-4 h-4" />,
  simulator: <Wrench className="w-4 h-4" />,
  page: <Gauge className="w-4 h-4" />,
  resource: <FileText className="w-4 h-4" />,
  tutorial: <GraduationCap className="w-4 h-4" />,
};

// Keyword aliases for common industrial terms — bidirectional synonym expansion
const KEYWORD_ALIASES: Record<string, string[]> = {
  "drive": ["vfd", "powerflex", "variable frequency drive", "inverter", "ac drive"],
  "vfd": ["drive", "powerflex", "variable frequency drive", "inverter", "ac drive"],
  "powerflex": ["vfd", "drive", "variable frequency drive", "allen-bradley", "525"],
  "inverter": ["vfd", "drive", "powerflex", "variable frequency"],
  "motor": ["vfd", "drive", "overload", "conveyor", "starter", "contactor"],
  "plc": ["ladder logic", "programmable", "controller", "allen-bradley", "logix", "studio 5000"],
  "ladder": ["plc", "ladder logic", "rung", "programmable"],
  "wiring": ["print reading", "schematic", "circuit", "diagram", "electrical prints"],
  "schematic": ["wiring", "print reading", "circuit", "diagram", "electrical prints"],
  "safety": ["loto", "lockout", "e-stop", "arc flash", "tagout"],
  "lockout": ["loto", "safety", "tagout", "lockout tagout"],
  "network": ["ethernet", "industrial networking", "communication", "ethernet/ip"],
  "ethernet": ["network", "communication", "industrial networking", "ethernet/ip"],
  "sensor": ["instrumentation", "thermocouple", "rtd", "4-20ma", "transducer", "transmitter"],
  "instrument": ["sensor", "instrumentation", "thermocouple", "rtd", "4-20ma", "calibration"],
  "fault": ["troubleshooting", "diagnosis", "simulator", "error", "alarm"],
  "troubleshoot": ["fault", "diagnosis", "simulator", "troubleshooting", "repair"],
  "certificate": ["certification", "credential", "badge", "cert"],
  "cert": ["certificate", "certification", "credential", "badge"],
  "test": ["quiz", "assessment", "exam"],
  "quiz": ["test", "assessment", "exam", "questions"],
  "hydraulic": ["fluid power", "hydraulics", "pump", "cylinder", "valve"],
  "pneumatic": ["fluid power", "pneumatics", "air", "compressor", "cylinder"],
  "relay": ["contactor", "coil", "contacts", "control circuit"],
  "contactor": ["relay", "starter", "motor control", "coil"],
  "alignment": ["shaft", "laser", "soft foot", "coupling"],
  "maintenance": ["preventive", "preventative", "pm", "inspection", "lubrication"],
  "pm": ["preventive maintenance", "preventative", "maintenance", "inspection"],
  "overload": ["overcurrent", "motor protection", "thermal", "trip"],
  "breaker": ["circuit breaker", "trip", "overcurrent", "protection"],
  "analog": ["4-20ma", "signal", "instrumentation", "analog signals"],
  "digital": ["discrete", "binary", "on/off", "plc i/o"],
};

const FUSE_OPTIONS = {
  keys: [
    { name: "title", weight: 0.4 },
    { name: "description", weight: 0.2 },
    { name: "tags", weight: 0.35 },
    { name: "synonyms", weight: 0.05 },
  ],
  threshold: 0.45,
  distance: 200,
  includeScore: true,
  minMatchCharLength: 2,
  ignoreLocation: true,
  findAllMatches: true,
};

export default function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const [, navigate] = useLocation();

  // Fetch search index (modules + lessons)
  const { data: searchIndex } = trpc.courses.searchIndex.useQuery(undefined, {
    enabled: isOpen,
    staleTime: 5 * 60_000, // Cache for 5 minutes
  });

  // Build the full search corpus
  const allItems = useMemo(() => {
    const dynamicItems: SearchItem[] = [];

    if (searchIndex) {
      // Build module slug lookup for lesson hrefs
      const moduleSlugMap = new Map<number, string>();
      for (const mod of searchIndex.modules) {
        moduleSlugMap.set(mod.id, mod.slug);
        dynamicItems.push({
          id: `course-${mod.slug}`,
          title: mod.title,
          description: `${mod.totalLessons ?? 0} lessons · ${mod.path === "foundational" ? "Foundational" : "Advanced"} path`,
          category: "course",
          href: `/courses/${mod.slug}`,
          tags: [mod.path, "course", "module", mod.slug.replace(/-/g, " ")],
        });
      }

      for (const lesson of searchIndex.lessons) {
        const modSlug = moduleSlugMap.get(lesson.moduleId);
        if (!modSlug) continue;
        // Inherit module-level tags so equipment terms boost relevant lessons
        const parentMod = searchIndex.modules.find(m => m.id === lesson.moduleId);
        const inheritedTags = parentMod ? [parentMod.slug.replace(/-/g, " "), parentMod.title.toLowerCase()] : [];
        dynamicItems.push({
          id: `lesson-${lesson.id}`,
          title: lesson.title,
          description: `~${lesson.estimatedMinutes} min lesson`,
          category: "lesson",
          href: `/courses/${modSlug}/${lesson.slug}`,
          tags: [lesson.slug.replace(/-/g, " "), "lesson", ...inheritedTags],
        });
      }

      // Add tutorials to search corpus
      if (searchIndex.tutorials) {
        for (const tut of searchIndex.tutorials) {
          const tutTags = Array.isArray(tut.tags) ? (tut.tags as string[]) : [];
          dynamicItems.push({
            id: `tutorial-${tut.slug}`,
            title: tut.title,
            description: tut.metaDescription || `${tut.category} tutorial`,
            category: "tutorial",
            href: `/tutorials/${tut.slug}`,
            tags: ["tutorial", "knowledge base", tut.category, ...tutTags],
          });
        }
      }

      // Add DB scenarios to search corpus (supplement static ones)
      if (searchIndex.scenarios) {
        for (const scen of searchIndex.scenarios) {
          // Skip if already in static items
          const alreadyStatic = staticItems.some(s => s.title.toLowerCase() === scen.title.toLowerCase());
          if (alreadyStatic) continue;
          dynamicItems.push({
            id: `scenario-db-${scen.id}`,
            title: scen.title,
            description: scen.description?.slice(0, 100) || `${scen.category} scenario`,
            category: "simulator",
            href: "/simulator",
            tags: ["scenario", scen.category, scen.difficulty, "troubleshooting"],
          });
        }
      }
    }

    return [...staticItems, ...dynamicItems];
  }, [searchIndex]);

  // Build Fuse index
  const fuse = useMemo(() => new Fuse(allItems, FUSE_OPTIONS), [allItems]);

  // Keyboard shortcut: Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen(true);
      }
      if (e.key === "Escape" && isOpen) {
        e.preventDefault();
        e.stopPropagation();
        setIsOpen(false);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      setQuery("");
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Expand query with aliases for better matching (supports multi-word and partial matches)
  const expandedQuery = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return "";
    // Check exact match first
    if (KEYWORD_ALIASES[q]) {
      return `${q} ${KEYWORD_ALIASES[q].join(" ")}`;
    }
    // Check each word in multi-word queries
    const words = q.split(/\s+/);
    const expansions: string[] = [];
    for (const word of words) {
      if (KEYWORD_ALIASES[word]) {
        expansions.push(...KEYWORD_ALIASES[word]);
      }
    }
    return expansions.length > 0 ? `${q} ${expansions.join(" ")}` : q;
  }, [query]);

  // Filtered results with alias expansion
  const filteredResults = useMemo(() => {
    if (!query.trim()) {
      // Show curated default results when no query
      return allItems.slice(0, 10);
    }
    // Search with original query first, then merge alias results
    const primary = fuse.search(query).slice(0, 15);
    if (expandedQuery !== query.trim().toLowerCase()) {
      const aliasResults = fuse.search(expandedQuery).slice(0, 10);
      const seen = new Set(primary.map(r => r.item.id));
      for (const r of aliasResults) {
        if (!seen.has(r.item.id)) {
          primary.push(r);
          seen.add(r.item.id);
        }
      }
    }
    return primary.slice(0, 15).map((r) => r.item);
  }, [query, expandedQuery, fuse, allItems]);

  // Scroll selected item into view
  useEffect(() => {
    if (resultsRef.current) {
      const selected = resultsRef.current.children[selectedIndex] as HTMLElement;
      selected?.scrollIntoView({ block: "nearest" });
    }
  }, [selectedIndex]);

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, filteredResults.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === "Enter" && filteredResults[selectedIndex]) {
        e.preventDefault();
        const href = filteredResults[selectedIndex].href;
        if (href.includes('#')) {
          // wouter doesn't handle hash fragments, use window.location
          window.location.href = href;
        } else {
          navigate(href);
        }
        setIsOpen(false);
      }
    },
    [filteredResults, selectedIndex, navigate]
  );

  // Reset selection when query changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  return (
    <>
      {/* Trigger button (shown in header) */}
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[oklch(0.10_0.003_250)] border border-[oklch(0.18_0.004_250)] hover:border-[oklch(0.25_0.006_250)] transition-colors text-sm text-[oklch(0.50_0.008_250)] hover:text-white"
        aria-label="Search (Ctrl+K)"
      >
        <Search className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Search...</span>
        <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-[oklch(0.14_0.004_250)] text-[10px] font-mono text-[oklch(0.45_0.008_250)]">
          <Command className="w-2.5 h-2.5" />K
        </kbd>
      </button>

      {/* Modal */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
              onClick={() => setIsOpen(false)}
            />

            {/* Dialog */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              transition={{ duration: 0.2 }}
              className="fixed top-[10%] sm:top-[15%] left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] sm:w-full max-w-lg"
            >
              <div role="dialog" aria-label="Site search" className="bg-[oklch(0.09_0.003_250)] border border-[oklch(0.18_0.004_250)] rounded-xl shadow-2xl overflow-hidden">
                {/* Search Input */}
                <div className="flex items-center gap-3 px-4 py-3 border-b border-[oklch(0.14_0.004_250)]">
                  <Search className="w-5 h-5 text-[oklch(0.45_0.008_250)]" />
                  <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Jump to pages, courses, simulators, labs..."
                    className="flex-1 bg-transparent text-white placeholder:text-[oklch(0.40_0.008_250)] outline-none text-sm"
                  />
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-1 rounded hover:bg-[oklch(0.15_0.003_250)] text-[oklch(0.45_0.008_250)] hover:text-white transition-colors"
                    aria-label="Close search"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Results */}
                <div ref={resultsRef} className="max-h-[50vh] overflow-y-auto py-2" style={{ WebkitOverflowScrolling: "touch", overscrollBehavior: "contain" }}>
                  {filteredResults.length === 0 ? (
                    <div className="px-4 py-8 text-center">
                      <p className="text-sm text-[oklch(0.45_0.008_250)]">No results found for &ldquo;{query}&rdquo;</p>
                      <p className="text-xs text-[oklch(0.35_0.008_250)] mt-1">Try searching for a course, lesson, or scenario name</p>
                    </div>
                  ) : (
                    filteredResults.map((result, index) => (
                      <button
                        key={result.id}
                        onClick={() => {
                          if (result.href.includes('#')) {
                            window.location.href = result.href;
                          } else {
                            navigate(result.href);
                          }
                          setIsOpen(false);
                        }}
                        onMouseEnter={() => setSelectedIndex(index)}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                          index === selectedIndex
                            ? "bg-[oklch(0.55_0.12_155/10%)] text-white"
                            : "text-[oklch(0.65_0.008_250)] hover:bg-[oklch(0.12_0.003_250)]"
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                          index === selectedIndex
                            ? "bg-[oklch(0.55_0.12_155/20%)] text-[oklch(0.55_0.12_155)]"
                            : "bg-[oklch(0.12_0.003_250)] text-[oklch(0.45_0.008_250)]"
                        }`}>
                          {categoryIcons[result.category] || <BookOpen className="w-4 h-4" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{result.title}</p>
                          <p className="text-xs text-[oklch(0.45_0.008_250)] truncate">{result.description}</p>
                        </div>
                        <span className="text-[10px] uppercase tracking-wider text-[oklch(0.40_0.008_250)] font-mono shrink-0">
                          {result.category}
                        </span>
                        {index === selectedIndex && (
                          <ArrowRight className="w-3.5 h-3.5 text-[oklch(0.55_0.12_155)] shrink-0" />
                        )}
                      </button>
                    ))
                  )}
                </div>

                {/* Footer */}
                <div className="px-4 py-2 border-t border-[oklch(0.14_0.004_250)] flex items-center gap-4 text-[10px] text-[oklch(0.40_0.008_250)]">
                  <span className="flex items-center gap-1">
                    <kbd className="px-1 py-0.5 rounded bg-[oklch(0.14_0.004_250)] font-mono">↑↓</kbd> Navigate
                  </span>
                  <span className="flex items-center gap-1">
                    <kbd className="px-1 py-0.5 rounded bg-[oklch(0.14_0.004_250)] font-mono">↵</kbd> Open
                  </span>
                  <span className="flex items-center gap-1">
                    <kbd className="px-1 py-0.5 rounded bg-[oklch(0.14_0.004_250)] font-mono">Esc</kbd> Close
                  </span>
                  <span className="ml-auto">
                    {allItems.length} items indexed
                  </span>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
