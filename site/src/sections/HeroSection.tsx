import { motion } from "framer-motion"
import { TypeAnimation } from "react-type-animation"
import { Github, Mail } from "lucide-react"

const GITHUB_URL = "https://github.com/jayf0x"

const terminalLines = [
  "builds real-time 3D annotation projection",
  "ships WebGL shader tooling",
  "automates repetitive workflows",
  "writes UI that stays fast under load",
]

export const HeroSection = () => {
  return (
    <section className="flex min-h-[55vh] flex-col justify-center px-6 pb-8 pt-24">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="mx-auto flex max-w-3xl flex-col gap-5"
      >
        <motion.h1
          className="text-6xl font-black tracking-tighter text-[var(--text)] md:text-8xl"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          {/* <TypeAnimation
              sequence={["Jonatan Verstraete", 4000, "Jayf0x", 4000]}
              wrapper="span"
              speed={1}
              repeat={Infinity}
              omitDeletionAnimation
              preRenderFirstString
            /> */}
          Jonatan Verstraete
        </motion.h1>

        <motion.div
          className="font-mono text-sm text-[var(--muted)] md:text-base"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <span>~/code</span> <span className="text-[var(--accent)]">❯</span>
          <div className="mt-2 min-h-[2rem] text-[var(--accent)]">
            <TypeAnimation
              sequence={[...terminalLines.flatMap((l) => [l, 1400])]}
              wrapper="span"
              speed={65}
              repeat={Infinity}
            />
            <span className="ml-1 inline-block h-4 w-[2px] animate-blink bg-[var(--accent)] align-middle" />
          </div>
        </motion.div>

        <motion.p
          className="max-w-xl text-base leading-relaxed text-[var(--muted)]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          Frontend engineer in Ghent. I build interfaces that render fast and hold up.
        </motion.p>

        <motion.div
          className="flex items-center gap-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.7 }}
        >
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-sm font-medium text-[var(--text)] transition hover:border-[var(--accent)]"
          >
            <Github size={16} />
            GitHub
          </a>
          <a
            href="mailto:jonatan.vons@gmail.com"
            className="inline-flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-sm font-medium text-[var(--text)] transition hover:border-[var(--accent)]"
          >
            <Mail size={16} />
            Email
          </a>
        </motion.div>
      </motion.div>
    </section>
  )
}
