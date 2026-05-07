import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Background } from "./components/Background";
import { ChatWidget } from "./components/ChatWidget";
import { Home } from "./pages/Home";
import { Resume } from "./pages/Resume";
import { useIsMobile } from "./hooks/useIsMobile";
import { FakeAds } from "./components/FakeAds";
import { PerformanceWidget } from "./components/PerformanceWidget";
import { usePerformanceCheckpointValue } from "./hooks/usePerformanceCheckpoint";

type Page = "home" | "resume";

const pages: [string, Page][] = [
  ["127.0.0.1", "home"],
  ["Résumé", "resume"],
];

export const App = () => {
  const [page, setPage] = useState<Page>("home");

  const isMobile = useIsMobile();
  const pageVariants = usePageAnimation(page);
  const isVoid = usePerformanceCheckpointValue("Void", true);

  return (
    <div className="h-screen w-screen text-[var(--text)]">
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
        <PerformanceWidget />
        <ChatWidget />
      </div>
      <FakeAds />
      <Background />
      <main
        className="relative z-20 pointer-events-none"
        style={{
          display: isVoid ? "none" : "",
        }}
      >
        <AnimatePresence mode="popLayout">
          <motion.div
            key={`motion-page-${page}`}
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.42, ease: "anticipate" }}
          >
            <div
              className={`flex flex-col relative bg-[#0003] pointer-events-auto isolate ${
                isMobile
                  ? "w-full h-[120vh]"
                  : "w-[60%] m-auto h-[90vh] mt-[5vh] rounded-xl"
              }`}
              style={{
                backdropFilter: "blur(15px) brightness(0.2)",
              }}
            >
              {/* Navigation */}
              <nav className="items-center justify-end px-[3rem] pt-[2rem] mb-2 w-full flex">
                <div className="flex items-center gap-6">
                  {pages.map(([label, p]) => (
                    <button
                      key={`page-${p}`}
                      type="button"
                      onClick={() => setPage(p)}
                      className={`text-lg capitalize transition hover:underline ${
                        p === page
                          ? "text-[var(--accent)]"
                          : "text-[var(--muted)] hover:text-[var(--text)]"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </nav>

              {/* Content */}
              {page === "home" ? <Home /> : <Resume />}
            </div>
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
};

// prevents effect changing mid-transition
let timeoutID = 0;
const usePageAnimation = (page: Page) => {
  const [debounced, setDebounced] = useState(page);

  useEffect(() => {
    clearTimeout(timeoutID);
    timeoutID = setTimeout(() => {
      setDebounced(page);
    }, 500);
  }, [page]);

  return useMemo(() => {
    const w = window.innerWidth * (debounced === "home" ? -1 : 1);
    return {
      // initial: { opacity: 0.5, x: w },
      // animate: { opacity: 1, x: 0 },
      // exit: { opacity: 0.5, x: -w },

      initial: { x: w },
      animate: { x: 0 },
      exit: { x: -w },
    };
  }, [debounced]);
};
