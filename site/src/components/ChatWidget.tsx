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

const animatedIds = new Set<string>(["init"]);

const cleanResponse = (raw: string): string =>
  raw
    .split("\n")
    .map((l) => l.replace(/"/g, "").trim())
    .filter((l) => l.length > 0)
    .join("\n");

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
                borderTop: "1px solid var(--gold-dim)",
                opacity: 0.55,
              }}
            >
              {repeated}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {hasRepeat && typed && (
        <motion.button
          initial={{ opacity: 0, y: 3 }}
          animate={{ opacity: 1, y: 0 }}
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mt-2 flex items-center gap-1 text-[11px] transition-opacity hover:opacity-100"
          style={{ color: "color-mix(in srgb, var(--gold) 50%, transparent)" }}
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

  useEffect(() => {
    if (isOpen) {
      init();
      const t = setTimeout(() => inputRef.current?.focus(), 280);
      return () => clearTimeout(t);
    }
  }, [isOpen, init]);

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
        "Hey there 👋 Ever wanted to chat with the first Large Language model?",
        "I'm rather an historical artifact than a helpful assistant, so beware 😄",
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
            className="w-95 rounded-2xl overflow-hidden flex flex-col"
            style={{
              background: "var(--glass)",
              border: "1px solid var(--border)",
              backdropFilter: "blur(24px)",
              boxShadow:
                "0 24px 64px var(--bg-a60), 0 0 0 1px var(--overlay-xs) inset",
              height: "520px",
            }}
          >
            <div
              className="flex items-center justify-between px-4 py-3 shrink-0"
              style={{
                background: "var(--overlay-xs)",
                borderBottom: "1px solid var(--overlay-sm)",
              }}
            >
              <div className="flex items-center gap-2.5">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-base select-none"
                  style={{
                    background: "var(--accent-dim)",
                    border: "1px solid var(--accent-glow)",
                  }}
                >
                  🤖
                </div>
                <span className="text-sm font-semibold text-(--text) tracking-tight">
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
                className="text-(--muted) hover:text-(--text) transition-colors rounded-lg p-1.5 hover:bg-white/5"
              >
                <X size={15} />
              </button>
            </div>

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
                        className="w-6 h-6 rounded-full flex items-center justify-center text-xs shrink-0 mb-0.5 select-none"
                        style={{
                          background: "var(--accent-dim)",
                          border: "1px solid var(--accent-glow)",
                        }}
                      >
                        OG
                      </div>
                    )}
                    <div
                      className={`max-w-[76%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed wrap-break-words ${
                        msg.role === "user"
                          ? "rounded-br-sm"
                          : "rounded-bl-sm font-mono text-[13px]"
                      }`}
                      style={
                        msg.role === "user"
                          ? {
                              background: "var(--accent-glow)",
                              border: "1px solid var(--accent-glow)",
                              color: "var(--c-c8d8ff)",
                            }
                          : {
                              background: "var(--gold-dim)",
                              border: "1px solid var(--gold-dim)",
                              color: "var(--gold-text)",
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

              <AnimatePresence>
                {isPending && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="flex items-end gap-2 justify-start"
                  >
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center text-xs shrink-0 mb-0.5 select-none"
                      style={{
                        background: "var(--accent-dim)",
                        border: "1px solid var(--accent-glow)",
                      }}
                    >
                      🤖
                    </div>
                    <div
                      className="rounded-2xl rounded-bl-sm px-3.5 py-2.5"
                      style={{
                        background: "var(--gold-dim)",
                        border: "1px solid var(--gold-dim)",
                      }}
                    >
                      <div className="flex gap-1">
                        {[0, 1, 2].map((i) => (
                          <motion.span
                            key={i}
                            className="w-1.5 h-1.5 rounded-full"
                            style={{ background: "var(--gold-text)" }}
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
                        background: "color-mix(in srgb, var(--red) 7%, transparent)",
                        border: "1px solid color-mix(in srgb, var(--red) 18%, transparent)",
                        color: "var(--red)",
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

            <AnimatePresence>
              {isPending && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="shrink-0 overflow-hidden"
                  style={{ borderTop: "1px solid var(--overlay-sm)" }}
                >
                  <div className="px-4 pt-2.5 pb-3">
                    <div className="flex items-center justify-between mb-2">
                      <span
                        className="text-[11px] tabular-nums"
                        style={{ color: "var(--overlay-lg)" }}
                      >
                        {elapsed}s elapsed
                      </span>
                      <div className="flex items-center gap-2">
                        {countdown !== null && (
                          <span
                            className="text-[11px] tabular-nums font-mono"
                            style={{ color: "color-mix(in srgb, var(--gold) 50%, transparent)" }}
                          >
                            ~{countdown}s
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={handleCancel}
                          className="flex items-center gap-1 text-[11px] px-2 py-1 rounded-md transition-colors hover:bg-white/5"
                          style={{
                            background: "var(--overlay-sm)",
                            border: "1px solid var(--border)",
                            color: "var(--border-a45)",
                          }}
                        >
                          <Square size={9} strokeWidth={2.5} />
                          Cancel
                        </button>
                      </div>
                    </div>

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
                            style={{ color: "color-mix(in srgb, var(--gold-text) 70%, transparent)" }}
                          >
                            {statusMessage}…
                          </motion.span>
                        </AnimatePresence>
                      </div>

                      <div
                        className="h-[3px] rounded-full overflow-hidden w-full"
                        style={{ background: "var(--overlay-sm)" }}
                      >
                        <motion.div
                          className="h-full rounded-full"
                          style={{
                            background:
                              "linear-gradient(90deg, color-mix(in srgb, var(--gold) 45%, transparent), var(--c-ffd650-a85))",
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

            <div
              className="px-3 py-3 shrink-0"
              style={{
                borderTop: isPending
                  ? "none"
                  : "1px solid var(--overlay-sm)",
              }}
            >
              <div
                className="flex items-center gap-2 rounded-xl px-3 py-2.5"
                style={{
                  background: "var(--overlay-xs)",
                  border: "1px solid var(--border)",
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
                  className="flex-1 bg-transparent text-sm text-(--text) outline-none disabled:opacity-40 min-w-0 placeholder:text-(--muted)"
                />
                <button
                  type="button"
                  onClick={handleSend}
                  disabled={isPending || !input.trim()}
                  className="shrink-0 transition-opacity disabled:opacity-25 disabled:cursor-not-allowed text-(--accent)"
                >
                  <Send size={15} />
                </button>
              </div>
              <p
                className="text-center text-[10px] mt-2 select-none"
                style={{ color: "var(--overlay-lg)" }}
              >
                GPT-1 · 2018 OpenAI · historically inaccurate by design
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
              background: "linear-gradient(135deg, var(--accent) 0%, var(--c-7c4fff) 100%)",
              boxShadow:
                "0 4px 24px color-mix(in srgb, var(--accent) 35%, transparent), 0 1px 0 var(--overlay-lg) inset",
              border: "1px solid var(--overlay-md)",
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
                    "linear-gradient(135deg, var(--accent) 0%, var(--c-7c4fff) 100%)",
                }}
              />
            )}
            {isPending && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center"
                style={{
                  background: "var(--gold)",
                  borderColor: "var(--glass)",
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
