import { motion } from "framer-motion"
import { TypeAnimation } from "react-type-animation"
import { Github, ChevronDown, Mail } from "lucide-react"
import type { Project } from "../types/project"

const GITHUB_URL = "https://github.com/jayf0x"

const terminalLines = [
  "builds real-time 3D annotation projection",
  "ships WebGL shader tooling",
  "automates repetitive workflows",
  "writes UI that stays fast under load",
]

export const HeroSection = ({ featured }: { featured: Project[] }) => {
  return (
    <section id="hero" className="relative flex min-h-screen flex-col justify-center gap-12 px-6 pb-16 pt-20">
      <motion.div
        initial={{ opacity: 0, y: 28 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className="mx-auto flex max-w-5xl flex-col gap-6 text-left"
      >
        <motion.h1
          className="text-6xl font-black tracking-tighter text-[var(--text)] md:text-8xl"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          Jonatan Vons
        </motion.h1>

        <motion.div
          className="font-mono text-sm text-[var(--muted)] md:text-base"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <span>~/code</span> <span className="text-[var(--accent)]">❯</span> cat about.txt
          <div className="mt-2 min-h-[2.5rem] text-[var(--accent)]">
            <TypeAnimation
              sequence={[
                terminalLines[0],
                1200,
                terminalLines[1],
                1200,
                terminalLines[2],
                1200,
                terminalLines[3],
                1200,
              ]}
              wrapper="span"
              speed={65}
              repeat={Infinity}
              className="inline-block"
            />
            <span className="ml-1 inline-block h-4 w-[2px] animate-blink bg-[var(--accent)] align-middle" />
          </div>
        </motion.div>

        <motion.p
          className="max-w-2xl text-base leading-relaxed text-[var(--muted)]"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
        >
          Frontend engineer in Ghent. I build interfaces that render fast and hold up.
        </motion.p>

        <motion.div
          className="flex items-center gap-3"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.0 }}
        >
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-sm font-medium text-[var(--text)] transition hover:border-[var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
          >
            <Github size={16} />
            GitHub
          </a>
          <a
            href="mailto:jonatan.vons@gmail.com"
            className="inline-flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-sm font-medium text-[var(--text)] transition hover:border-[var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
          >
            <Mail size={16} />
            Email
          </a>
        </motion.div>
      </motion.div>

      <motion.div
        className="mx-auto grid w-full max-w-5xl grid-cols-1 gap-4 md:grid-cols-3"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 1.1 }}
      >
        {featured.map((project) => (
          <a
            key={project.name}
            href="#projects"
            className="group rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 transition hover:border-[var(--accent)]"
          >
            <p className="text-xs font-mono text-[var(--muted)]">
              {project.language ?? project.tags[0]} · {project.pushedAt ?? "active"}
            </p>
            <p className="mt-2 text-lg font-semibold text-[var(--text)]">{project.name}</p>
            <p className="mt-1 text-sm text-[var(--muted)]">{project.description}</p>
            <div className="mt-4 text-xs font-medium uppercase tracking-wide text-[var(--accent)]">
              Open Projects
            </div>
          </a>
        ))}
      </motion.div>

      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-[var(--muted)]">
        <ChevronDown size={22} className="animate-bounce" />
      </div>
    </section>
  )
}
