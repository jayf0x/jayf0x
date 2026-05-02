import { PropsWithChildren, useEffect, useMemo, useRef, useState } from "react";
import { useIsMobile } from "../hooks/useIsMobile";
import { TypeAnimation } from "react-type-animation";

const IMG_FILTERS = [
  "none",
  "sepia(0.65)",
  "hue-rotate(60deg) saturate(1.8)",
  "brightness(1.2) contrast(1.15)",
  "hue-rotate(200deg) saturate(1.4)",
];

const FloatingPanel = ({
  children,
  style,
}: PropsWithChildren<{
  style: React.CSSProperties;
}>) => {
  const seed = useMemo(() => Math.random() * 10, []);
  const w = window.innerWidth / 8
  const h = window.innerHeight / 3 

  return (
    <div
      className="ad-float fixed z-20 rounded-lg overflow-hidden shadow-2xl"
      style={{
        background: "#22c55e30",
        animationDelay: `${seed.toFixed(1)}s`,
        width: w,
        height: h,
        ...style,
      }}
    >
      {children}
    </div>
  );
};

export const FakeAds = () => {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <div
        className="fixed bottom-0 left-0 right-0 z-20 flex items-center justify-center overflow-hidden"
        style={{ background: "#22c55e", height: "48px" }}
      >
        <span className="text-black font-extrabold text-sm text-center px-4 whitespace-nowrap">
          🎉 YOU ARE THE 1,000,000TH VISITOR! TAP TO CLAIM YOUR FREE GIFT! 🎉
        </span>
      </div>
    );
  }

  return (
    <>
      <FloatingPanel style={{ left: "1.5vw", top: "14vh" }}>
        <MatrixRain />
      </FloatingPanel>
      <FloatingPanel style={{ left: "1.5vw", bottom: "12vh" }}>
        <IdyllicLandscape />
      </FloatingPanel>
      <FloatingPanel style={{ right: "1.5vw", top: "14vh" }}>
        <Win98Ad />
      </FloatingPanel>
      <FloatingPanel style={{ right: "1.5vw", top: "50vh" }}>
        <DownloadRamAd />
      </FloatingPanel>
    </>
  );
};

// ── Matrix Rain ───────────────────────────────────────────────────────────────

const MatrixRain = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const { width, height } = container.getBoundingClientRect();
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    const alphabet =
      "アァカサタナハマヤャラワガザダバパイィキシチニヒミリヰギジヂビピウゥクスツヌフムユュルグズブヅプエェケセテネヘメレヱゲゼデベペオォコソトノホモヨョロヲゴゾドボポヴッンABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    const fontSize = 13;
    const columns = Math.floor(width / fontSize);
    const drops = new Array(columns).fill(0);

    function draw() {
      ctx.fillStyle = "rgba(0,0,0,0.42)";
      ctx.fillRect(0, 0, width, height);
      ctx.font = `${fontSize}px monospace`;
      for (let i = 0; i < drops.length; i++) {
        const bright = Math.random() > 0.92;
        ctx.fillStyle = bright ? "#afffbf" : "#00cc44";
        const char = alphabet[Math.floor(Math.random() * alphabet.length)];
        ctx.fillText(char, i * fontSize, drops[i] * fontSize);
        if (drops[i] * fontSize > height && Math.random() > 0.975) drops[i] = 0;
        drops[i]++;
      }
    }

    const id = setInterval(() => requestAnimationFrame(draw), 150);
    return () => clearInterval(id);
  }, []);

  return (
    <div ref={containerRef} className="relative size-full bg-black">
      <canvas ref={canvasRef} className="absolute inset-0 size-full" />

      {/* gradient overlay so text is legible */}
      <div
        className="absolute inset-0 flex flex-col justify-between p-3 pointer-events-none"
        style={{
          background:
            "linear-gradient(to bottom, rgba(0,0,0,0.55) 0%, transparent 40%, rgba(0,0,0,0.75) 70%)",
        }}
      >
        {/* top badge */}
        <div className="flex items-center gap-1.5">
          <span
            className="text-[9px] font-bold px-1.5 py-0.5 rounded-sm tracking-widest uppercase"
            style={{ background: "#f54", color: "#000" }}
          >
            LIVE
          </span>
          <span className="text-[#00cc44] text-[10px] font-mono opacity-70">
            MARKET FEED
          </span>
        </div>

        {/* bottom CTA */}
        <div>
          <TypeAnimation
            sequence={["RED", 2200, "RED −50%", 2000, "BUY RED", 2200]}
            speed={20}
            repeat={Infinity}
            omitDeletionAnimation
            className="font-black text-2xl leading-none block"
            style={{ color: "#f54", textShadow: "0 0 12px #f543" }}
          />
          <p className="text-white/70 text-[11px] mt-0.5">
            Trade crypto. Break free.
          </p>
          <span
            className="mt-2 inline-block text-[10px] font-bold px-2.5 py-1 rounded"
            style={{ background: "#f54", color: "#000" }}
          >
            Trade Now →
          </span>
        </div>
      </div>
    </div>
  );
};

// ── Idyllic Landscape ─────────────────────────────────────────────────────────

