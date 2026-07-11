/**
 * Jarvis Orchestrator — WebSocket hub + HTTP surface.
 *
 * Flow: frontend sends a transcript over WS -> router resolves an intent ->
 * skillRunner spawns headless Claude Code -> stdout + SkillStateUpdate events
 * stream back to the frontend Live Terminal Feed and progress cards.
 *
 * Also broadcasts a live `state_update` (real vitals, documents, directives,
 * calendar, token usage) to all clients on an interval.
 */

import 'dotenv/config';
import http from 'node:http';
import cors from 'cors';
import express from 'express';
import { Server } from 'socket.io';

import { route } from './router.js';
import { runSkill } from './skillRunner.js';
import { SKILLS, UI_INTENTS } from './skills.js';
import { getState, recordTokens, sampleTokens } from './state.js';

const PORT = Number(process.env.PORT || 3000);

const app = express();
app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'orchestrator' }));
app.get('/skills', (_req, res) => res.json(Object.values(SKILLS)));
app.get('/state', (_req, res) => res.json(getState(running)));

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

let running = 0; // skills currently executing (drives the AGENTS vital)

function emitSkillState(update) {
  io.emit('skill_state', update);
}

/**
 * Execute a skill end-to-end: emit RUNNING, spawn claude, stream stdout, record
 * real token usage, emit COMPLETED/FAILED. Shared by the router and button paths.
 */
async function executeSkill(skill, parameters) {
  running += 1;
  io.emit('state_update', getState(running));

  emitSkillState({
    skillId: skill.id,
    status: 'RUNNING',
    progressPercentage: 5,
    currentActionLog: `Starting ${skill.label}...`,
  });

  const result = await runSkill(skill.sop, parameters ?? {}, (line) => {
    io.emit('terminal_log', line);
  });

  // Real token accounting: prompt chars in + output chars out.
  recordTokens((result.promptChars ?? 0) + result.output.length);

  running = Math.max(0, running - 1);
  emitSkillState({
    skillId: skill.id,
    status: result.status === 'success' ? 'COMPLETED' : 'FAILED',
    progressPercentage: 100,
    currentActionLog: result.status === 'success' ? 'Done.' : 'Failed — see terminal.',
    outputPayload: result.output,
  });
  io.emit('state_update', getState(running));
}

io.on('connection', (socket) => {
  console.log(`[ws] client connected: ${socket.id}`);
  socket.emit('state_update', getState(running)); // seed immediately

  // The frontend forwards STT output here.
  socket.on('transcript', async ({ transcriptId, text }) => {
    const decision = await route(transcriptId, text);
    io.emit('routing_decision', decision);

    const { targetSkillId } = decision;
    if (!targetSkillId) return; // UNMATCHED / CONVERSATION — nothing to execute

    if (UI_INTENTS.has(targetSkillId)) {
      io.emit('ui_intent', { intent: targetSkillId });
      return;
    }

    const skill = SKILLS[targetSkillId];
    if (skill) await executeSkill(skill, decision.extractedParameters);
  });

  // Direct skill trigger from a Skill Matrix button click (bypasses the router).
  socket.on('run_skill', async ({ skillId, parameters }) => {
    const skill = SKILLS[skillId];
    if (!skill) {
      io.emit('terminal_log', `[jarvis] unknown skill: ${skillId}\n`);
      return;
    }
    await executeSkill(skill, parameters);
  });

  socket.on('disconnect', () => console.log(`[ws] client left: ${socket.id}`));
});

// Live-state heartbeat: sample the token series and push a fresh snapshot.
setInterval(() => {
  sampleTokens();
  io.emit('state_update', getState(running));
}, 3000);

server.listen(PORT, () => console.log(`[jarvis] orchestrator on http://localhost:${PORT}`));
