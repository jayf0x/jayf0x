import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import { TypeAnimation } from "react-type-animation";
import { Send, TriangleAlert, X } from "lucide-react";
import { useChatLLM } from "../hooks/useChatLLM";

const STATUS_MESSAGES = [
  "Autocompleting…",
  "Loading from tape drive…",
  "Warming up transformers…",
  "Summoning 117M parameters…",
  "Reading ancient weights…",
  "Token by token…",
  "Consulting 2018 knowledge…",
  "Running on a 2018 server…",
  "Computing attention heads…",
  "Fetching from huggingface…",
];

export const ChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [statusIdx, setStatusIdx] = useState(0);
  const { messages, sendMessage, isPending, eta, progress, error } =
    useChatLLM();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isPending) return;
    const id = setInterval(() => {
      setStatusIdx((i) => (i + 1) % STATUS_MESSAGES.length);
    }, 2800);
    return () => clearInterval(id);
  }, [isPending]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isPending]);

  useEffect(() => {
    if (isOpen) {
      const t = setTimeout(() => inputRef.current?.focus(), 280);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  const handleSend = useCallback(() => {
    if (!input.trim() || isPending) return;
    sendMessage(input);
    setInput("");
  }, [input, isPending, sendMessage]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      <AnimatePresence mode="popLayout">
        {isOpen && (
          <motion.div
            key="chat-window"
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.96 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
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
                <div>
                  <div className="text-sm font-semibold text-[var(--text)] leading-none tracking-tight">
                    GPT-1
                  </div>
                  <div className="text-[11px] text-[var(--muted)] mt-0.5 leading-none">
                    circa 2018 · 117M params
                  </div>
                </div>
                <span
                  className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded tracking-widest uppercase"
                  style={{
                    background: "rgba(255, 176, 0, 0.08)",
                    border: "1px solid rgba(255, 176, 0, 0.2)",
                    color: "#ffb800",
                  }}
                >
                  artifact
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
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.18 }}
                  className={`flex items-end gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {msg.role === "assistant" && (
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center text-xs flex-shrink-0 mb-0.5 select-none"
                      style={{
                        background: "rgba(79,124,255,0.12)",
                        border: "1px solid rgba(79,124,255,0.2)",
                      }}
                    >
                      🤖
                    </div>
                  )}

                  <div
                    className={`max-w-[76%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed break-words ${
                      msg.role === "user" ? "rounded-br-sm" : "rounded-bl-sm font-mono text-[13px]"
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
                    {msg.role === "assistant" && msg.animate ? (
                      <TypeAnimation
                        key={msg.id}
                        sequence={[msg.content]}
                        speed={82}
                        cursor={false}
                        wrapper="span"
                      />
                    ) : (
                      msg.content
                    )}
                  </div>
                </motion.div>
              ))}

              {/* ── Pending bubble ── */}
              <AnimatePresence>
                {isPending && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 4 }}
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
                    <div className="max-w-[76%] space-y-2">
                      <div
                        className="rounded-2xl rounded-bl-sm px-3.5 py-2.5 text-[13px] font-mono"
                        style={{
                          background: "rgba(255, 176, 0, 0.06)",
                          border: "1px solid rgba(255, 176, 0, 0.12)",
                          color: "#e2d090",
                        }}
                      >
                        <AnimatePresence mode="wait">
                          <motion.span
                            key={statusIdx}
                            initial={{ opacity: 0, y: 4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -4 }}
                            transition={{ duration: 0.2 }}
                            className="inline-block"
                          >
                            {STATUS_MESSAGES[statusIdx]}
                          </motion.span>
                        </AnimatePresence>
                        {eta !== null && (
                          <span
                            className="ml-2 text-[11px] opacity-40 tabular-nums"
                          >
                            ~{Math.ceil(eta)}s
                          </span>
                        )}
                      </div>

                      {/* Progress bar */}
                      <div
                        className="h-[3px] rounded-full overflow-hidden"
                        style={{ background: "rgba(255,255,255,0.06)" }}
                      >
                        <motion.div
                          className="h-full rounded-full"
                          style={{
                            background:
                              "linear-gradient(90deg, rgba(255,176,0,0.5), rgba(255,210,80,0.8))",
                          }}
                          initial={{ width: "0%" }}
                          animate={{
                            width:
                              progress !== null
                                ? `${Math.round(progress * 100)}%`
                                : "5%",
                          }}
                          transition={{ duration: 0.6, ease: "easeOut" }}
                        />
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

            {/* ── Input area ── */}
            <div
              className="px-3 py-3 flex-shrink-0"
              style={{ borderTop: "1px solid rgba(255,255,255,0.055)" }}
            >
              <div
                className="flex items-center gap-2 rounded-xl px-3 py-2.5 transition-all"
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
                    isPending ? "Generating response…" : "Ask GPT-1 something…"
                  }
                  disabled={isPending}
                  maxLength={512}
                  className="flex-1 bg-transparent text-sm text-[var(--text)] placeholder-[var(--muted)] outline-none disabled:opacity-40 min-w-0"
                />
                <button
                  type="button"
                  onClick={handleSend}
                  disabled={isPending || !input.trim()}
                  className="flex-shrink-0 text-[var(--accent)] hover:opacity-75 transition-opacity disabled:opacity-25 disabled:cursor-not-allowed"
                >
                  <Send size={15} />
                </button>
              </div>
              <p className="text-center text-[10px] text-[var(--muted)] mt-2 opacity-40 select-none">
                GPT-1 · 2018 OpenAI · historically inaccurate by design
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Floating button ── */}
      <motion.button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        whileHover={{ scale: 1.07 }}
        whileTap={{ scale: 0.9 }}
        className="w-14 h-14 rounded-full flex items-center justify-center text-xl shadow-xl select-none relative"
        style={{
          background:
            "linear-gradient(135deg, #4f7cff 0%, #7c4fff 100%)",
          boxShadow:
            "0 4px 24px rgba(79, 124, 255, 0.35), 0 1px 0 rgba(255,255,255,0.15) inset",
          border: "1px solid rgba(255,255,255,0.12)",
        }}
      >
        {/* idle wiggle via CSS animation on the emoji wrapper */}
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.span
              key="close"
              initial={{ rotate: -80, opacity: 0, scale: 0.5 }}
              animate={{ rotate: 0, opacity: 1, scale: 1 }}
              exit={{ rotate: 80, opacity: 0, scale: 0.5 }}
              transition={{ duration: 0.18, ease: "backOut" }}
              className="flex items-center justify-center"
            >
              <X size={20} color="white" strokeWidth={2.5} />
            </motion.span>
          ) : (
            <motion.span
              key="open"
              initial={{ rotate: 80, opacity: 0, scale: 0.5 }}
              animate={{ rotate: 0, opacity: 1, scale: 1 }}
              exit={{ rotate: -80, opacity: 0, scale: 0.5 }}
              transition={{ duration: 0.18, ease: "backOut" }}
            >
              🤖
            </motion.span>
          )}
        </AnimatePresence>

        {/* Pulse ring when idle */}
        {!isOpen && !isPending && (
          <motion.span
            className="absolute inset-0 rounded-full pointer-events-none"
            initial={{ opacity: 0.5, scale: 1 }}
            animate={{ opacity: 0, scale: 1.55 }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
            style={{
              background:
                "linear-gradient(135deg, #4f7cff 0%, #7c4fff 100%)",
            }}
          />
        )}

        {/* Pending indicator dot */}
        {isPending && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-amber-400 border-2"
            style={{ borderColor: "rgba(8,8,12,0.97)" }}
          >
            <motion.span
              className="block w-full h-full rounded-full bg-amber-400"
              animate={{ scale: [1, 1.4, 1] }}
              transition={{ duration: 1.2, repeat: Infinity }}
            />
          </motion.span>
        )}
      </motion.button>
    </div>
  );
};
