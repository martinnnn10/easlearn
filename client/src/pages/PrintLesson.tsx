/**
 * Print-Friendly Lesson Mode
 * Renders all lesson cards in a single scrollable page with clean typography
 * for techs who want to study offline or post reference sheets in the shop.
 */
import { useMemo } from "react";
import { useParams, Link } from "wouter";
import { ArrowLeft, Printer } from "lucide-react";
import { getLessonCardDeck, isCardFormatLesson } from "@shared/lessonCardContent";
import { Streamdown } from "streamdown";
import SEO from "@/components/SEO";

/** Strip [[term]] glossary markers for print — just show the term text */
function stripGlossary(text: string): string {
  return text.replace(/\[\[([^\]]+)\]\]/g, "$1");
}

export default function PrintLesson() {
  const params = useParams<{ moduleSlug: string; lessonSlug: string }>();
  const { moduleSlug = "", lessonSlug = "" } = params;

  const deck = useMemo(() => {
    if (!moduleSlug || !lessonSlug) return null;
    if (!isCardFormatLesson(moduleSlug, lessonSlug)) return null;
    return getLessonCardDeck(moduleSlug, lessonSlug);
  }, [moduleSlug, lessonSlug]);

  if (!deck) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-gray-600">This lesson is not available in print format.</p>
          <Link href={`/courses/${moduleSlug}/${lessonSlug}`} className="text-blue-600 underline">
            Return to lesson
          </Link>
        </div>
      </div>
    );
  }

  // Filter out cards that are purely introductory (heading starts with "New to this")
  const contentCards = deck.cards.filter((c) => !c.heading?.startsWith("New to this"));

  return (
    <>
      <SEO title={`${deck.title} — Print`} description={`Printable version of ${deck.title}`} />
      {/* Force light background regardless of site dark theme */}
      <div className="min-h-screen !bg-white !text-gray-900" style={{ backgroundColor: "#ffffff", color: "#111827" }}>
        {/* Screen-only header */}
        <div className="print:hidden sticky top-0 z-50 bg-white border-b border-gray-200 px-4 py-3">
          <div className="max-w-3xl mx-auto flex items-center justify-between">
            <Link href={`/courses/${moduleSlug}/${lessonSlug}`} className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900">
              <ArrowLeft className="w-4 h-4" /> Back to Lesson
            </Link>
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 transition-colors"
            >
              <Printer className="w-4 h-4" /> Print / Save PDF
            </button>
          </div>
        </div>

        {/* Print content */}
        <div className="max-w-3xl mx-auto px-6 py-8 print:px-0 print:py-4">
          {/* Title block */}
          <header className="mb-8 pb-6 border-b border-gray-300">
            <h1 className="text-2xl font-bold text-gray-900 mb-1">{deck.title}</h1>
            <p className="text-sm text-gray-500">
              {deck.cards.length} cards &middot; ~{deck.estimatedMinutes} min read
            </p>
          </header>

          {/* Cards rendered sequentially */}
          <div className="space-y-8">
            {contentCards.map((card, idx) => (
              <section key={card.id} className="break-inside-avoid">
                {/* Card number + heading */}
                <div className="flex items-baseline gap-3 mb-2">
                  <span className="text-xs font-mono text-gray-400 shrink-0">{idx + 1}.</span>
                  {card.heading && (
                    <h2 className="text-lg font-semibold text-gray-900">{stripGlossary(card.heading)}</h2>
                  )}
                </div>

                {/* Card body */}
                {card.body && (
                  <div className="pl-7 text-[15px] leading-relaxed text-gray-700 prose prose-sm max-w-none [&_*]:!text-gray-700 [&_strong]:!text-gray-900">
                    <Streamdown>{stripGlossary(card.body)}</Streamdown>
                  </div>
                )}

                {/* Takeaway */}
                {card.takeaway && (
                  <div className="pl-7 mt-3 p-3 bg-gray-50 border-l-3 border-gray-400 text-sm text-gray-700">
                    <strong className="text-gray-900">Key Point:</strong> {stripGlossary(card.takeaway)}
                  </div>
                )}

                {/* Interaction (show question for print) */}
                {card.kind === "interaction" && card.interaction && (
                  <div className="pl-7 mt-3 p-3 bg-blue-50 rounded text-sm">
                    <p className="font-medium text-gray-900 mb-2">Knowledge Check: {stripGlossary(card.interaction.prompt)}</p>
                    {card.interaction.choices && (
                      <ol className="list-[upper-alpha] pl-5 space-y-1 text-gray-700">
                        {card.interaction.choices.map((choice) => (
                          <li key={choice.id} className={choice.id === card.interaction!.correctChoiceId ? "font-semibold" : ""}>
                            {stripGlossary(choice.label)} {choice.id === card.interaction!.correctChoiceId && <span className="text-green-700">(correct)</span>}
                          </li>
                        ))}
                      </ol>
                    )}
                    {card.interaction.feedbackCorrect && (
                      <p className="mt-2 text-xs text-gray-600 italic">{stripGlossary(card.interaction.feedbackCorrect)}</p>
                    )}
                  </div>
                )}
              </section>
            ))}
          </div>

          {/* Footer */}
          <footer className="mt-12 pt-6 border-t border-gray-300 text-xs text-gray-400 print:mt-8">
            <p>EAS Training Platform &middot; {deck.title} &middot; Printed {new Date().toLocaleDateString()}</p>
          </footer>
        </div>
      </div>

      {/* Print-specific styles */}
      <style>{`
        @media print {
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .print\\:hidden { display: none !important; }
          @page { margin: 1.5cm; }
          /* Hide site nav/footer for print */
          nav, header:not(.print-header), footer:not(.print-footer) { display: none !important; }
        }
      `}</style>
    </>
  );
}
