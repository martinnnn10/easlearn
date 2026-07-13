/**
 * FloatingTOC - Floating Table of Contents for lesson content
 * 
 * Mobile: appears as a sticky pill at the bottom that expands into a section jump menu
 * Desktop: appears as a fixed sidebar TOC
 */

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { List, X, ChevronRight } from "lucide-react";

interface TOCSection {
  id: string;
  title: string;
  level: number;
}

interface FloatingTOCProps {
  sections: TOCSection[];
}

export default function FloatingTOC({ sections }: FloatingTOCProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<string>("");

  // Track which section is in view
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        }
      },
      { rootMargin: "-20% 0px -60% 0px" }
    );

    sections.forEach(section => {
      const el = document.getElementById(section.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [sections]);

  const scrollToSection = useCallback((id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      setIsOpen(false);
    }
  }, []);

  if (sections.length === 0) return null;

  return (
    <>
      {/* Mobile: Floating pill button */}
      <div className="fixed bottom-20 right-4 z-50 lg:hidden">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-zinc-900/90 border border-zinc-700/50 backdrop-blur-xl shadow-xl text-sm text-zinc-300 hover:text-white transition-colors"
        >
          {isOpen ? <X className="w-4 h-4" /> : <List className="w-4 h-4" />}
          <span className="text-xs font-medium">Sections</span>
        </button>
      </div>

      {/* Mobile: Expanded section menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-32 right-4 z-50 lg:hidden w-64 max-h-[50vh] overflow-y-auto rounded-xl bg-zinc-900/95 border border-zinc-700/50 backdrop-blur-xl shadow-2xl p-3"
            style={{ WebkitOverflowScrolling: "touch", overscrollBehavior: "contain" }}
          >
            <div className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold px-2 mb-2">Jump to Section</div>
            <div className="space-y-0.5">
              {sections.map(section => (
                <button
                  key={section.id}
                  onClick={() => scrollToSection(section.id)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-colors flex items-center gap-2 ${
                    activeSection === section.id
                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                      : "text-zinc-400 hover:text-white hover:bg-zinc-800/50"
                  }`}
                  style={{ paddingLeft: `${12 + (section.level - 1) * 12}px` }}
                >
                  <ChevronRight className={`w-3 h-3 transition-transform ${activeSection === section.id ? "rotate-90" : ""}`} />
                  {section.title}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Desktop: Fixed sidebar TOC */}
      <div className="hidden lg:block fixed top-32 right-8 w-56 z-40">
        <div className="bg-zinc-900/60 rounded-xl border border-zinc-800 p-4 backdrop-blur-sm">
          <div className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold mb-3">On This Page</div>
          <div className="space-y-0.5">
            {sections.map(section => (
              <button
                key={section.id}
                onClick={() => scrollToSection(section.id)}
                className={`w-full text-left px-2 py-1.5 rounded text-[11px] transition-colors ${
                  activeSection === section.id
                    ? "text-emerald-400 font-medium"
                    : "text-zinc-500 hover:text-zinc-300"
                }`}
                style={{ paddingLeft: `${8 + (section.level - 1) * 10}px` }}
              >
                {section.title}
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
