"""
End-to-end round-trip smoke test: text -> TTS(:8001) -> WAV -> STT(:8000) -> text.

Run with both services up (from the ml/ venv):
    python roundtrip_test.py
"""

import io
import sys

import requests

STT_URL = "http://localhost:8000/api/v1/transcribe"
TTS_URL = "http://localhost:8001/api/v1/synthesize"

PHRASE = "Good morning. Jarvis is online and all systems are nominal."


def main() -> int:
    # 1. Synthesize speech from text.
    r = requests.post(TTS_URL, json={"text": PHRASE}, timeout=120)
    r.raise_for_status()
    if r.headers.get("content-type", "").startswith("application/json"):
        print(f"[FAIL] TTS returned JSON (model not loaded?): {r.text}")
        return 1
    wav_bytes = r.content
    print(f"[TTS] synthesized {len(wav_bytes)} bytes of WAV audio")

    # 2. Transcribe it back.
    files = {"file": ("roundtrip.wav", io.BytesIO(wav_bytes), "audio/wav")}
    r2 = requests.post(STT_URL, files=files, timeout=120)
    r2.raise_for_status()
    result = r2.json()
    transcript = result.get("transcript", "")
    print(f"[STT] transcript: {transcript!r}")
    print(f"[STT] language={result.get('language')} p={result.get('probability')}")

    # 3. Loose match — TTS/STT won't be byte-identical, so check keyword overlap.
    spoken = {w.strip('.,').lower() for w in PHRASE.split()}
    heard = {w.strip('.,').lower() for w in transcript.split()}
    overlap = spoken & heard
    ratio = len(overlap) / len(spoken) if spoken else 0
    print(f"[MATCH] {len(overlap)}/{len(spoken)} words overlap ({ratio:.0%})")
    if ratio >= 0.6:
        print("[PASS] round-trip successful.")
        return 0
    print("[FAIL] transcript diverged too much from source.")
    return 1


if __name__ == "__main__":
    sys.exit(main())
