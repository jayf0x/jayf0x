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

const SLOT_INTERVALS = [14000, 21000, 11000, 27000];

const SLOT_POSITIONS: React.CSSProperties[] = [
  { left: "1.5vw", top: "14vh" },
  { left: "1.5vw", bottom: "12vh" },
  { right: "1.5vw", top: "5vh" },
  { right: "1.5vw", top: "60vh" },
];

const SLOT_SIZES = [
  { wDiv: 8, hDiv: 3 },
  { wDiv: 7.2, hDiv: 2.8 },
  { wDiv: 9.5, hDiv: 3.6 },
  { wDiv: 7, hDiv: 3.1 },
];

type Slot = { Ad: AdComp; v: number };

// ── Shell ─────────────────────────────────────────────────────────────────────

const FloatingPanel = ({
  children,
  style,
  wDiv = 8,
  hDiv = 3,
}: PropsWithChildren<{
  style: React.CSSProperties;
  wDiv?: number;
  hDiv?: number;
}>) => {
  const seed = useMemo(() => Math.random() * 10, []);
  const w = window.innerWidth / wDiv;
  const h = window.innerHeight / hDiv;

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
    <div className="fixed size-full inset-0 z-10">
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
            <FloatingPanel
              key={i}
              style={SLOT_POSITIONS[i]}
              wDiv={SLOT_SIZES[i].wDiv}
              hDiv={SLOT_SIZES[i].hDiv}
            >
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
      className="absolute inset-0 w-full h-full object-cover scale-110"
      src="https://raw.githubusercontent.com/jayf0x/js-canvas/main/previews/trees.gif"
    />
    {/* vintage sepia crush */}
    <div
      className="absolute inset-0"
      style={{
        background:
          "linear-gradient(to bottom, rgba(50,18,0,0.5) 0%, rgba(10,4,0,0.97) 65%)",
      }}
    />
    {/* paper grain */}
    <div
      className="absolute inset-0 pointer-events-none"
      style={{
        background:
          "repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(212,160,23,0.025) 3px, rgba(212,160,23,0.025) 4px)",
      }}
    />
    <div className="absolute inset-0 flex flex-col justify-between p-3">
      {/* official stamp */}
      <div className="flex items-center">
        <span
          className="text-[7px] font-bold px-1.5 py-0.5 tracking-widest uppercase"
          style={{
            border: "1.5px solid #d4a017bb",
            color: "#d4a017cc",
            borderRadius: "2px",
            fontFamily: "monospace",
          }}
        >
          ✈ TOURISM BOARD OF EDO — EST. 1600
        </span>
      </div>
      {/* hero text */}
      <div>
        <p
          className="font-black leading-none uppercase"
          style={{
            fontSize: "clamp(28px, 6vw, 42px)",
            color: "#f5deb3",
            textShadow:
              "0 0 40px rgba(212,160,23,0.7), 2px 2px 0 rgba(0,0,0,0.9)",
            letterSpacing: "-0.03em",
          }}
        >
          Travel
          <br />
          Edo
          <br />
          Japan
        </p>
        <div
          className="mt-1.5 text-[8px] font-mono leading-5"
          style={{ color: "#d4a01788", fontFamily: "monospace" }}
        >
          <p>YEAR: 1600 AD &nbsp;·&nbsp; WIFI: NONE ✓</p>
          <p>SAMURAI: ABSOLUTELY ✓</p>
          <p>RETURN TICKET: NOT REQUIRED ✓</p>
        </div>
        <div className="mt-2 flex items-end gap-2">
          <span
            className="inline-block text-[10px] font-black px-2.5 py-1 rounded-sm"
            style={{ background: "#d4a017", color: "#000" }}
          >
            Take a live server and travel →
          </span>
          <span
            className="text-[7px] italic pb-0.5"
            style={{ color: "#d4a01744" }}
          >
            *just JavaScript
          </span>
        </div>
      </div>
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
      <p
        className="text-center font-black text-black leading-tight uppercase tracking-tight"
        style={{ fontSize: "clamp(15px, 3vw, 20px)" }}
      >
        DOOM
        <br />
        IN JAVASCRIPT
        <br />
        PLAY LIKE IT'S 1998
      </p>
      <p className="text-center text-[10px] text-[#444] leading-snug px-1">
        Artisanal human-made technology.
      </p>
      <div
        className="mt-1 px-4 py-1 text-[11px] font-bold text-black text-center hover:scale-110"
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
    href="https://www.npmjs.com/package/@jayf0x/fluidity-js"
    target="_blank"
    rel="noreferrer"
    className="relative block size-full overflow-hidden"
  >
    <div
      className="absolute inset-0 hue_rot"
      style={{
        background:
          "radial-gradient(ellipse at 25% 35%, #7c3aed 0%, transparent 55%), radial-gradient(ellipse at 75% 65%, #0ea5e9 0%, transparent 55%), radial-gradient(ellipse at 50% 80%, #ec4899 0%, transparent 50%)",
        opacity: 0.9,
        animationDuration: "7s",
      }}
    />
    <div
      className="absolute inset-0 flex flex-col justify-between p-3"
      style={{
        background:
          "linear-gradient(to bottom, rgba(4,0,26,0.72) 0%, transparent 45%, rgba(4,0,26,0.88) 72%)",
      }}
    >
      <div className="flex items-center gap-1.5">
        <span
          className="text-[8px] font-bold px-1.5 py-0.5 rounded-sm tracking-widest uppercase"
          style={{ background: "#4ade80", color: "#000" }}
        >
          FREE
        </span>
        <span className="text-white/50 text-[9px] font-mono tracking-wide">
          NPM PACKAGE
        </span>
      </div>
      <div>
        <p
          className="text-white font-black leading-none"
          style={{ fontSize: "clamp(18px, 4vw, 26px)" }}
        >
          PHYSICS.
          <br />
          LIQUEFIED.
          <br />
          OPEN SOURCE.
        </p>
        <p className="text-white/45 text-[9px] mt-1 font-mono">
          npm i @jayf0x/fluidity-js
        </p>
        <span
          className="mt-2 inline-block text-[10px] font-bold px-2.5 py-1 rounded-sm"
          style={{
            background: "rgba(255,255,255,0.14)",
            color: "#fff",
            backdropFilter: "blur(4px)",
            border: "1px solid rgba(255,255,255,0.18)",
          }}
        >
          Get it now →
        </span>
      </div>
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
    <div className="size-full flex flex-col justify-between p-4">
      <div>
        <p
          className="text-white font-black leading-none uppercase tracking-tight"
          style={{ fontSize: "clamp(16px, 3.5vw, 22px)" }}
        >
          THE FEDS
          <br />
          CAN'T
          <br />
          READ THIS.
        </p>
        <p className="text-white/30 text-[9px] mt-1 tracking-wide">
          Local AI · No cloud · No logs
        </p>
      </div>
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
      <p className="text-white/25 text-[9px] tracking-wide">PIIPAYA →</p>
    </div>
  </a>
);

