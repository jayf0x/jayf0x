import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import { TypeAnimation } from "react-type-animation";
import { ChevronDown, Send, Square, TriangleAlert, X } from "lucide-react";
import { useChatLLM } from "@/hooks/useChatLLM";
import { InfoPopover } from "./InfoPopover";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  animate?: boolean;
};
const STATUS_MESSAGES = [
  "Autocompleting",
  "Generating gibberish",
  "Loading from tape drive",
  "Warming up transformers",
  "Token by token",
  "Consulting 2018 knowledge",
  "Computing attention heads",
  "Fetching from HuggingFace",
  "Reading ancient weights",
];

// Module-level set so animation state survives open/close without replaying
const animatedIds = new Set<string>(["init"]);

// Strip all " chars and blank lines from raw model output
const cleanResponse = (raw: string): string =>
  raw
    .split("\n")
    .map((l) => l.replace(/"/g, "").trim())
    .filter((l) => l.length > 0)
    .join("\n");

// Find where repetition begins, return unique prefix + repeated suffix
const splitAtRepeat = (text: string): { unique: string; repeated: string } => {
  const lines = text.split("\n").filter((l) => l.length > 0);
  const counts = new Map<string, number>();
  let repeatStart = -1;

  for (let i = 0; i < lines.length; i++) {
    const n = (counts.get(lines[i]) ?? 0) + 1;
    counts.set(lines[i], n);
    if (n === 2) {
      repeatStart = i;
      break;
    }
  }

  if (repeatStart === -1) return { unique: lines.join("\n"), repeated: "" };
  return {
    unique: lines.slice(0, repeatStart).join("\n"),
    repeated: lines.slice(repeatStart).join("\n"),
  };
};

// ── Bot message bubble with repeat detection + Show more ──────────────────
const BotMessage = ({
  id,
  content,
  shouldAnimate,
}: {
  id: string;
  content: string;
  shouldAnimate: boolean;
}) => {
  const [expanded, setExpanded] = useState(false);
  const [typed, setTyped] = useState(!shouldAnimate);

  const clean = cleanResponse(content);
  const { unique, repeated } = splitAtRepeat(clean);
  const hasRepeat = repeated.length > 0;
  const repeatLineCount = repeated
    .split("\n")
    .filter((l) => l.length > 0).length;

  return (
    <div className="flex flex-col items-start">
      {shouldAnimate ? (
        <span className="whitespace-pre-wrap">
          <TypeAnimation
            key={`message-bot-${id}`}
            sequence={[
              unique,
              () => {
                animatedIds.add(id);
                setTyped(true);
              },
            ]}
            speed={62}
            cursor={false}
            wrapper="span"
          />
        </span>
      ) : (
        <span className="whitespace-pre-wrap">{unique}</span>
      )}

      {/* Expanded repeated block */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            key="repeated"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.26, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden w-full"
          >
            <div
              className="mt-2 pt-2 whitespace-pre-wrap"
              style={{
                borderTop: "1px solid rgba(255,176,0,0.15)",
                opacity: 0.55,
              }}
            >
              {repeated}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Show more / less toggle */}
      {hasRepeat && typed && (
        <motion.button
          initial={{ opacity: 0, y: 3 }}
          animate={{ opacity: 1, y: 0 }}
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mt-2 flex items-center gap-1 text-[11px] transition-opacity hover:opacity-100"
          style={{ color: "rgba(255,176,0,0.5)" }}
        >
          <motion.span
            animate={{ rotate: expanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
            className="flex"
          >
            <ChevronDown size={11} />
          </motion.span>
          {expanded
            ? "Show less"
            : `${repeatLineCount} repeated lines — Show more`}
        </motion.button>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────

export const ChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [statusMessage, setStatusMessage] = useState("");
  const [countdown, setCountdown] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [hasInitialized, setHasInitialized] = useState<boolean>(false);

  const { init, sendMessage, cancel, isPending, eta, response, error } =
    useChatLLM();

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const initialEtaRef = useRef<number | null>(null);
  const countdownTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const elapsedTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const prevResponseRef = useRef<string | null>(null);

  // Init connection on first open
  useEffect(() => {
    if (isOpen) {
      init();
      const t = setTimeout(() => inputRef.current?.focus(), 280);
      return () => clearTimeout(t);
    }
  }, [isOpen, init]);

  // Append bot response when it arrives
  useEffect(() => {
    if (response !== null && response !== prevResponseRef.current) {
      prevResponseRef.current = response;
      const id = `bot-${Date.now()}`;
      setMessages((prev) => [
        ...prev,
        { id, role: "assistant", content: response, animate: true },
      ]);
    }
  }, [response]);

  // Countdown from first ETA received
  useEffect(() => {
    if (isPending && eta !== null && initialEtaRef.current === null) {
      initialEtaRef.current = eta;
      setCountdown(Math.ceil(eta));
      countdownTimerRef.current = setInterval(() => {
        setCountdown((prev) => (prev === null || prev <= 0 ? 0 : prev - 1));
      }, 1000);
    }
    if (!isPending) {
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
      initialEtaRef.current = null;
      setCountdown(null);
    }
    return () => {};
  }, [isPending, eta]);

  // Elapsed stopwatch
  useEffect(() => {
    if (isPending) {
      setElapsed(0);
      elapsedTimerRef.current = setInterval(
        () => setElapsed((s) => s + 1),
        1000,
      );
    } else {
      if (elapsedTimerRef.current) clearInterval(elapsedTimerRef.current);
      elapsedTimerRef.current = null;
    }
    return () => {
      if (elapsedTimerRef.current) clearInterval(elapsedTimerRef.current);
    };
  }, [isPending]);

  // Cycle status messages while pending
  useEffect(() => {
    if (!isPending) return;
    const id = setInterval(
      () =>
        setStatusMessage((prev) => {
          const idx =
            (STATUS_MESSAGES.indexOf(prev) + 1) % STATUS_MESSAGES.length;
          return STATUS_MESSAGES[idx] ?? STATUS_MESSAGES.at(0);
        }),
      2800,
    );
    return () => clearInterval(id);
  }, [isPending]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isPending]);

  const handleSend = useCallback(() => {
    if (!input.trim() || isPending) return;
    setMessages((prev) => [
      ...prev,
      { id: `user-${Date.now()}`, role: "user", content: input.trim() },
    ]);
    sendMessage(input);
    setInput("");
  }, [input, isPending, sendMessage]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleCancel = () => {
    cancel();
    setMessages((prev) => [
      ...prev,
      {
        id: `cancelled-${Date.now()}`,
        role: "assistant",
        content: "…cancelled.",
      },
    ]);
  };

  const initMessages = useCallback(() => {
    if (isOpen && !hasInitialized) {
      const msgs = [
        "Hey there 👋",
        "I am an historical artifact and not a helpful assistant.",
        "How can I help?",
      ];

      msgs.forEach((text, idx) => {
        const msg: Message = {
          id: "init",
          role: "assistant",
          content: text,
          animate: true,
        };

        setTimeout(
          () => {
            setMessages((prev) => [...prev, msg]);
          },
          idx * text.length * 50,
        );
      });

      setHasInitialized(true);
    }
  }, [isOpen, hasInitialized]);

  useEffect(() => {
    initMessages();
  }, [isOpen]);

  const countdownProgress =
    countdown !== null && initialEtaRef.current
      ? 1 - countdown / initialEtaRef.current
      : null;

  return (
    <div className="flex flex-col items-end gap-3">
      <AnimatePresence mode="popLayout">
        {isOpen && (
          <motion.div
            key="chat-window"
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.96 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="w-[380px] rounded-2xl overflow-hidden flex flex-col"
            style={{
              background: "rgba(8, 8, 12, 0.97)",
              border: "1px solid rgba(255,255,255,0.07)",
              backdropFilter: "blur(24px)",
              boxShadow:
                "0 24px 64px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04) inset",
              height: "520px",
            }}
          >
            {/* ── Header ── */}
            <div
              className="flex items-center justify-between px-4 py-3 flex-shrink-0"
              style={{
                background: "rgba(255,255,255,0.025)",
                borderBottom: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <div className="flex items-center gap-2.5">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-base select-none"
                  style={{
                    background: "rgba(79,124,255,0.12)",
                    border: "1px solid rgba(79,124,255,0.25)",
                  }}
                >
                  🤖
                </div>
                <span className="text-sm font-semibold text-[var(--text)] tracking-tight">
                  <InfoPopover
                    title="OpenAI GPT 1"
                    items={[
                      [
                        "Hugging Face",
                        "https://huggingface.co/openai-community/openai-gpt",
                      ],
                    ]}
                  />
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-[var(--muted)] hover:text-[var(--text)] transition-colors rounded-lg p-1.5 hover:bg-white/5"
              >
                <X size={15} />
              </button>
            </div>

            {/* ── Messages ── */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 min-h-0">
              {messages.map((msg) => {
                const shouldAnimate = !!msg.animate && !animatedIds.has(msg.id);
                return (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.18 }}
                    className={`flex items-end gap-2 ${
                      msg.role === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    {msg.role === "assistant" && (
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center text-xs flex-shrink-0 mb-0.5 select-none"
                        style={{
                          background: "rgba(79,124,255,0.12)",
                          border: "1px solid rgba(79,124,255,0.2)",
                        }}
                      >
                        OG
                      </div>
                    )}
                    <div
                      className={`max-w-[76%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed break-words ${
                        msg.role === "user"
                          ? "rounded-br-sm"
                          : "rounded-bl-sm font-mono text-[13px]"
                      }`}
                      style={
                        msg.role === "user"
                          ? {
                              background: "rgba(79, 124, 255, 0.22)",
                              border: "1px solid rgba(79, 124, 255, 0.28)",
                              color: "#c8d8ff",
                            }
                          : {
                              background: "rgba(255, 176, 0, 0.06)",
                              border: "1px solid rgba(255, 176, 0, 0.12)",
                              color: "#e2d090",
                            }
                      }
                    >
                      {msg.role === "assistant" ? (
                        <BotMessage
                          id={msg.id}
                          content={msg.content}
                          shouldAnimate={shouldAnimate}
                        />
                      ) : (
                        msg.content
                      )}
                    </div>
                  </motion.div>
                );
              })}

              {/* ── Pending dots ── */}
              <AnimatePresence>
                {isPending && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="flex items-end gap-2 justify-start"
                  >
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center text-xs flex-shrink-0 mb-0.5 select-none"
                      style={{
                        background: "rgba(79,124,255,0.12)",
                        border: "1px solid rgba(79,124,255,0.2)",
                      }}
                    >
                      🤖
                    </div>
                    <div
                      className="rounded-2xl rounded-bl-sm px-3.5 py-2.5"
                      style={{
                        background: "rgba(255, 176, 0, 0.06)",
                        border: "1px solid rgba(255, 176, 0, 0.12)",
                      }}
                    >
                      <div className="flex gap-1">
                        {[0, 1, 2].map((i) => (
                          <motion.span
                            key={i}
                            className="w-1.5 h-1.5 rounded-full"
                            style={{ background: "#e2d090" }}
                            animate={{ opacity: [0.3, 1, 0.3] }}
                            transition={{
                              duration: 1.2,
                              repeat: Infinity,
                              delay: i * 0.2,
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* ── Error ── */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.97 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex justify-center"
                  >
                    <div
                      className="flex items-center gap-2 text-xs px-3 py-2 rounded-xl"
                      style={{
                        background: "rgba(255, 60, 60, 0.07)",
                        border: "1px solid rgba(255, 60, 60, 0.18)",
                        color: "#ff7575",
                      }}
                    >
                      <TriangleAlert size={12} />
                      {error}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div ref={messagesEndRef} />
            </div>

            {/* ── Status bar (slides in above input while pending) ── */}
            <AnimatePresence>
              {isPending && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex-shrink-0 overflow-hidden"
                  style={{ borderTop: "1px solid rgba(255,255,255,0.055)" }}
                >
                  <div className="px-4 pt-2.5 pb-3">
                    {/* Controls row: elapsed · countdown · cancel */}
                    <div className="flex items-center justify-between mb-2">
                      <span
                        className="text-[11px] tabular-nums"
                        style={{ color: "rgba(255,255,255,0.28)" }}
                      >
                        {elapsed}s elapsed
                      </span>
                      <div className="flex items-center gap-2">
                        {countdown !== null && (
                          <span
                            className="text-[11px] tabular-nums font-mono"
                            style={{ color: "rgba(255,176,0,0.5)" }}
                          >
                            ~{countdown}s
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={handleCancel}
                          className="flex items-center gap-1 text-[11px] px-2 py-1 rounded-md transition-colors hover:bg-white/5"
                          style={{
                            background: "rgba(255,255,255,0.05)",
                            border: "1px solid rgba(255,255,255,0.08)",
                            color: "rgba(255,255,255,0.45)",
                          }}
                        >
                          <Square size={9} strokeWidth={2.5} />
                          Cancel
                        </button>
                      </div>
                    </div>

                    {/* Status label floating above progress bar */}
                    <div className="relative">
                      <div className="mb-1.5 h-4 flex items-center">
                        <AnimatePresence mode="wait">
                          <motion.span
                            key={`status-${statusMessage}`}
                            initial={{ opacity: 0, y: 3 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -3 }}
                            transition={{ duration: 0.18 }}
                            className="text-[11px] font-mono"
                            style={{ color: "rgba(226,208,144,0.7)" }}
                          >
                            {statusMessage}…
                          </motion.span>
                        </AnimatePresence>
                      </div>

                      {/* Full-width progress bar */}
                      <div
                        className="h-[3px] rounded-full overflow-hidden w-full"
                        style={{ background: "rgba(255,255,255,0.06)" }}
                      >
                        <motion.div
                          className="h-full rounded-full"
                          style={{
                            background:
                              "linear-gradient(90deg, rgba(255,176,0,0.45), rgba(255,214,80,0.85))",
                          }}
                          initial={{ width: "0%" }}
                          animate={{
                            width:
                              countdownProgress !== null
                                ? `${Math.round(countdownProgress * 100)}%`
                                : "4%",
                          }}
                          transition={{ duration: 0.9, ease: "easeOut" }}
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── Input area ── */}
            <div
              className="px-3 py-3 flex-shrink-0"
              style={{
                borderTop: isPending
                  ? "none"
                  : "1px solid rgba(255,255,255,0.055)",
              }}
            >
              <div
                className="flex items-center gap-2 rounded-xl px-3 py-2.5"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.07)",
                }}
              >
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={
                    isPending ? "Generating…" : "Ask GPT-1 something…"
                  }
                  disabled={isPending}
                  maxLength={512}
                  className="flex-1 bg-transparent text-sm text-[var(--text)] outline-none disabled:opacity-40 min-w-0 placeholder:text-[var(--muted)]"
                />
                <button
                  type="button"
                  onClick={handleSend}
                  disabled={isPending || !input.trim()}
                  className="flex-shrink-0 transition-opacity disabled:opacity-25 disabled:cursor-not-allowed"
                  style={{ color: "var(--accent)" }}
                >
                  <Send size={15} />
                </button>
              </div>
              <p
                className="text-center text-[10px] mt-2 select-none"
                style={{ color: "rgba(255,255,255,0.18)" }}
              >
                GPT-1 · 2018 OpenAI · historically inaccurate by design
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── FAB — hides when chat is open ── */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            key="fab"
            type="button"
            onClick={() => setIsOpen(true)}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.07 }}
            whileTap={{ scale: 0.9 }}
            transition={{ duration: 0.2, ease: [0.34, 1.56, 0.64, 1] }}
            className="w-14 h-14 rounded-full flex items-center justify-center text-xl shadow-xl select-none relative"
            style={{
              background: "linear-gradient(135deg, #4f7cff 0%, #7c4fff 100%)",
              boxShadow:
                "0 4px 24px rgba(79, 124, 255, 0.35), 0 1px 0 rgba(255,255,255,0.15) inset",
              border: "1px solid rgba(255,255,255,0.12)",
            }}
          >
            🤖
            {!isPending && (
              <motion.span
                className="absolute inset-0 rounded-full pointer-events-none"
                initial={{ opacity: 0.4, scale: 1 }}
                animate={{ opacity: 0, scale: 1.6 }}
                transition={{
                  duration: 2.2,
                  repeat: Infinity,
                  ease: "easeOut",
                }}
                style={{
                  background:
                    "linear-gradient(135deg, #4f7cff 0%, #7c4fff 100%)",
                }}
              />
            )}
            {isPending && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center"
                style={{
                  background: "#ffb800",
                  borderColor: "rgba(8,8,12,0.97)",
                }}
              >
                <motion.span
                  className="block w-2 h-2 rounded-full bg-amber-400"
                  animate={{ scale: [1, 1.5, 1] }}
                  transition={{ duration: 1.2, repeat: Infinity }}
                />
              </motion.span>
            )}
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
};
