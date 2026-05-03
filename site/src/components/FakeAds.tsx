import {
  PropsWithChildren,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useIsMobile } from "../hooks/useIsMobile";
import { TypeAnimation } from "react-type-animation";

// ── Slot rotation ─────────────────────────────────────────────────────────────

type AdComp = React.FC;

// Staggered intervals so swaps don't happen simultaneously
const SLOT_INTERVALS = [14000, 21000, 11000, 27000];

const SLOT_POSITIONS: React.CSSProperties[] = [
  { left: "1.5vw", top: "14vh" },
  { left: "1.5vw", bottom: "12vh" },
  { right: "1.5vw", top: "5vh" },
  { right: "1.5vw", top: "60vh" },
];

type Slot = { Ad: AdComp; v: number };

// ── Shell ─────────────────────────────────────────────────────────────────────

const FloatingPanel = ({
  children,
  style,
}: PropsWithChildren<{ style: React.CSSProperties }>) => {
  const seed = useMemo(() => Math.random() * 10, []);
  const w = window.innerWidth / 8;
  const h = window.innerHeight / 3;

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

// ── Main ──────────────────────────────────────────────────────────────────────

export const FakeAds = () => {
  const isMobile = useIsMobile();

  const [slots, setSlots] = useState<Slot[]>(() => {
    const shuffled = [...AD_POOL].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 4).map((Ad, i) => ({ Ad, v: i }));
  });

  const activeCount = isMobile ? 3 : 4;

  const rotateSlot = useCallback((slotIdx: number) => {
    setSlots((prev) => {
      const othersAds = prev.filter((_, i) => i !== slotIdx).map((s) => s.Ad);
      const available = AD_POOL.filter((a) => !othersAds.includes(a));
      const next = available[Math.floor(Math.random() * available.length)];
      return prev.map((s, i) => (i === slotIdx ? { Ad: next, v: s.v + 1 } : s));
    });
  }, []);

  useEffect(() => {
    const timers = SLOT_INTERVALS.slice(0, activeCount).map((ms, i) =>
      setInterval(() => rotateSlot(i), ms),
    );
    return () => timers.forEach(clearInterval);
  }, [rotateSlot, activeCount]);

  return (
    <div className="fixed size-full inset-0">
      {isMobile ? (
        <div
          className="fixed bottom-0 left-0 right-0 z-20 flex overflow-hidden"
          style={{ height: "25vh" }}
        >
          {slots.slice(0, 3).map((slot, i) => (
            <div key={i} className="relative flex-1 overflow-hidden">
              <slot.Ad />
            </div>
          ))}
        </div>
      ) : (
        <div className="relative size-full">
          {slots.map((slot, i) => (
            <FloatingPanel key={i} style={SLOT_POSITIONS[i]}>
              <slot.Ad />
            </FloatingPanel>
          ))}
        </div>
      )}
    </div>
  );
};

// ── Ad: Matrix / Crypto ───────────────────────────────────────────────────────

