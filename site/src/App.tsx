import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Background } from "./components/Background";
import { ChatWidget } from "./components/ChatWidget";
import { Home } from "./pages/Home";
import { Resume } from "./pages/Resume";
import { useIsMobile } from "./hooks/useIsMobile";
import { FakeAds } from "./components/FakeAds";
import { PerformanceWidget } from "./components/PerformanceWidget";
import { usePerformanceCheckpointValue } from "./hooks/usePerformanceCheckpoint";
import { Info } from "./pages/Info";

type Page = "home" | "resume" | "info";

const pages: [string, Page][] = [
  ["127.0.0.1", "home"],
  ["Résumé", "resume"],
  ["Info", "info"],
];

export const App = () => {
  const isMobile = useIsMobile();
  const [page, setPage] = useState<Page>("home");
  const pageVariants = usePageAnimation(page);
  const isVoid = usePerformanceCheckpointValue("Void", true);

  return (
    <div className="h-screen w-screen text-(--text)">
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
            transition={{ duration: 0.842, ease: "anticipate" }}
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
              
              <nav className="items-center justify-end px-12 pt-8 mb-2 w-full flex">
                <div className="flex items-center gap-6">
                  {pages.map(([label, p]) => (
                    <button
                      key={`page-${p}`}
                      type="button"
                      onClick={() => setPage(p)}
                      className={`text-lg capitalize transition hover:underline ${
                        p === page
                          ? "text-(--accent)"
                          : "text-(--muted) hover:text-(--text)"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </nav>

              {
                (() => {
                  switch (page) {
                    case "home":
                      return <Home />;
                    case "resume":
                      return <Resume />;
                    case "info":
                      return <Info />;
                    default:
                      return <p>You are the anomaly</p>;
                  }
                })()
              }
            </div>
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
};

const usePageAnimation = (page: Page) => {
  const prevRef = useRef<Page>(page);

  const prev = prevRef.current;
  const prevIndex = pages.findIndex(([_, i]) => i === prev);
  const nextIndex = pages.findIndex(([_, i]) => i === page);

  const dir = prevIndex < nextIndex ? 1 : -1;
  const w = typeof window !== "undefined" ? window.innerWidth * dir : 0;

  useEffect(() => {
    prevRef.current = page;
  }, [page]);

  return useMemo(() => {
    return {
      initial: { x: w },
      animate: { x: 0 },
      exit: { x: -w },
    };
  }, [w]);
};