// ── Ad: audio-bonanza — military sound poster ─────────────────────────────────

const RED_BAR_COLORS = [
  "#4d0000",
  "#660000",
  "#800000",
  "#990000",
  "#b30000",
  "#cc0000",
  "#e60000",
  "#ff0000",
  "#e60000",
  "#cc0000",
  "#b30000",
  "#990000",
  "#800000",
  "#ff1a1a",
];

const AudioBonanzaAd: AdComp = () => {
  const COUNT = 14;
  const [bars, setBars] = useState(() =>
    Array.from({ length: COUNT }, () => 0.15 + Math.random() * 0.8),
  );

  useEffect(() => {
    const id = setInterval(() => {
      setBars(Array.from({ length: COUNT }, () => 0.1 + Math.random() * 0.85));
    }, 160);
    return () => clearInterval(id);
  }, []);

  return (
    <a
      href="https://github.com/jayf0x/audio-bonanza"
      target="_blank"
      rel="noreferrer"
      className="relative block size-full overflow-hidden"
      style={{ background: "#000" }}
    >
      {/* scanlines */}
      <div
        className="absolute inset-0 pointer-events-none z-10"
        style={{
          background:
            "repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(255,0,0,0.04) 3px, rgba(255,0,0,0.04) 4px)",
        }}
      />
      {/* red bars */}
      <div
        className="absolute bottom-0 left-0 right-0 flex items-end gap-px px-1"
        style={{ height: "45%" }}
      >
        {bars.map((h, i) => (
          <div
            key={i}
            className="flex-1"
            style={{
              height: `${h * 100}%`,
              background: RED_BAR_COLORS[i % RED_BAR_COLORS.length],
              transition: "height 0.16s ease",
              boxShadow: `0 0 6px ${RED_BAR_COLORS[i % RED_BAR_COLORS.length]}88`,
            }}
          />
        ))}
      </div>
      {/* dark fade over bars */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(to bottom, #000 0%, #000 40%, transparent 100%)",
        }}
      />
      {/* text */}
      <div className="absolute inset-0 flex flex-col items-center justify-start pt-3 px-2 text-center z-10">
        <span
          className="text-[7px] font-bold tracking-widest uppercase mb-2"
          style={{ color: "#ff000099", fontFamily: "monospace" }}
        >
          JOIN NOW
        </span>
        <p
          className="font-black leading-none uppercase"
          style={{
            fontSize: "clamp(20px, 5vw, 28px)",
            color: "#ff0000",
            textShadow: "0 0 20px #ff0000cc, 0 0 50px #ff000055",
            letterSpacing: "-0.02em",
          }}
        >
          TAKE
          <br />
          OWNERSHIP
          <br />
          OF YOUR
          <br />
          SOUND
        </p>
        <p
          className="text-[8px] mt-2 tracking-widest uppercase font-bold"
          style={{ color: "#ff000055" }}
        >
          TAKE CONTROL
        </p>
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
    className="relative block size-full overflow-hidden"
    style={{ background: "#010d01" }}
  >
    {/* pulsing green glow */}
    <div
      className="absolute inset-0 animate-pulse"
      style={{
        background:
          "radial-gradient(ellipse at 50% 65%, #00ff001a 0%, transparent 70%)",
        animationDuration: "2s",
      }}
    />
    <div className="size-full flex flex-col items-center justify-center gap-3 p-3 relative">
      <div className="relative">
        <span className="text-4xl">☕</span>
        <span className="absolute -top-1 -right-1 flex size-3.5">
          <span className="animate-ping absolute inline-flex size-full rounded-full bg-green-400 opacity-75" />
          <span className="relative inline-flex size-3.5 rounded-full bg-green-400" />
        </span>
      </div>
      <TypeAnimation
        sequence={[
          "AWAKE.",
          1100,
          "CAFFEINATED.",
          1100,
          "ONLINE.",
          1000,
          "UNSTOPPABLE.",
          1400,
          "NEVER SLEEPING.",
          1600,
          "INVINCIBLE.",
          1200,
        ]}
        speed={45}
        repeat={Infinity}
        omitDeletionAnimation
        className="font-black text-center leading-none uppercase"
        style={{
          fontSize: "clamp(18px, 4.5vw, 26px)",
          color: "#4ade80",
          textShadow: "0 0 20px #4ade8099, 0 0 50px #4ade8044",
        }}
      />
      <p className="text-[9px] text-center" style={{ color: "#4ade8033" }}>
        Aqtive — keeps your Mac alive →
      </p>
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
      <div className="flex flex-col gap-1.5 h-full justify-between">
        <p
          className="text-white font-black leading-none uppercase tracking-tight"
          style={{
            fontSize: "clamp(16px, 3.5vw, 22px)",
            fontFamily: "sans-serif",
          }}
        >
          ENCRYPT
          <br />
          EVERYTHING.
          <br />
          TRUST NO ONE.
        </p>
        <div className="flex flex-col gap-1.5">
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
      <div className="size-full flex flex-col justify-between p-4">
        <div>
          <p
            className="text-white font-black leading-none uppercase tracking-tight"
            style={{ fontSize: "clamp(16px, 3.5vw, 22px)" }}
          >
            TRACKERS
            <br />
            EXECUTED.
            <br />
            PASTE CLEAN.
          </p>
          <p className="text-white/30 text-[9px] mt-1">Private by default.</p>
        </div>
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
        <p className="text-white/25 text-[9px]">Pure-Paste →</p>
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
