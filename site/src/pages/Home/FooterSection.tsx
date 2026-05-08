import { Github, Linkedin } from "lucide-react"

const year = new Date().getFullYear()

export const FooterSection = () => (
  <footer id="contact" className="px-6 py-3 text-(--muted)">
    <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 border-t border-(--border) pt-5 text-sm">
      <p>Jonatan · Ghent, BE · {year}</p>
      <div className="flex items-center gap-4">
        <a
          href="https://github.com/jayf0x"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 hover:text-(--text)"
        >
          <Github size={14} />
          GitHub
        </a>

           <a
          href="https://www.linkedin.com/in/jonatan-verstraete/"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 hover:text-(--text)"
        >
          <Linkedin size={14} />
          Linkedin
        </a>
        {/* <a href="mailto:jonatan.vons@gmail.com" className="inline-flex items-center gap-1 hover:text-(--text)">
          <Mail size={14} />
          Email
        </a> */}
      </div>
    </div>
  </footer>
)
