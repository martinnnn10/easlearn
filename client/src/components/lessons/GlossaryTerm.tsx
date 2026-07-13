import { createContext, useContext, useId, useState } from "react";
import { LESSON_GLOSSARY, splitGlossaryMarkers } from "@shared/lessonGlossary";

const GlossaryHighlightContext = createContext<Set<string>>(new Set());

export function GlossaryHighlightProvider({
  terms,
  children,
}: {
  terms: Set<string>;
  children: React.ReactNode;
}) {
  return (
    <GlossaryHighlightContext.Provider value={terms}>{children}</GlossaryHighlightContext.Provider>
  );
}

function GlossaryTermButton({ entry }: { entry: { term: string; definition: string } }) {
  const [open, setOpen] = useState(false);
  const tooltipId = useId();

  return (
    <span className="relative inline">
      <button
        type="button"
        className="glossary-term border-b border-dotted border-[oklch(0.55_0.12_155/60%)] text-[oklch(0.78_0.10_155)] hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[oklch(0.55_0.12_155)] rounded-sm px-0.5"
        aria-describedby={open ? tooltipId : undefined}
        aria-label={`${entry.term}: ${entry.definition}`}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onClick={() => setOpen((v) => !v)}
      >
        {entry.term}
      </button>
      {open && (
        <span
          id={tooltipId}
          role="tooltip"
          className="absolute left-0 top-full z-30 mt-1.5 w-56 max-w-[min(16rem,80vw)] rounded-md border border-[oklch(0.22_0.004_250)] bg-[oklch(0.10_0.003_250)] px-2.5 py-2 text-[11px] leading-relaxed text-[oklch(0.72_0.008_250)] shadow-lg"
        >
          {entry.definition}
        </span>
      )}
    </span>
  );
}

export function GlossaryTerm({ term }: { term: string }) {
  const highlights = useContext(GlossaryHighlightContext);
  const entry = LESSON_GLOSSARY[term.toLowerCase()] ?? LESSON_GLOSSARY[term];
  const label = entry?.term ?? term;

  if (!entry || !highlights.has(term)) {
    return <span>{label}</span>;
  }

  return <GlossaryTermButton entry={entry} />;
}

export function GlossaryText({ text }: { text: string }) {
  const parts = splitGlossaryMarkers(text);
  return (
    <>
      {parts.map((part, i) =>
        part.type === "term" ? (
          <GlossaryTerm key={`${part.value}-${i}`} term={part.value} />
        ) : (
          <span key={`t-${i}`}>{part.value}</span>
        )
      )}
    </>
  );
}
