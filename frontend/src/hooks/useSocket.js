import { useEffect } from 'react';
import { io } from 'socket.io-client';
import { useJarvisStore } from '../store';
import { extractSpokenSummary, speak } from '../lib/tts';

const ORCHESTRATOR_URL = 'http://localhost:3000';

let socket; // module singleton

/**
 * Connects to the orchestrator and pipes WS events into the Zustand store.
 * Mount once near the app root.
 */
export function useSocket() {
  const upsertSkill = useJarvisStore((s) => s.upsertSkill);
  const pushLog = useJarvisStore((s) => s.pushLog);
  const clearPopups = useJarvisStore((s) => s.clearPopups);
  const setConnected = useJarvisStore((s) => s.setConnected);
  const setLiveState = useJarvisStore((s) => s.setLiveState);

  useEffect(() => {
    socket = io(ORCHESTRATOR_URL, { transports: ['websocket'] });

    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));
    socket.on('connect_error', () => setConnected(false));

    socket.on('terminal_log', (line) => pushLog(line));
    socket.on('skill_state', (update) => {
      upsertSkill(update);
      // On completion, speak the skill's summary line via the local TTS engine.
      if (update.status === 'COMPLETED' && update.outputPayload) {
        speak(extractSpokenSummary(update.outputPayload));
      }
    });
    socket.on('routing_decision', (d) =>
      pushLog(`[router] ${d.matchedTier} -> ${d.targetSkillId ?? 'UNMATCHED'}`),
    );
    socket.on('ui_intent', ({ intent }) => {
      if (intent === 'UI_CLEAR_CONTEXT') clearPopups();
    });
    socket.on('state_update', (state) => setLiveState(state));

    return () => {
      socket.disconnect();
      setConnected(false);
    };
  }, [upsertSkill, pushLog, clearPopups, setConnected, setLiveState]);
}

/** Send an STT transcript to the router (Tier 1/2/3 resolution). */
export function sendTranscript(transcriptId, text) {
  socket?.emit('transcript', { transcriptId, text });
}

/** Directly trigger a skill by its backend id (bypasses the router). */
export function sendSkill(skillId, parameters = {}) {
  socket?.emit('run_skill', { skillId, parameters });
}
