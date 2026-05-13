from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import ollama, base64, re


MODEL = "qwen3.5:9b"

SYS_PROMPT = """You are a prisoner in Plato's cave. You have never seen the world outside.
You are watching shadows flicker on the wall in front of you.

These shadows are the only reality you know. Interpret what they mean —
not what they literally show. Speak as someone trying to understand
the world through incomplete information. 2-3 sentences. No poetry,
no metaphors about light or darkness. Just honest interpretation."""

PROMPT_HISTORY = """## Previous observations
> Do not repeat these, but use them to form a better interpretation.

{HISTORY}"""

MODEL_OPTIONS = {
    "presence_penalty": 1.5,
    "temperature": 1,
    "top_k": 20,
    "top_p": 0.95,
}

MAX_HIS = 10

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

_client = ollama.AsyncClient()


def extract_thoughts(content: str) -> tuple[str, str]:
    """Split <think>...</think> out of the response. Returns (thinking, clean_text)."""
    match = re.search(r"<think>(.*?)</think>", content, re.DOTALL)
    if match:
        thinking = match.group(1).strip()
        text = (content[: match.start()] + content[match.end() :]).strip()
        return thinking, text
    return "", content.strip()


class AnalyzeRequest(BaseModel):
    image: str          # base64 jpeg, may include data URI prefix
    history: list[str]
    think: bool = False # let the frontend opt into chain-of-thought


@app.post("/analyze")
async def analyze(req: AnalyzeRequest):
    image_bytes = base64.b64decode(req.image.split(",")[-1])

    messages = [{"role": "system", "content": SYS_PROMPT}]

    # Inject recent history as a synthetic assistant turn so the model
    # treats it as its own prior context — avoids consecutive user messages.
    history = req.history[-MAX_HIS:]
    if history:
        messages.append({
            "role": "assistant",
            "content": PROMPT_HISTORY.format(
                HISTORY="\n".join(f"- {r}" for r in history)
            ),
        })

    messages.append({
        "role": "user",
        "content": "What do you see now?",
        "images": [image_bytes],
    })

    response = await _client.chat(
        model=MODEL,
        messages=messages,
        think=req.think,
        options=MODEL_OPTIONS,
    )

    thinking, text = extract_thoughts(response["message"]["content"])
    return {"result": text, "thoughts": thinking}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8042)


# OLLAMA_FLASH_ATTENTION="1" OLLAMA_KV_CACHE_TYPE="q8_0" /opt/homebrew/opt/ollama/bin/ollama serve