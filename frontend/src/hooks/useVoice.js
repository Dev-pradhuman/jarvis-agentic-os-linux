import { useCallback, useRef } from 'react';
import { useJarvisStore } from '../store';
import { sendTranscript } from './useSocket';

const STT_URL = 'http://localhost:8000/api/v1/transcribe';

/**
 * Push-to-talk voice capture. toggle() starts/stops recording; on stop the audio
 * is POSTed to the local STT service and the transcript is handed to the router.
 * While recording, the mic level feeds `decibelLevel` so the core sphere reacts.
 *
 * faster-whisper decodes via PyAV/ffmpeg, so the MediaRecorder webm/opus blob is
 * transcribed fine even though the service names its temp file .wav.
 */
export function useVoice() {
  const setListening = useJarvisStore((s) => s.setListening);
  const setDecibel = useJarvisStore((s) => s.setDecibel);
  const pushLog = useJarvisStore((s) => s.pushLog);

  const recRef = useRef(null);
  const chunksRef = useRef([]);
  const streamRef = useRef(null);
  const ctxRef = useRef(null);
  const rafRef = useRef(0);

  const cleanupAudio = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    setDecibel(0);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    ctxRef.current?.close().catch(() => {});
    streamRef.current = null;
    ctxRef.current = null;
  }, [setDecibel]);

  const start = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Analyser → normalized level for the audio-reactive sphere.
      const ctx = new AudioContext();
      ctxRef.current = ctx;
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 512;
      ctx.createMediaStreamSource(stream).connect(analyser);
      const data = new Uint8Array(analyser.frequencyBinCount);
      const tick = () => {
        analyser.getByteFrequencyData(data);
        let sum = 0;
        for (const v of data) sum += v;
        setDecibel(sum / data.length / 255);
        rafRef.current = requestAnimationFrame(tick);
      };
      tick();

      const rec = new MediaRecorder(stream);
      recRef.current = rec;
      chunksRef.current = [];
      rec.ondataavailable = (e) => e.data.size && chunksRef.current.push(e.data);
      rec.onstop = async () => {
        cleanupAudio();
        setListening(false);
        const blob = new Blob(chunksRef.current, { type: rec.mimeType || 'audio/webm' });
        if (!blob.size) return;
        pushLog('[voice] transcribing…');
        try {
          const fd = new FormData();
          fd.append('file', blob, 'speech.webm');
          const r = await fetch(STT_URL, { method: 'POST', body: fd });
          const j = await r.json();
          const text = (j.transcript || '').trim();
          pushLog(`[voice] heard: "${text}"`);
          if (text) sendTranscript(`v-${Date.now()}`, text);
        } catch (e) {
          pushLog(`[voice] STT error: ${e.message}`);
        }
      };
      rec.start();
      setListening(true);
      pushLog('[voice] listening…');
    } catch (e) {
      pushLog(`[voice] mic error: ${e.message}`);
      setListening(false);
      cleanupAudio();
    }
  }, [setListening, setDecibel, pushLog, cleanupAudio]);

  const stop = useCallback(() => {
    const rec = recRef.current;
    if (rec && rec.state !== 'inactive') rec.stop();
  }, []);

  const toggle = useCallback(() => {
    if (useJarvisStore.getState().isListening) stop();
    else start();
  }, [start, stop]);

  return { toggle };
}
