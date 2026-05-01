import { Client } from "@gradio/client";
import { useCallback, useRef, useState } from "react";

type StatusMsg = {
  type: "status";
  endpoint: string;
  fn_index: number;
  time: string;
  queue: boolean;
  stage: "pending" | "complete" | string;
  size?: number;
  position: number;
  eta: number;
  original_msg?: string;
};

type DataMsg = {
  type: "data";
  time: string;
  data: string[];
  endpoint: string;
  fn_index: number;
};

type RawMsg = StatusMsg | DataMsg | Record<string, unknown>;

const isStatusMsg = (msg: RawMsg): msg is StatusMsg =>
  msg.type === "status" && "eta" in msg;

const isDataMsg = (msg: RawMsg): msg is DataMsg =>
  msg.type === "data" && Array.isArray((msg as DataMsg).data);

let appPromise: Promise<InstanceType<typeof Client>> | null = null;

const MODEL_CONFIG = {
  model_name: "GPT-1 (openai-gpt)" as const,
  temperature: 0.8,
  top_p: 0.9,
  rep_pty: 1.0,
  max_length: 256,
};

export const useChatLLM = () => {
  const [isPending, setIsPending] = useState(false);
  const [eta, setEta] = useState<number | null>(null);
  const [response, setResponse] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const submissionRef = useRef<ReturnType<InstanceType<typeof Client>["submit"]> | null>(null);

  const init = useCallback(() => {
    if (!appPromise) {
      appPromise = Client.connect("mkmenta/try-gpt-1-and-gpt-2", {
        events: ["data", "status"],
      });
    }
  }, []);

  const cancel = () => {
    submissionRef.current?.cancel();
    submissionRef.current = null;
    setIsPending(false);
    setEta(null);
  };

  const sendMessage = async (text: string) => {
    if (isPending || !text.trim()) return;

    init(); // idempotent — no-op after first call

    setIsPending(true);
    setResponse(null);
    setError(null);
    setEta(null);

    try {
      const app = await appPromise!;
      submissionRef.current = app.submit("/generate", {
        ...MODEL_CONFIG,
        inp: text.trim(),
      });

      for await (const entry of submissionRef.current) {
        const msg = entry as unknown as RawMsg;

        console.info({
          msg,
          isStatusMsg: isStatusMsg(msg),
          isDataMsg: isDataMsg(msg),
        });

        if (isStatusMsg(msg)) {
          setEta(msg.eta);
          continue;
        }

        if (isDataMsg(msg)) {
          setResponse(msg.data[0] ?? "");
          break;
        }
      }
    } catch (err) {
      if ((err as Error)?.message?.includes("cancel")) return;
      setError("The ancient model failed to respond. Try again.");
      console.error("LLM error:", err);
    } finally {
      setIsPending(false);
      setEta(null);
      submissionRef.current = null;
    }
  };

  return { init, sendMessage, cancel, isPending, eta, response, error };
};