const MatrixRain: AdComp = () => (
  <div className="relative size-full bg-black overflow-hidden">
    <img
      className="absolute inset-0 w-full h-full object-cover opacity-80"
      src="https://media3.giphy.com/media/v1.Y2lkPTc5MGI3NjExdjU5N2l2eGo0aWZzbDJnNGFkOWM5Y3cyd3lrbzVtOGwyejk1Mnc5YyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/4heseFMvObk9q/giphy.gif"
    />
    <div
      className="absolute inset-0 flex flex-col justify-between p-3"
      style={{
        background:
          "linear-gradient(to bottom, rgba(0,0,0,0.6) 0%, transparent 40%, rgba(0,0,0,0.8) 65%)",
      }}
    >
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
      <div>
        <TypeAnimation
          sequence={["RED", 2200, "RED -50%", 2000, "BUY RED", 2200]}
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

// ── Ad: Edo Japan / js-canvas ─────────────────────────────────────────────────

const IdyllicLandscape: AdComp = () => (
  <a
    href="https://github.com/jayf0x/js-canvas"
    target="_blank"
    rel="noreferrer"
    className="relative block size-full overflow-hidden"
  >
    <img
      className="absolute inset-0 w-full h-full object-cover"
      src="https://raw.githubusercontent.com/jayf0x/js-canvas/main/previews/trees.gif"
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

// ── Ad: Windows 98 ────────────────────────────────────────────────────────────

const Win98Ad: AdComp = () => (
  <a
    href="https://98.js.org/"
    target="_blank"
    rel="noreferrer"
    className="block size-full select-none"
    style={{ background: "#c0c0c0", fontFamily: "Arial, sans-serif" }}
  >
    <div
      className="flex items-center justify-between px-1.5 py-0.5"
      style={{
        background: "linear-gradient(90deg, #000082 0%, #1084d0 100%)",
        height: "22px",
      }}
    >
      <div className="flex items-center gap-1">
        <span className="text-[10px]">🌐</span>
        <span className="text-white text-[11px] font-bold">Windows 98</span>
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
    <div className="flex flex-col items-center justify-center gap-2 p-3 h-[calc(100%-22px)]">
      <div className="text-3xl">💾</div>
      <p className="text-center text-[13px] font-bold text-black leading-tight">
        Visit the past!
      </p>
      <p className="text-center text-[10px] text-[#333] leading-snug px-1">
        Human-made technology.
        <br />
        Windows 98 — in your browser.
      </p>
      <div
        className="mt-1 px-4 py-1 text-[11px] font-bold text-black text-center"
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

// ── Ad: fluidity — WebGL fluid sim ────────────────────────────────────────────

const FluidityAd: AdComp = () => (
  <a
    href="https://github.com/jayf0x/fluidity"
    target="_blank"
    rel="noreferrer"
    className="relative block size-full overflow-hidden"
    style={{ background: "#04001a" }}
  >
    <div
      className="absolute inset-0 hue_rot"
      style={{
        background:
          "radial-gradient(ellipse at 25% 35%, #7c3aed 0%, transparent 55%), radial-gradient(ellipse at 75% 65%, #0ea5e9 0%, transparent 55%), radial-gradient(ellipse at 50% 80%, #ec4899 0%, transparent 50%)",
        opacity: 0.75,
        animationDuration: "7s",
      }}
    />
    <div
      className="absolute inset-0 flex flex-col justify-end p-3"
      style={{
        background:
          "linear-gradient(to top, rgba(4,0,26,0.92) 0%, transparent 55%)",
      }}
    >
      <p className="text-white font-black text-sm leading-tight">
        Reality, simulated.
      </p>
      <p className="text-white/55 text-[10px] mt-0.5">
        WebGL fluid for React — fluidity →
      </p>
    </div>
  </a>
);

// ── Ad: PIIPAYA — PII anonymizer ──────────────────────────────────────────────

const Redact = ({ w }: { w: number }) => (
  <span
    className="inline-block rounded-sm align-middle mx-0.5"
    style={{
      width: `${w}ch`,
      height: "1em",
      background: "rgba(255,255,255,0.88)",
      verticalAlign: "middle",
    }}
  />
);

const PiipayaAd: AdComp = () => (
  <a
    href="https://github.com/jayf0x/PIIPAYA"
    target="_blank"
    rel="noreferrer"
    className="relative block size-full"
    style={{ background: "#080812" }}
  >
    <div className="size-full flex flex-col items-center justify-center gap-3 p-4">
      <div
        className="w-full rounded-md p-3 font-mono text-[11px] leading-6 text-white/80"
        style={{
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <p>
          Dear <Redact w={7} />,
        </p>
        <p>
          Your <Redact w={5} /> at <Redact w={3} />@<Redact w={5} />
          .com
        </p>
        <p>
          is now <span style={{ color: "#4ade80" }}>anonymous.</span>
        </p>
      </div>
      <div className="text-center">
        <p className="text-white font-bold text-[12px]">PIIPAYA</p>
        <p className="text-white/40 text-[9px]">Local AI doc anonymizer →</p>
      </div>
    </div>
  </a>
);

// ── Ad: audio-bonanza — YouTube audio control ─────────────────────────────────

const BAR_COLORS = [
  "#818cf8",
  "#a78bfa",
  "#c084fc",
  "#e879f9",
  "#f472b6",
  "#fb7185",
  "#fb923c",
  "#fbbf24",
  "#a3e635",
  "#34d399",
  "#22d3ee",
  "#60a5fa",
  "#818cf8",
  "#a78bfa",
];

const AudioBonanzaAd: AdComp = () => {
  const COUNT = 14;
  const [bars, setBars] = useState(() =>
    Array.from({ length: COUNT }, () => 0.1 + Math.random() * 0.8),
  );

  useEffect(() => {
    const id = setInterval(() => {
      setBars(Array.from({ length: COUNT }, () => 0.08 + Math.random() * 0.85));
    }, 320);
    return () => clearInterval(id);
  }, []);

  return (
    <a
      href="https://github.com/jayf0x/audio-bonanza"
      target="_blank"
      rel="noreferrer"
      className="relative block size-full overflow-hidden"
      style={{ background: "#050510" }}
    >
      <div className="absolute bottom-0 left-0 right-0 flex items-end gap-0.5 px-1.5 h-[55%]">
        {bars.map((h, i) => (
          <div
            key={i}
            className="flex-1 rounded-t-sm"
            style={{
              height: `${h * 100}%`,
              background: BAR_COLORS[i % BAR_COLORS.length],
              opacity: 0.9,
              transition: "height 0.32s ease",
            }}
          />
        ))}
      </div>
      <div
        className="absolute inset-0 flex flex-col justify-start p-3"
        style={{
          background:
            "linear-gradient(to bottom, rgba(5,5,16,0.92) 0%, transparent 55%)",
        }}
      >
        <p className="text-white font-black text-sm leading-tight">
          🎵 Your YouTube.
        </p>
        <p className="text-white font-black text-sm leading-tight">
          Your rules.
        </p>
        <p className="text-white/45 text-[10px] mt-1">audio-bonanza →</p>
      </div>
    </a>
  );
};

// ── Ad: Aqtive — keep Mac awake ───────────────────────────────────────────────

const AqtiveAd: AdComp = () => (
  <a
    href="https://github.com/jayf0x/Aqtive"
    target="_blank"
    rel="noreferrer"
    className="block size-full"
    style={{ background: "#0a0f0a" }}
  >
    <div className="size-full flex flex-col items-center justify-center gap-3 p-4">
      <div className="relative">
        <span className="text-4xl">☕</span>
        <span className="absolute -top-0.5 -right-0.5 flex size-3">
          <span className="animate-ping absolute inline-flex size-full rounded-full bg-green-400 opacity-60" />
          <span className="relative inline-flex size-3 rounded-full bg-green-400" />
        </span>
      </div>
      <div className="text-center">
        <p className="text-white font-bold text-sm leading-snug">
          Your Mac won't sleep.
        </p>
        <p className="text-white/70 text-[11px]">Neither will Claude.</p>
      </div>
      <p className="text-white/35 text-[9px]">Aqtive — always on →</p>
    </div>
  </a>
);

// ── Ad: zippit — AES-256 encryption ──────────────────────────────────────────

const ZIPPIT_LINES = [
  { text: "$ zippit seal ./secrets", color: "#fff" },
  { text: "Encrypting layer 1 (AES-256)...", color: "#00ff8899" },
  { text: "Encrypting layer 2 (Kyber-768)...", color: "#00ff8899" },
  { text: "✓ One greasy encrypted football.", color: "#00ff88" },
  { text: "Nothing readable inside.", color: "#00ff8866" },
];

const ZippitAd: AdComp = () => {
  const [visible, setVisible] = useState(1);

  useEffect(() => {
    if (visible < ZIPPIT_LINES.length) {
      const id = setTimeout(() => setVisible((v) => v + 1), 1100);
      return () => clearTimeout(id);
    } else {
      const id = setTimeout(() => setVisible(1), 3500);
      return () => clearTimeout(id);
    }
  }, [visible]);

  return (
    <a
      href="https://github.com/jayf0x/zippit"
      target="_blank"
      rel="noreferrer"
      className="block size-full p-4 font-mono text-[11px]"
      style={{ background: "#05050f" }}
    >
      <div className="flex flex-col gap-1.5 h-full justify-center">
        {ZIPPIT_LINES.slice(0, visible).map((line, i) => (
          <div key={i} style={{ color: line.color }}>
            {line.text}
          </div>
        ))}
        {visible < ZIPPIT_LINES.length && (
          <span className="animate-pulse text-[#00ff88]">_</span>
        )}
        {visible >= ZIPPIT_LINES.length && (
          <p className="text-[9px] text-[#00ff88]/35 mt-2">🔐 zippit →</p>
        )}
      </div>
    </a>
  );
};

// ── Ad: Pure-Paste — URL cleaner ──────────────────────────────────────────────

const DIRTY = "shop.com/item?id=42&utm_source=fb&fbclid=abc&ref=feed";
const CLEAN = "shop.com/item?id=42";

const PurePasteAd: AdComp = () => {
  const [phase, setPhase] = useState<0 | 1 | 2>(0);

  useEffect(() => {
    const seq: [number, 0 | 1 | 2][] = [
      [2200, 1],
      [3600, 2],
      [5800, 0],
    ];
    let i = 0;
    const step = () => {
      const [delay, next] = seq[i % seq.length];
      return setTimeout(() => {
        setPhase(next);
        i++;
        timerId = step();
      }, delay);
    };
    let timerId = step();
    return () => clearTimeout(timerId);
  }, []);

  return (
    <a
      href="https://github.com/jayf0x/Pure-Paste"
      target="_blank"
      rel="noreferrer"
      className="block size-full"
      style={{ background: "#080d1c" }}
    >
      <div className="size-full flex flex-col items-center justify-center gap-3 p-3">
        <span className="text-2xl">🔗</span>
        <div
          className="w-full rounded p-2 font-mono text-[9px] break-all leading-relaxed"
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          {phase === 0 && <span style={{ color: "#f87171" }}>{DIRTY}</span>}
          {phase === 1 && (
            <>
              <span style={{ color: "#4ade80" }}>shop.com/item?id=42</span>
              <span
                style={{
                  color: "#f87171",
                  textDecoration: "line-through",
                  opacity: 0.5,
                }}
              >
                &utm_source=fb&fbclid=abc&ref=feed
              </span>
            </>
          )}
          {phase === 2 && <span style={{ color: "#4ade80" }}>{CLEAN}</span>}
        </div>
        <div className="text-center">
          <p className="text-white text-[11px] font-bold">
            Paste clean. Always.
          </p>
          <p className="text-white/35 text-[9px]">
            Pure-Paste — private by default →
          </p>
        </div>
      </div>
    </a>
  );
};

// ── Pool (must be defined after all ad components) ────────────────────────────

const AD_POOL: AdComp[] = [
  MatrixRain,
  IdyllicLandscape,
  Win98Ad,
  FluidityAd,
  PiipayaAd,
  AudioBonanzaAd,
  AqtiveAd,
  ZippitAd,
  PurePasteAd,
];
