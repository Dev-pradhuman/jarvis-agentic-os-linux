"""
Jarvis STT microservice — faster-whisper transcription.

CRITICAL: the model is loaded once at GLOBAL SCOPE (module import), NOT inside the
route handler. Loading inside the route would add 3-5s of weight-loading latency to
every single voice command. Keeping it hot in RAM/VRAM gives sub-second turnaround.

Device selection: this machine has no NVIDIA GPU (Intel Arc), so the default is CPU
with int8 compute. Override with JARVIS_DEVICE=cuda / JARVIS_COMPUTE=float16 on an
NVIDIA box.
"""

import os
import tempfile

from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from faster_whisper import WhisperModel

DEVICE = os.getenv("JARVIS_DEVICE", "cpu")          # "cpu" | "cuda"
COMPUTE = os.getenv("JARVIS_COMPUTE", "int8")       # "int8" (cpu) | "float16" (cuda)
MODEL_SIZE = os.getenv("JARVIS_STT_MODEL", "base.en")

app = FastAPI(title="Jarvis STT Node")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # local dev — the frontend posts audio directly here
    allow_methods=["*"],
    allow_headers=["*"],
)

print(f"[STT] Loading Whisper '{MODEL_SIZE}' on {DEVICE} ({COMPUTE})...")
stt_model = WhisperModel(MODEL_SIZE, device=DEVICE, compute_type=COMPUTE)
print("[STT] Model hot. Ready.")


@app.get("/health")
async def health():
    return {"status": "ok", "model": MODEL_SIZE, "device": DEVICE}


@app.post("/api/v1/transcribe")
async def transcribe_audio(file: UploadFile = File(...)):
    with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as tmp:
        tmp.write(await file.read())
        tmp_path = tmp.name
    try:
        segments, info = stt_model.transcribe(tmp_path, beam_size=5)
        transcript = "".join(segment.text for segment in segments).strip()
        return {
            "status": "success",
            "transcript": transcript,
            "language": info.language,
            "probability": info.language_probability,
        }
    finally:
        os.remove(tmp_path)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="127.0.0.1", port=8000)
