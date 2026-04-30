import { Download } from "lucide-react"
import { motion } from "framer-motion"
import resumeImage from "../assets/resume.png"
import resumePdf from "../assets/resume.pdf"
import { FluidImage } from "@jayf0x/fluidity-js"

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.55, delay, ease: "easeOut" as const },
})

export const ResumeSection = () => (
  <section id="resume" className="border-t border-[var(--border)] px-6 py-32">
    <div className="mx-auto max-w-5xl space-y-8">
      <motion.div {...fadeUp()} className="flex items-center justify-between gap-4">
        <h2 className="text-3xl font-bold text-[var(--text)] md:text-4xl">Resume</h2>
        <a
          href={resumePdf}
          download
          className="inline-flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-sm font-medium text-[var(--text)] transition hover:border-[var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
        >
          <Download size={16} />
          Download PDF
        </a>
      </motion.div>

      <motion.a
        {...fadeUp(0.05)}
        href={resumePdf}
        download
        className="block overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)]"
      >
        <FluidImage
          src={resumeImage}
          config={{
            waterColor: [1, 1, 1],
            splatForce: 0.1,
            splatRadius: 0.001,
            shine: 0
          }}
          // algorithm={"ripple"}
          style={{
            height: "500px",
          }}
          imageSize="contain"
        />
      </motion.a>
    </div>
  </section>
)
