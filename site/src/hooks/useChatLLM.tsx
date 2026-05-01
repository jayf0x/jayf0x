import { Client } from "@gradio/client";
import { useRef, useState } from "react";

export type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  animate?: boolean;
};

type LLMProps = {
  inp: string;
  model_name:
    | "GPT-2 XL (gpt2-xl)"
    | "GPT-2 L (gpt2-large)"
    | "GPT-2 M (gpt2-medium)"
    | "GPT-2 S (gpt2)"
    | "GPT-1 (openai-gpt)";
  temperature: number;
  top_p: number;
  rep_pty: number;
  max_length: number;
};

type StatusQueue = {
  type: "status" | string;
  endpoint: "/generate" | string;
  fn_index: number;
  time: string;
  original_msg: "process_starts" | string;
  queue: boolean;
  stage: "pending" | string;
  position: number;
  eta: number;
};

type StatusInit = Pick<
  StatusQueue,
  "type" | "stage" | "queue" | "endpoint" | "fn_index" | "time"
>;

type PossibleMessageTypes = string[] | StatusInit | StatusQueue;

const isMsgQueue = (msg: PossibleMessageTypes): msg is StatusQueue =>
  "eta" in msg;
const isMsgResponse = (msg: PossibleMessageTypes): msg is string[] =>
  Array.isArray(msg);

let appPromise: Promise<InstanceType<typeof Client>> | null = null;
const getApp = () => {
  if (!appPromise) {
    appPromise = Client.connect("mkmenta/try-gpt-1-and-gpt-2", {
      events: ["data", "status"],
    });
  }
  return appPromise;
};

const MODEL_CONFIG: Omit<LLMProps, "inp"> = {
  model_name: "GPT-1 (openai-gpt)",
  temperature: 0.8,
  top_p: 0.9,
  rep_pty: 1.0,
  max_length: 256,
};

const INITIAL_MESSAGE: Message = {
  id: "init",
  role: "assistant",
  content:
    "I am an historical artifact (GPT-1) and not a helpful assistant. How can I help?",
  animate: true,
};

export const useChatLLM = () => {
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
  const [isPending, setIsPending] = useState(false);
  const [eta, setEta] = useState<number | null>(null);
  const [initialEta, setInitialEta] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const submission = useRef<ReturnType<InstanceType<typeof Client>["submit"]> | null>(null);
  const initialEtaRef = useRef<number | null>(null);

  const sendMessage = async (text: string) => {
    if (isPending || !text.trim()) return;

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: text.trim(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsPending(true);
    setError(null);
    setEta(null);
    setInitialEta(null);
    initialEtaRef.current = null;

    submission.current?.cancel();

    try {
      const app = await getApp();
      submission.current = app.submit("/generate", {
        ...MODEL_CONFIG,
        inp: text.trim(),
      });

      for await (const entry of submission.current) {
        const msg = entry as unknown as PossibleMessageTypes;

        console.info({
          msg, 
          isMsgQueue: isMsgQueue(msg),
          isMsgResponse: isMsgResponse(msg),
        })

        if (isMsgQueue(msg)) {
          const { eta: newEta } = msg;
          if (initialEtaRef.current === null && newEta > 0) {
            initialEtaRef.current = newEta;
            setInitialEta(newEta);
          }
          setEta(newEta);
          continue;
        }

        if (isMsgResponse(msg)) {
          const content = msg.join("\n").trim();
          const botMsg: Message = {
            id: `bot-${Date.now()}`,
            role: "assistant",
            content,
            animate: true,
          };
          setMessages((prev) => [...prev, botMsg]);
          break;
        }
      }
    } catch (err) {
      setError("The ancient model failed to respond. Try again.");
      console.error("LLM error:", err);
    } finally {
      setIsPending(false);
      setEta(null);
      submission.current = null;
    }
  };

  const progress =
    eta !== null && initialEta !== null && initialEta > 0
      ? Math.max(0, Math.min(1, 1 - eta / initialEta))
      : null;

  return { messages, sendMessage, isPending, eta, progress, error };
};
