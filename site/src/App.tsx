import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Background } from "./components/Background";
import { ChatWidget } from "./components/ChatWidget";

import { useIsMobile } from "./hooks/useIsMobile";
import { FakeAds } from "./components/FakeAds";
import { PerformanceWidget } from "./components/PerformanceWidget";
import {
  useCheckpointValue,
  useRegisterCheckpoints,
} from "./hooks/usePerformanceCheckpoint";

import { Info } from "./pages/Info";
import { Home } from "./pages/Home";
import { Resume } from "./pages/Resume";
import { type CheckpointItem } from "./lib/performanceStore";

const allPages: { label: string; component: () => React.JSX.Element }[] = [
  { label: "127.0.0.1", component: Home },
  { label: "Résumé", component: Resume },
  // { label: "Info", component: Info },
];

const allCheckpoints: CheckpointItem[] = [
  { tag: "Conway", percentage: 20 },
  { tag: "Fluid", percentage: 50 },
  { tag: "Void", percentage: 0, invert: true },
  { tag: "🐔🥚", percentage: 60 },
  { tag: "Ads", percentage: 80 },
  { tag: "Red Button", percentage: 30 },
];
export const App = () => {
  const isMobile = useIsMobile();
  const [page, setPage] = useState<string>(allPages[0].label);
  const pageVariants = usePageAnimation(page);

  useRegisterCheckpoints(allCheckpoints);

  const isVoid = useCheckpointValue("Void");

  const CurrentPage = allPages.find(({ label }) => label === page)!.component;

  return (
    <div className="h-screen w-screen text-text">
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
              className={`flex flex-col relative bg-(--bg-a20) pointer-events-auto isolate ${
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
                  {allPages.map(({ label }) => (
                    <button
                      key={`page-${label}`}
                      type="button"
                      onClick={() => setPage(label)}
                      className={`text-lg capitalize transition hover:underline ${
                        label === page
                          ? "text-accent"
                          : "text-muted) hover:text-text"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </nav>

              <CurrentPage />
            </div>
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
};

const usePageAnimation = (page: string) => {
  const prevRef = useRef(page);

  const prev = prevRef.current;
  const prevIndex = allPages.findIndex(({ label }) => label === prev);
  const nextIndex = allPages.findIndex(({ label }) => label === page);

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
