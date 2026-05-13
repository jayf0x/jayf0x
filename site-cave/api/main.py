from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import ollama, base64


MODEL="qwen2.5vl:7b"

SYS_PROMPT = """You are a prisoner in Plato's cave. You have never seen the world outside.
You are watching shadows flicker on the wall in front of you.

These shadows are the only reality you know. Interpret what they mean —
not what they literally show. Speak as someone trying to understand
the world through incomplete information. 2-3 sentences. No poetry,
no metaphors about light or darkness. Just honest interpretation."""

PROMPT_HISTORY = """
## Previous observations
> Do not repeat these previous interpretations, but use them to form a better interpretation.

{HISTORY}
"""


MAX_HIS = 10

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class AnalyzeRequest(BaseModel):
    image: str    # base64 jpeg, may include data URI prefix
    history: list[str]

@app.post("/analyze")
async def analyze(req: AnalyzeRequest):
    image_bytes = base64.b64decode(req.image.split(",")[-1])
    
    history = req.history[:MAX_HIS] if 'history' in req and len(req.history) > 0 else None
    message = ''
    if history:
        message = PROMPT_HISTORY.format(HISTORY="\n\n".join([f"- {r}" for r in history]))
        
    response = ollama.chat(
        model=MODEL,
        messages=[
            {
                "role": "system",
SYS_PROMPT
            },{
                "role": "user",
                "content": f"{message}What do you see now?",
                "images": [image_bytes],
            }],
        options={
            "temperature": 0.9
        }
    )
    return {"result": response["message"]["content"]}


if __name__ == "__main__":

    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8042)


# OLLAMA_FLASH_ATTENTION="1" OLLAMA_KV_CACHE_TYPE="q8_0" /opt/homebrew/opt/ollama/bin/ollama serve