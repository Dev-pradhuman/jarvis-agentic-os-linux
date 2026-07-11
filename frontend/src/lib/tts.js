import { useJarvisStore } from '../store';

const TTS_URL = 'http://localhost:8001/api/v1/synthesize';

let currentAudio = null;

/** Synthesize `text` via the local TTS service and play it back. */
export async function speak(text) {
  if (!text) return;
  const setSpeaking = useJarvisStore.getState().setSpeaking;
  try {
    const r = await fetch(TTS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });
    // Stub mode (no weights loaded) returns JSON instead of audio — skip playback.
    if (!(r.headers.get('content-type') || '').includes('audio')) return;

    const blob = new Blob([await r.arrayBuffer()], { type: 'audio/wav' });
    const url = URL.createObjectURL(blob);
    currentAudio?.pause();
    const audio = new Audio(url);
    currentAudio = audio;
    setSpeaking(true);
    audio.onended = () => {
      setSpeaking(false);
      URL.revokeObjectURL(url);
    };
    await audio.play();
  } catch {
    setSpeaking(false);
  }
}

/**
 * Pull the spoken line out of a skill's stdout. Our SOPs end with a 🔊-marked
 * summary for the TTS engine; fall back to the last non-empty line.
 */
export function extractSpokenSummary(output) {
  if (!output) return '';
  const lines = String(output)
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  const spoken = lines.find((l) => l.includes('🔊')) || lines[lines.length - 1] || '';
  return spoken
    .replace(/🔊/g, '')
    .replace(/[*_`>#]/g, '')
    .replace(/^[-\s]+/, '')
    .trim()
    .slice(0, 400);
}
