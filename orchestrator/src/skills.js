/**
 * Central skill registry. The router maps intents to these ids; the runner loads
 * a matching SOP from `vault/99_System/Skills/<id>.md`.
 */
export const SKILLS = {
  SKILL_MORNING_BRIEF: {
    id: 'SKILL_MORNING_BRIEF',
    label: 'Morning Report',
    sop: 'SKILL_MORNING_BRIEF.md',
  },
  SKILL_INBOX_TRIAGE: {
    id: 'SKILL_INBOX_TRIAGE',
    label: 'Inbox Brief',
    sop: 'SKILL_INBOX_TRIAGE.md',
  },
  SKILL_DEEP_RESEARCH: {
    id: 'SKILL_DEEP_RESEARCH',
    label: 'Deep Research',
    sop: 'SKILL_DEEP_RESEARCH.md',
  },
  SKILL_SCHEDULE_CHECK: {
    id: 'SKILL_SCHEDULE_CHECK',
    label: 'Schedule Check',
    sop: 'SKILL_SCHEDULE_CHECK.md',
  },
  SKILL_CREATE_NOTE: {
    id: 'SKILL_CREATE_NOTE',
    label: 'Create Note',
    sop: 'SKILL_CREATE_NOTE.md',
  },
};

/** Pure-UI intents that never hit Claude Code. */
export const UI_INTENTS = new Set(['UI_CLEAR_CONTEXT']);
