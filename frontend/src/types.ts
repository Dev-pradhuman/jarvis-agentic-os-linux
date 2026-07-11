// Core data contracts — keep frontend/backend state in sync (Section 1).

/** Raw PCM audio pushed from the Web Audio API. */
export interface AudioChunk {
  timestamp: number;
  buffer: Float32Array;
  isFinal: boolean; // true when silence is detected
}

/** STT output. */
export interface TranscriptResult {
  transcriptId: string;
  text: string;
  confidence: number;
  processingTimeMs: number;
}

/** Routing engine decision (Section 2). */
export interface RoutingDecision {
  transcriptId: string;
  matchedTier: 'REGEX' | 'HAIKU' | 'LOCAL' | 'UNMATCHED';
  targetSkillId: string | null;
  extractedParameters: Record<string, unknown>;
}

/** Drives frontend progress cards + terminal feed. */
export interface SkillStateUpdate {
  skillId: string;
  status: 'QUEUED' | 'RUNNING' | 'AWAITING_INPUT' | 'COMPLETED' | 'FAILED';
  progressPercentage: number;
  currentActionLog: string;
  outputPayload?: unknown;
}

export interface ContextPopup {
  id: string;
  title: string;
  markdownBody: string;
  sourceLink?: string; // e.g. obsidian://open?vault=...
}
