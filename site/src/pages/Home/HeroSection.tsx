import { motion } from "framer-motion";
import { TypeAnimation } from "react-type-animation";
import { useIsMobile } from "@/hooks/useIsMobile";
import { memo } from "react";

const terminalLines = [
  "Frontend engineer++",
  "Friction > Problem > Solution",
  "Bridging users and tech",
  // "builds real-time 3D annotation projection",
  "Frontend Engineering ☕",
  // "solarsystem in CSS",
  "Quality > Speed ",
  "Challenge me: www.chess.com/member/chaos_70b",
  "('b' + 'a' + + 'a' + 'a').toLowerCase()",
  "Status 418 ☕",
  "2B||!2B",
].flatMap((l) => [l, 4000]);

export const HeroSection = () => {
  const isMobile = useIsMobile();
  return (
    <section className="flex flex-col justify-center px-6 pb-8 w-full text-nowrap">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="mx-auto flex max-w-3xl flex-col gap-5 w-full text-center"
      >
        <motion.div
          className="w-full center"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          {!isMobile && (
            <div className="lg:text-5xl sm:text-xl font-black tracking-tighter text-[var(--text)]">
              <TextWithSecret text="Jonatan" secret="JayF0x" />
            </div>
          )}
        </motion.div>

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
      </motion.div>
    </section>
  );
};

export const TextWithSecret = memo(
  ({ text, secret }: { text: string; secret: string }) => {
    const N = Math.max(text.length, secret.length);

    const textStart = Math.floor((N - text.length) / 2);
    const secretStart = Math.floor((N - secret.length) / 2);

    const delays = Array.from({ length: N }).map(
      (_, i) => i * 28 + Math.random() * 70,
    );

    const textSlots = Array.from({ length: N }).map((_, i) => {
      const char = text[i - textStart];
      return char === undefined ? "\u00A0" : char;
    });

    const secretSlots = Array.from({ length: N }).map((_, i) => {
      const char = secret[i - secretStart];
      return char === undefined ? "\u00A0" : char;
    });

    return (
      <div className="group inline-block cursor-pointer select-none font-mono">
        {Array.from({ length: N }).map((_, i) => {
          return (
            <span
              key={i}
              className="relative inline-block pointer-events-none [perspective:700px]"
              style={{ width: "0.7em" }}
            >
              <span
                className="relative block [transform-style:preserve-3d] transition-transform duration-500 ease-[cubic-bezier(.2,.8,.2,1)] group-hover:[transform:rotateX(180deg)]"
                style={{
                  transitionDelay: `${delays[i]}ms`,
                }}
              >
                <span className="block [backface-visibility:hidden]">
                  {textSlots[i] === " " ? "\u00A0" : textSlots[i]}
                </span>
                <span className="absolute inset-0 block [transform:rotateX(180deg)] [backface-visibility:hidden]">
                  {secretSlots[i] === " " ? "\u00A0" : secretSlots[i]}
                </span>
              </span>
            </span>
          );
        })}
      </div>
    );
  },
);
