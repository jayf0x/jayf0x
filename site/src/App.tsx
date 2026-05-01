import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Background } from "./components/Background";
import { Home } from "./pages/Home";
import { Resume } from "./pages/Resume";
import { useIsMobile } from "./hooks/useIsMobile";

type Page = "home" | "resume";

const pages: [string, Page][] = [
  ["127.0.0.1", "home"],
  ["Résumé", "resume"],
];

export const App = () => {
  const [page, setPage] = useState<Page>("home");

  const isMobile = useIsMobile();

  const pageVariants = useMemo(() => {
    const w = window.innerWidth * (page === "home" ? 1 : -1);
    return {
      initial: { opacity: 0.5, x: w },
      animate: { opacity: 1, x: 0 },
      exit: { opacity: 0.5, x: -w },
    };
  }, [page]);

  return (
    <div className="min-h-screen w-full text-[var(--text)]">
      <Background />
      <main className="relative z-10">
        <AnimatePresence mode="popLayout">
          <motion.div
            key={`motion-page-${page}`}
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.24, ease: "circInOut" }}
          >
            <div
              className={`flex flex-col relative ${
                isMobile
                  ? "w-full h-[120vh]"
                  : "min-w-[60%] w-fit m-auto h-[90vh] mt-[5vh] rounded-xl"
              }`}
              style={{
                backdropFilter: "blur(15px) brightness(0.2)",
              }}
            >
              {/* Navigation */}
              <nav className="items-center justify-between px-6 py-8 mb-5 w-full flex">
                <button
                  type="button"
                  onClick={() => setPage("home")}
                  className="font-mono text-sm font-semibold text-[var(--accent)] transition hover:text-[var(--accent)]"
                >
                  Jayf0x
                </button>
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
