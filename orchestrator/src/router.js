/**
 * 3-Tier Intent Routing Engine.
 *
 * Every transcript is evaluated in order, stopping at the FIRST match, to minimize
 * both latency and API cost:
 *   Tier 1  RegEx        — 0ms, deterministic exact triggers
 *   Tier 2  Haiku LLM    — semantic classification for the fuzzy middle
 *   Tier 3  Local LLM    — offline / privacy-sensitive fallback (stubbed)
 *
 * @typedef {Object} RoutingDecision
 * @property {string}  transcriptId
 * @property {'REGEX'|'HAIKU'|'LOCAL'|'UNMATCHED'} matchedTier
 * @property {string|null} targetSkillId
 * @property {Record<string, any>} extractedParameters
 */

import Anthropic from '@anthropic-ai/sdk';

// ---- Tier 1: deterministic RegEx dictionary -------------------------------
const REGEX_RULES = [
  { re: /(give me the|what is the|what's the) rundown/i, skill: 'SKILL_MORNING_BRIEF' },
  { re: /(check|read)( my)? inbox/i, skill: 'SKILL_INBOX_TRIAGE' },
  { re: /(clear|close) (the )?(screen|popups?)/i, skill: 'UI_CLEAR_CONTEXT' },
];

// ---- Tier 2: Haiku semantic classifier ------------------------------------
const ROUTER_SYSTEM_PROMPT = `You are the routing engine for an Agentic OS.
Map the user's request to exactly ONE of the following Skill IDs.
If the request is conversational and requires no action, return 'CONVERSATION'.
If no skill matches, return 'UNKNOWN'.

Available Skills:
- SKILL_DEEP_RESEARCH: User wants to search the web or YouTube for a topic.
- SKILL_SCHEDULE_CHECK: User asks about their calendar or day.
- SKILL_CREATE_NOTE: User wants to save a thought to Obsidian.
- SKILL_MORNING_BRIEF: User wants their daily rundown / morning report.
- SKILL_INBOX_TRIAGE: User wants their email triaged.

Return ONLY a valid JSON object: { "skillId": "...", "parameters": {} }`;

const anthropic = process.env.ANTHROPIC_API_KEY
  ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  : null;

const ROUTER_MODEL = process.env.JARVIS_ROUTER_MODEL || 'claude-haiku-4-5-20251001';

/** @returns {RoutingDecision} */
function tier1(transcriptId, text) {
  for (const { re, skill } of REGEX_RULES) {
    if (re.test(text)) {
      return { transcriptId, matchedTier: 'REGEX', targetSkillId: skill, extractedParameters: {} };
    }
  }
  return null;
}

/** @returns {Promise<RoutingDecision|null>} */
async function tier2(transcriptId, text) {
  if (!anthropic) return null; // no key configured — skip to Tier 3
  const msg = await anthropic.messages.create({
    model: ROUTER_MODEL,
    max_tokens: 256,
    system: ROUTER_SYSTEM_PROMPT,
    messages: [{ role: 'user', content: `User Transcript: "${text}"` }],
  });
  const raw = msg.content.find((b) => b.type === 'text')?.text ?? '';
  try {
    const parsed = JSON.parse(raw.trim());
    const skillId = parsed.skillId;
    if (!skillId || skillId === 'UNKNOWN' || skillId === 'CONVERSATION') {
      return {
        transcriptId,
        matchedTier: 'HAIKU',
        targetSkillId: skillId === 'CONVERSATION' ? 'CONVERSATION' : null,
        extractedParameters: parsed.parameters || {},
      };
    }
    return {
      transcriptId,
      matchedTier: 'HAIKU',
      targetSkillId: skillId,
      extractedParameters: parsed.parameters || {},
    };
  } catch {
    return null;
  }
}

/** Tier 3 — local LLM fallback. Stub: wire to a local server (e.g. Ollama) later. */
async function tier3(transcriptId /*, text */) {
  return { transcriptId, matchedTier: 'UNMATCHED', targetSkillId: null, extractedParameters: {} };
}

/**
 * Route a transcript through all three tiers.
 * @returns {Promise<RoutingDecision>}
 */
export async function route(transcriptId, text) {
  return (
    tier1(transcriptId, text) ||
    (await tier2(transcriptId, text)) ||
    (await tier3(transcriptId, text))
  );
}
