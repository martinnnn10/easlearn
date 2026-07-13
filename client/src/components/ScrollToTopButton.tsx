/**
 * ScrollToTopButton — Floating mobile button that appears when user scrolls down
 * Shows after scrolling 400px down, hidden during simulator immersive mode
 */
import { useState, useEffect } from "react";
import { ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function ScrollToTopButton() {
  const [visible, setVisible] = useState(false);
  const [inSimulator, setInSimulator] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setVisible(window.scrollY > 400);
    };

    // Check if simulator immersive container is present
    const observer = new MutationObserver(() => {
      setInSimulator(!!document.querySelector(".sim-immersive-container"));
    });

    observer.observe(document.body, { childList: true, subtree: true });
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
      observer.disconnect();
    };
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Hide during simulator, or when near top
  if (inSimulator) return null;

  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 20 }}
          transition={{ duration: 0.2 }}
          onClick={scrollToTop}
          className="fixed bottom-20 right-4 z-40 w-10 h-10 rounded-full bg-emerald-600/90 text-white shadow-lg shadow-emerald-900/30 backdrop-blur-sm border border-emerald-500/30 flex items-center justify-center hover:bg-emerald-500 transition-colors lg:hidden"
          aria-label="Scroll to top"
        >
          <ChevronUp className="w-5 h-5" />
        </motion.button>
      )}
    </AnimatePresence>
  );
}
