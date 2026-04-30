import { useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { Background } from "./components/Background"
import { Navigation } from "./components/Navigation"
import { Home } from "./Home"
import { Resume } from "./pages/Resume"

export type Page = "home" | "resume"

const pageVariants = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
}

export const App = () => {
  const [page, setPage] = useState<Page>("home")

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
            transition={{ duration: 0.25, ease: "easeOut" }}
          >
            {page === "home" ? <Home /> : <Resume />}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  )
}
