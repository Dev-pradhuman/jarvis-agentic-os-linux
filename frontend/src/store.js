import { create } from 'zustand';

/**
 * Global Jarvis state (Section 1). Three domains, no prop-drilling:
 *   - Audio    : drives the 3D core sphere + status lights
 *   - Skills   : progress cards + terminal feed
 *   - Popups   : glassmorphism context cards (z-index stacking)
 */
export const useJarvisStore = create((set) => ({
  // ---- Connection ----
  connected: false, // orchestrator WebSocket reachable
  setConnected: (connected) => set({ connected }),

  // ---- Live system state (real data pushed by the orchestrator) ----
  liveState: null, // { vitals, documents, directives, calendar, tokens, tokensLabel }
  setLiveState: (liveState) => set({ liveState }),

  // ---- Audio ----
  isListening: false,
  decibelLevel: 0, // normalized 0..1
  isSpeaking: false,
  setListening: (isListening) => set({ isListening }),
  setDecibel: (decibelLevel) => set({ decibelLevel }),
  setSpeaking: (isSpeaking) => set({ isSpeaking }),

  // ---- Skill queue ----
  activeSkills: [], // SkillStateUpdate[]
  historicalLogs: [], // string[] (terminal feed lines)
  upsertSkill: (update) =>
    set((s) => {
      const i = s.activeSkills.findIndex((sk) => sk.skillId === update.skillId);
      const next = [...s.activeSkills];
      if (i === -1) next.push(update);
      else next[i] = { ...next[i], ...update };
      return { activeSkills: next };
    }),
  removeSkill: (skillId) =>
    set((s) => ({ activeSkills: s.activeSkills.filter((sk) => sk.skillId !== skillId) })),
  pushLog: (line) =>
    set((s) => ({ historicalLogs: [...s.historicalLogs.slice(-499), line] })),

  // ---- Context popups ----
  activePopups: [], // ContextPopup[]
  addPopup: (popup) => set((s) => ({ activePopups: [...s.activePopups, popup] })),
  removePopup: (id) =>
    set((s) => ({ activePopups: s.activePopups.filter((p) => p.id !== id) })),
  clearPopups: () => set({ activePopups: [] }),
}));

// Convenience selector used by the audio-reactive sphere.
export const useAudioStore = useJarvisStore;
