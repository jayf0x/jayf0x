import { motion } from "framer-motion";
import { TypeAnimation } from "react-type-animation";
import { useIsMobile } from "../../hooks/useIsMobile";

const terminalLines = [
  "Frontend engineer++",
  "Understand the relations between tech and user",
  // "builds real-time 3D annotation projection",
  "Stuff w buttons",
  "Build a solarsystem in CSS",
  "Annoyance with outdates systems = automation",
  "Challenge me: www.chess.com/member/chaos_70b",
  "('b' + 'a' + + 'a' + 'a').toLowerCase()",
].flatMap((l) => [l, 2000]);


const textAsUniqueColor = (text: string) => text.split("").map((char, idx, arr)=> <span style={{color:
  `hsl(${(360/arr.length) * idx}, 40%, 40%)`
}}>{char}</span>)

export const HeroSection = () => {
  const isMobile = useIsMobile()
  return (
    <section className="flex flex-col justify-center px-6 pb-8 w-full text-nowrap">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="mx-auto flex max-w-3xl flex-col gap-5 w-full text-center"
      >
        <motion.h1
          className="w-full center"
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
         {!isMobile && <h1 className="lg:text-5xl sm:text-xl font-black tracking-tighter text-[var(--text)]">
            {textAsUniqueColor('Jonatan Verstraete')}
          </h1>}
        </motion.h1>

        <motion.div
          className="font-mono text-sm text-[var(--muted)] md:text-base"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          {/* <span>~/code</span> <span className="text-[var(--accent)]">❯</span> */}
          <div className="mt-2 min-h-[2rem] text-[var(--accent)]">
            <TypeAnimation
              sequence={terminalLines}
              wrapper="span"
              speed={65}
              repeat={Infinity}
            />
            <span className="ml-1 inline-block h-4 w-[2px] animate-blink bg-[var(--accent)] align-middle" />
          </div>
        </motion.div>
        {/* <motion.div
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
        </motion.div> */}
      </motion.div>
    </section>
  );
};