const IdyllicLandscape = () => {
  const [filterIdx, setFilterIdx] = useState(0);

  useEffect(() => {
    const id = setInterval(
      () => setFilterIdx((i) => (i + 1) % IMG_FILTERS.length),
      4500,
    );
    return () => clearInterval(id);
  }, []);

  return (
    <a
      href="https://github.com/jayf0x/js-canvas"
      target="_blank"
      rel="noreferrer"
      className="relative block size-full overflow-hidden"
    >
      <img
        className="absolute inset-0 w-full h-full object-cover"
        src="https://raw.githubusercontent.com/jayf0x/js-canvas/main/previews/trees.gif"
        style={{
          filter: IMG_FILTERS[filterIdx],
          transition: "filter 1.4s ease",
        }}
      />
      <div
        className="absolute inset-0 flex flex-col justify-end p-3"
        style={{
          background:
            "linear-gradient(to top, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.1) 55%, transparent 100%)",
        }}
      >
        <p className="text-white font-bold text-sm leading-snug">
          Travel to Edo Japan in 2D!
        </p>
        <p className="text-white/55 text-[10px] mt-0.5">
          jayf0x/js-canvas — play it now →
        </p>
      </div>
    </a>
  );
};

// ── Windows 98 ────────────────────────────────────────────────────────────────

const Win98Ad = () => (
  <a
    href="https://98.js.org/"
    target="_blank"
    rel="noreferrer"
    className="block size-full select-none"
    style={{ background: "#c0c0c0", fontFamily: "Arial, sans-serif" }}
  >
    {/* title bar */}
    <div
      className="flex items-center justify-between px-1.5 py-0.5"
      style={{
        background: "linear-gradient(90deg, #000082 0%, #1084d0 100%)",
        height: "22px",
      }}
    >
      <div className="flex items-center gap-1">
        <span className="text-[10px]">🌐</span>
        <span className="text-white text-[11px] font-bold">
          Windows 98
        </span>
      </div>
      <div className="flex gap-0.5">
        {["_", "□", "✕"].map((c) => (
          <span
            key={c}
            className="flex items-center justify-center text-black text-[9px] font-bold"
            style={{
              width: 16,
              height: 14,
              background: "#c0c0c0",
              borderTop: "1px solid #fff",
              borderLeft: "1px solid #fff",
              borderRight: "1px solid #808080",
              borderBottom: "1px solid #808080",
            }}
          >
            {c}
          </span>
        ))}
      </div>
    </div>

    {/* body */}
    <div className="flex flex-col items-center justify-center gap-2 p-3 h-[calc(100%-22px)]">
      <div className="text-3xl">💾</div>
      <p
        className="text-center text-[13px] font-bold text-black leading-tight"
        style={{ fontFamily: "Arial, sans-serif" }}
      >
        Visit the past!
      </p>
      <p className="text-center text-[10px] text-[#333] leading-snug px-1">
        Human-made technology.
      </p>
      <div
        className="mt-1 px-4 py-1 text-[11px] font-bold text-black text-center hover:scale-110 transition-transform"
        style={{
          background: "#c0c0c0",
          borderTop: "2px solid #ffffff",
          borderLeft: "2px solid #ffffff",
          borderRight: "2px solid #808080",
          borderBottom: "2px solid #808080",
        }}
      >
        Click Here!
      </div>
    </div>
  </a>
);

// ── Download More RAM ─────────────────────────────────────────────────────────

const DownloadRamAd = () => {
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (done) return;
    const id = setInterval(() => {
      setProgress((p) => {
        const next = p + Math.random() * 7 + 1;
        if (next >= 100) {
          setDone(true);
          return 100;
        }
        return next;
      });
    }, 280);
    return () => clearInterval(id);
  }, [done]);

  return (
    <div
      className="size-full flex flex-col items-center justify-center gap-2 p-4 cursor-pointer select-none"
      style={{ background: "#05050f", color: "#00ff88" }}
      onClick={() => {
        setProgress(0);
        setDone(false);
      }}
    >
      <p className="font-mono text-[9px] text-[#00ff88]/40 tracking-widest uppercase">
        // system utility v2.0
      </p>
      <p
        className="font-black text-lg text-center leading-tight"
        style={{
          color: "#00ff88",
          textShadow: "0 0 10px #00ff8866",
        }}
      >
        DOWNLOAD
        <br />
        MORE RAM
      </p>

      {/* progress bar */}
      <div
        className="w-full h-2 rounded-full overflow-hidden mt-1"
        style={{
          background: "rgba(0,255,136,0.1)",
          border: "1px solid rgba(0,255,136,0.2)",
        }}
      >
        <div
          className="h-full rounded-full"
          style={{
            width: `${Math.min(progress, 100)}%`,
            background: "linear-gradient(90deg, #00cc66, #00ff88)",
            transition: "width 0.28s ease",
            boxShadow: "0 0 6px #00ff8880",
          }}
        />
      </div>

      <p className="font-mono text-[10px] text-[#00ff88]/60">
        {done ? "✓ 16 GB installed!" : `${Math.min(Math.round(progress), 100)}% downloading...`}
      </p>
      {done && (
        <p className="text-[9px] text-[#00ff88]/35">tap to install again</p>
      )}
    </div>
  );
};
