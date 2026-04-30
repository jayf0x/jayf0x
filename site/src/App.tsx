import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Background } from "./components/Background";
import { Navigation } from "./components/Navigation";
import { Home } from "./Home";
import { Resume } from "./pages/Resume";
import { useIsMobile } from "./hooks/useIsMobile";

export type Page = "home" | "resume";

export const App = () => {
  const [page, setPage] = useState<Page>("home");

  const isMobile = useIsMobile();

  const pageVariants = useMemo(() => {
    const w = (window.innerWidth / 2) * (page === "home" ? 1 : -1);
    return {
      initial: { opacity: 0.5, x: w },
      animate: { opacity: 1, x: 0 },
      exit: { opacity: 0.5, x: -w },
    };
  }, [page]);

  return (
    <div className="min-h-screen w-full text-[var(--text)]">
      <Background />
      <Navigation current={page} onNavigate={setPage} />
      <main className="relative z-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={page}
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.25, ease: "circInOut" }}
          >
            <div
              className={isMobile ? "w-full" : "min-w-[60%] w-fit m-auto"}
              style={{
                backdropFilter: "blur(15px) brightness(0.2)",
              }}
            >
              {page === "home" ? <Home /> : <Resume />}
            </div>
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
};
