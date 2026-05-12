from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import ollama, base64

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

class AnalyzeRequest(BaseModel):
    image: str    # base64 jpeg, may include data URI prefix
    prompt: str

@app.post("/analyze")
async def analyze(req: AnalyzeRequest):
    image_bytes = base64.b64decode(req.image.split(",")[-1])

    response = ollama.chat(
        model="qwen2.5vl:7b",
        messages=[{
            "role": "user",
            "content": req.prompt,
            "images": [image_bytes],
        }]
    )
    return {"result": response["message"]["content"]}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8042)
