/**
 * GlossaryTooltip — Inline terminology tooltips with micro-lessons
 * 
 * Scans text for glossary terms and wraps them in tappable tooltips.
 * For New Techs: shows visual state diagrams (NC/NO in both states).
 * For Experienced/Senior: shows concise definitions.
 * 
 * Renders tooltip inline below the narrative text to avoid
 * z-index conflicts with the split-panel simulator layout.
 */

import { useState, Fragment, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Info } from "lucide-react";
import type { GlossaryTerm, TechRole } from "@/data/scenariosV2";

interface GlossaryTooltipProps {
  text: string;
  glossary: GlossaryTerm[];
  role: TechRole;
}

export default function GlossaryTooltip({ text, glossary, role }: GlossaryTooltipProps) {
  const [activeTerm, setActiveTerm] = useState<GlossaryTerm | null>(null);

  // Build a regex that matches any glossary term or abbreviation
  const termPatterns = glossary.flatMap(g => {
    const patterns = [g.term];
    if (g.abbreviation) patterns.push(g.abbreviation);
    return patterns;
  });

  const handleTermClick = useCallback((term: GlossaryTerm, e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveTerm(prev => prev?.term === term.term ? null : term);
  }, []);

  const handleClose = useCallback(() => {
    setActiveTerm(null);
  }, []);

  if (termPatterns.length === 0) {
    return <span>{text}</span>;
  }

  // Sort by length descending to match longer terms first
  termPatterns.sort((a, b) => b.length - a.length);
  const regex = new RegExp(`\\b(${termPatterns.map(escapeRegex).join("|")})\\b`, "gi");

  // Split text into segments
  const segments: { text: string; term?: GlossaryTerm }[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ text: text.slice(lastIndex, match.index) });
    }
    const matchedText = match[0];
    const term = glossary.find(
      g => g.term.toLowerCase() === matchedText.toLowerCase() ||
           g.abbreviation?.toLowerCase() === matchedText.toLowerCase()
    );
    segments.push({ text: matchedText, term });
    lastIndex = match.index + matchedText.length;
  }
  if (lastIndex < text.length) {
    segments.push({ text: text.slice(lastIndex) });
  }

  return (
    <div className="relative">
      {/* Narrative text with inline term highlights */}
      <span>
        {segments.map((seg, i) => {
          if (seg.term) {
            const isActive = activeTerm?.term === seg.term.term;
            return (
              <button
                key={i}
                onClick={(e) => handleTermClick(seg.term!, e)}
                className={`inline font-mono-industrial underline decoration-dotted transition-colors cursor-help ${
                  isActive
                    ? "text-emerald-300 decoration-emerald-400"
                    : "text-blue-300 decoration-blue-500/50 hover:text-blue-200 hover:decoration-blue-400"
                }`}
                aria-label={`Learn about: ${seg.term.term}`}
              >
                {seg.text}
              </button>
            );
          }
          return <Fragment key={i}>{seg.text}</Fragment>;
        })}
      </span>

      {/* Inline tooltip — renders below the text within the panel flow */}
      <AnimatePresence>
        {activeTerm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden mt-2"
          >
            <div className="bg-[#0a0f0a] border border-emerald-800/30 rounded-lg p-3 shadow-lg">
              <div className="flex items-start justify-between mb-1.5">
                <div className="flex items-center gap-1.5">
                  <Info className="w-3 h-3 text-emerald-400 shrink-0" />
                  <h4 className="font-mono-industrial text-emerald-200 text-[11px] font-bold uppercase tracking-wide">
                    {activeTerm.term}
                    {activeTerm.abbreviation && (
                      <span className="text-emerald-400/60 ml-1 normal-case">({activeTerm.abbreviation})</span>
                    )}
                  </h4>
                </div>
                <button
                  onClick={handleClose}
                  className="text-gray-600 hover:text-white p-0.5 -mr-0.5 -mt-0.5 transition-colors"
                  aria-label="Close tooltip"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>

              <p className="text-gray-300 text-[10px] leading-relaxed">
                {activeTerm.definition}
              </p>

              {/* State diagram for New Techs */}
              {role === "new" && activeTerm.stateDiagram && (
                <div className="bg-[#040604] border border-emerald-900/20 rounded mt-2 p-2">
                  <span className="text-[8px] text-gray-500 uppercase block mb-1.5 font-mono-industrial tracking-wider">
                    State Diagram
                  </span>
                  <div className="grid grid-cols-2 gap-1.5">
                    <div className="text-center">
                      <div className="bg-emerald-950/40 border border-emerald-700/30 rounded p-1.5">
                        <div className="font-mono-industrial text-emerald-300 text-[10px]">
                          {activeTerm.stateDiagram.normalState}
                        </div>
                      </div>
                      <span className="text-[8px] text-emerald-400/70 mt-0.5 block">
                        {activeTerm.stateDiagram.normalLabel}
                      </span>
                    </div>
                    <div className="text-center">
                      <div className="bg-red-950/40 border border-red-700/30 rounded p-1.5">
                        <div className="font-mono-industrial text-red-300 text-[10px]">
                          {activeTerm.stateDiagram.faultState}
                        </div>
                      </div>
                      <span className="text-[8px] text-red-400/70 mt-0.5 block">
                        {activeTerm.stateDiagram.faultLabel}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
