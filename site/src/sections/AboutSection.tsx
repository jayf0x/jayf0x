import { Layers, Box, Terminal } from "lucide-react"
import { motion } from "framer-motion"

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.55, delay, ease: "easeOut" as const },
})

const items = [
  {
    title: "3D in the browser",
    icon: Box,
    copy: "Built real-time projection of 3D annotations into 2D browser space at Bricsys using React and CSS transforms across a shared monorepo.",
  },
  {
    title: "The TanStack practitioner",
    icon: Layers,
    copy: "Daily stack includes TanStack Query, Form, and Router. Added form validation to the internal Bricsys component library with strong UX constraints.",
  },
  {
    title: "Tools that automate themselves",
    icon: Terminal,
    copy: "Built PIIPAYA for PII anonymization, Pure-Paste for URL hygiene, and a Git to timesheet automation pipeline for repetitive reporting.",
  },
]

export const AboutSection = () => (
  <section id="about" className="px-6 py-32">
    <div className="mx-auto max-w-5xl space-y-10">
      <motion.h2 {...fadeUp()} className="text-3xl font-bold text-[var(--text)] md:text-4xl">
        About
      </motion.h2>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {items.map((item, index) => {
          const Icon = item.icon
          return (
            <motion.article
              key={item.title}
              {...fadeUp(index * 0.05)}
              className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6"
            >
              <Icon size={18} className="mb-4 text-[var(--accent)]" />
              <h3 className="mb-3 text-lg font-semibold text-[var(--text)]">{item.title}</h3>
              <p className="text-sm leading-relaxed text-[var(--muted)]">{item.copy}</p>
            </motion.article>
          )
        })}
      </div>
    </div>
  </section>
)
