import { Github, Mail } from "lucide-react"

const year = new Date().getFullYear()

export const FooterSection = () => (
  <footer id="contact" className="px-6 py-12 text-[var(--muted)]">
    <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 border-t border-[var(--border)] pt-8 text-sm">
      <p>Jonatan Vons · Ghent, BE · {year}</p>
      <div className="flex items-center gap-4">
        <a
          href="https://github.com/jayf0x"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 hover:text-[var(--text)]"
        >
          <Github size={14} />
          GitHub
        </a>
        <a href="mailto:jonatan.vons@gmail.com" className="inline-flex items-center gap-1 hover:text-[var(--text)]">
          <Mail size={14} />
          Email
        </a>
      </div>
    </div>
  </footer>
)
