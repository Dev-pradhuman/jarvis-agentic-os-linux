/**
 * MCP tool-bridge for API providers. CLIs load MCP via their own config, but a raw
 * OpenAI-compatible endpoint can't — so here the orchestrator acts as the MCP host:
 * connect to enabled MCP servers, expose their tools to the model via the OpenAI
 * `tools` param, execute any tool calls, and feed results back until the model
 * answers. Degrades gracefully: if MCP can't connect, chat proceeds tool-less.
 */

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { enabledForBridge } from './mcp.js';

// Cold-starting a stdio server (`npx -y …`) can take tens of seconds, so a
// sequential connect with no timeout could stall a chat indefinitely. We connect
// every server in PARALLEL under a per-server deadline, and REUSE the resulting
// connections across chats (an MCP host normally keeps servers alive) — otherwise
// every message would respawn all of them.
const CONNECT_TIMEOUT_MS = Number(process.env.JARVIS_MCP_CONNECT_TIMEOUT_MS || 20000);

let cache = null; // { sig, clients, tools, toolMap }

/** Identity of the enabled server set — a change invalidates the cache. */
function signature(servers) {
  return servers.map((s) => `${s.name}:${s.command}:${(s.args || []).join(' ')}:${s.url || ''}`).join('|');
}

function withTimeout(promise, ms, label) {
  let timer;
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      timer = setTimeout(() => reject(new Error(`timed out after ${ms}ms`)), ms);
    }),
  ]).finally(() => clearTimeout(timer)).catch((e) => {
    throw new Error(`${label}: ${e.message}`);
  });
}

/** Connect one server and return its client + tool schemas. */
async function connectOne(s) {
  const client = new Client({ name: 'jarvis', version: '1.0.0' }, { capabilities: {} });
  const transport =
    s.transport === 'http'
      ? new StreamableHTTPClientTransport(new URL(s.url))
      : new StdioClientTransport({ command: s.command, args: s.args, env: { ...process.env, ...s.env } });
  await withTimeout(client.connect(transport), CONNECT_TIMEOUT_MS, 'connect');
  const list = await withTimeout(client.listTools(), CONNECT_TIMEOUT_MS, 'listTools');
  return { client, server: s, mcpTools: list.tools || [] };
}

async function closeAll(clients) {
  for (const c of clients || []) {
    try { await c.close(); } catch { /* ignore */ }
  }
}

/** Connect to all enabled MCP servers and collect their tools (parallel + cached). */
export async function connectTools(onLog = () => {}) {
  const servers = enabledForBridge();
  const sig = signature(servers);
  if (cache && cache.sig === sig) return cache; // reuse the live servers

  await closeAll(cache?.clients); // enabled set changed — drop the old ones
  cache = null;

  const settled = await Promise.allSettled(servers.map((s) => connectOne(s)));

  const clients = [];
  const tools = []; // OpenAI tool schema
  const toolMap = new Map(); // toolName -> { client, tool }

  settled.forEach((res, i) => {
    const name = servers[i].name;
    if (res.status !== 'fulfilled') {
      onLog(`[mcp] ${name} failed: ${res.reason?.message || res.reason}\n`);
      return;
    }
    const { client, mcpTools } = res.value;
    clients.push(client);
    for (const t of mcpTools) {
      const fqn = `${name}__${t.name}`.slice(0, 64);
      tools.push({
        type: 'function',
        function: {
          name: fqn,
          description: t.description || `${name} tool ${t.name}`,
          parameters: t.inputSchema || { type: 'object', properties: {} },
        },
      });
      toolMap.set(fqn, { client, tool: t.name });
    }
    onLog(`[mcp] ${name}: ${mcpTools.length} tools\n`);
  });

  cache = { sig, clients, tools, toolMap };
  return cache;
}

/** Drop all cached connections (e.g. after a server misbehaves). */
export async function resetTools() {
  await closeAll(cache?.clients);
  cache = null;
}

export async function callTool(toolMap, fqn, argsJson) {
  const entry = toolMap.get(fqn);
  if (!entry) return { error: `unknown tool ${fqn}` };
  let args = {};
  try {
    args = argsJson ? JSON.parse(argsJson) : {};
  } catch {
    /* leave empty */
  }
  const res = await entry.client.callTool({ name: entry.tool, arguments: args });
  // Flatten MCP content blocks to text.
  const text = (res.content || [])
    .map((c) => (c.type === 'text' ? c.text : JSON.stringify(c)))
    .join('\n');
  return { text: text || JSON.stringify(res) };
}

/**
 * No-op by design: connections are cached and reused across chats (see
 * connectTools). Callers still invoke this at the end of a run — closing here
 * would respawn every server on the next message. Use resetTools() to tear down.
 */
export async function closeClients(/* clients */) {
  /* intentionally empty — cached connections outlive a single chat */
}
