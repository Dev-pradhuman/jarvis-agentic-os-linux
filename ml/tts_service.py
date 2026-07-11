"""
Jarvis TTS microservice — Kokoro ONNX synthesis.

Same cold-start rule as STT: the model is loaded once at GLOBAL SCOPE so voice
responses don't pay the weight-loading tax on every request.

Model + voices are NOT vendored in the repo (see .gitignore). kokoro-onnx 0.4.x
expects the v1.0 assets. Fetch them into ml/ (run from the ml/ folder):
  curl -L -o kokoro-v1.0.onnx https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/kokoro-v1.0.onnx
  curl -L -o voices-v1.0.bin  https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/voices-v1.0.bin
"""

import io
import os

import soundfile as sf
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

MODEL_PATH = os.getenv("JARVIS_TTS_MODEL", "kokoro-v1.0.onnx")
VOICES_PATH = os.getenv("JARVIS_TTS_VOICES", "voices-v1.0.bin")
DEFAULT_VOICE = os.getenv("JARVIS_TTS_VOICE", "af_sarah")

app = FastAPI(title="Jarvis TTS Node")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # local dev — the frontend requests synthesis directly
    allow_methods=["*"],
    allow_headers=["*"],
)

print(f"[TTS] Loading Kokoro '{MODEL_PATH}' (voices: {VOICES_PATH})...")
# NOTE: the exact import/constructor depends on the installed kokoro package.
# kokoro-onnx exposes `from kokoro_onnx import Kokoro`. Keep this in one place so
# swapping the backend is a one-line change.
try:
    from kokoro_onnx import Kokoro

    tts_model = Kokoro(MODEL_PATH, VOICES_PATH)
    _BACKEND = "kokoro_onnx"
except Exception as exc:  # pragma: no cover - depends on local weights being present
    print(f"[TTS] WARNING: model not loaded yet ({exc}). "
          f"Place weights per the module docstring, then restart.")
    tts_model = None
    _BACKEND = None
print("[TTS] Ready." if tts_model else "[TTS] Started WITHOUT model (stub mode).")


class TTSRequest(BaseModel):
    text: str
    voice: str = DEFAULT_VOICE
    speed: float = 1.0


@app.get("/health")
async def health():
    return {"status": "ok", "loaded": tts_model is not None, "backend": _BACKEND}


@app.post("/api/v1/synthesize")
async def synthesize_text(request: TTSRequest):
    if tts_model is None:
        return {"status": "error", "detail": "TTS model not loaded — see docstring."}

    # kokoro_onnx: create(text, voice, speed, lang) -> (samples, sample_rate)
    audio_data, sample_rate = tts_model.create(
        request.text, voice=request.voice, speed=request.speed, lang="en-us"
    )
    buffer = io.BytesIO()
    sf.write(buffer, audio_data, sample_rate, format="WAV", subtype="PCM_16")
    buffer.seek(0)
    return StreamingResponse(buffer, media_type="audio/wav")


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="127.0.0.1", port=8001)
