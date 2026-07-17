import { useEffect } from "react";
import { Activity, AlertTriangle, Clock, Coins, Cpu, HardDrive, Hash, TrendingUp } from "lucide-react";
import { useJarvisStore } from "../store";
import { requestUsage } from "../hooks/useSocket";
import { agentColor, agentLabel } from "./shared";
import { Skeleton, StatTile } from "./ui";

function fmtNum(n?: number) {
  if (n == null) return "0";
  if (n >= 1e6) return `${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
  return String(n);
}
function fmtDur(ms?: number) {
  if (!ms) return "—";
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${(ms / 60000).toFixed(1)}m`;
}

export function UsageTab() {
  const usage = useJarvisStore((s) => s.usage);
  const connected = useJarvisStore((s) => s.connected);
  const tokens = useJarvisStore((s) => s.liveState?.tokens) as number[] | undefined;

  useEffect(() => { requestUsage(); }, []);

  const loading = !usage; // usage_update hasn't landed yet
  const live = usage?.live;
  const totals = usage?.totals;
  const agents = usage?.agents ?? [];
  const memPct = live ? Math.round(((live.totalMemMb - live.freeMemMb) / live.totalMemMb) * 100) : 0;
  const maxTok = Math.max(1, ...(tokens ?? [0]));

  return (
    <div className="h-full w-full overflow-y-auto p-4" style={{ scrollbarWidth: "none" }}>
      <div className="flex items-center gap-2 mb-4">
        <Activity className="h-4 w-4" style={{ color: "#22d3ee" }} />
        <h2 className="font-mono text-[12px] tracking-[0.25em] uppercase text-white/90">Usage</h2>
        <span className="font-mono text-[10px] text-muted-foreground">
          {connected ? "live — aggregated from the shared brain" : "connecting…"}
        </span>
      </div>

      {/* Live telemetry + totals */}
      <div className="grid gap-3 mb-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(168px, 1fr))" }}>
        <StatTile icon={Cpu} label="CPU" value={`${live?.cpuPct ?? 0}%`} sub={`${live?.cores ?? 0} cores`} color="#22d3ee" loading={loading} />
        <StatTile icon={HardDrive} label="Memory" value={`${live?.rssMb ?? 0} MB`} sub={`sys ${memPct}%`} color="#10b981" loading={loading} />
        <StatTile icon={Activity} label="Agents live" value={live?.agentsRunning ?? 0} sub={`up ${Math.round((live?.uptimeSec ?? 0) / 60)}m`} color="#f59e0b" loading={loading} />
        <StatTile icon={Hash} label="Total runs" value={fmtNum(totals?.runs)} sub="all agents" color="#8b5cf6" loading={loading} />
        <StatTile icon={Coins} label="Tokens" value={fmtNum(totals?.tokens)} sub="lifetime" color="#a78bfa" loading={loading} />
        <StatTile icon={TrendingUp} label="Est. cost" value={`$${(totals?.cost ?? 0).toFixed(2)}`} sub="api only · local=$0" color="#ec4899" loading={loading} />
        <StatTile icon={Clock} label="Avg exec" value={fmtDur(totals?.avgDurationMs)} sub="per run" color="#3b82f6" loading={loading} />
      </div>

      {/* Token throughput (live series) */}
      <div className="glass-panel p-4 mb-4 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(90% 140% at 0% 0%, rgba(139,92,246,0.10), transparent 65%)" }} />
        <div className="flex items-center gap-2 mb-3 relative">
          <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Token throughput</span>
          <span className="h-1.5 w-1.5 rounded-full" style={{ background: "#10b981", boxShadow: "0 0 6px rgba(16,185,129,0.9)" }} />
          <span className="ml-auto font-mono text-[9px] uppercase tracking-wider text-muted-foreground">tokens · live</span>
        </div>
        <div className="flex items-end gap-1 h-[80px] relative">
          {loading && Array.from({ length: 28 }).map((_, i) => (
            <Skeleton key={i} className="flex-1 rounded-t" style={{ height: `${20 + ((i * 37) % 60)}%` }} />
          ))}
          {!loading && (tokens ?? []).map((t, i) => (
            <div key={i} className="flex-1 rounded-t transition-all"
              style={{
                height: `${(t / maxTok) * 100}%`, minHeight: 2,
                background: "linear-gradient(to top, #8b5cf6, #22d3ee)",
                opacity: 0.4 + (i / (tokens?.length || 1)) * 0.6,
              }} />
          ))}
          {!loading && (tokens ?? []).length === 0 && (
            <div className="w-full text-center font-mono text-[11px] text-muted-foreground self-center">No throughput yet.</div>
          )}
        </div>
      </div>

      {/* Per-agent breakdown */}
      <div className="glass-panel p-4">
        <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground mb-3">Per-agent breakdown</div>
        <div className="overflow-x-auto">
          <table className="w-full font-mono text-[11px]">
            <thead>
              <tr className="text-muted-foreground text-left">
                <th className="py-1.5 pr-3 font-normal">Agent</th>
                <th className="py-1.5 pr-3 font-normal text-right">Runs</th>
                <th className="py-1.5 pr-3 font-normal text-right">Tokens</th>
                <th className="py-1.5 pr-3 font-normal text-right">Est. cost</th>
                <th className="py-1.5 pr-3 font-normal text-right">Avg exec</th>
                <th className="py-1.5 pr-3 font-normal text-right">Errors</th>
              </tr>
            </thead>
            <tbody>
              {loading && Array.from({ length: 3 }).map((_, i) => (
                <tr key={i} className="border-t border-white/[0.05]">
                  <td className="py-2 pr-3"><Skeleton className="h-4 w-16 rounded" /></td>
                  {Array.from({ length: 5 }).map((_, j) => (
                    <td key={j} className="py-2 pr-3"><Skeleton className="h-3 w-10 ml-auto" /></td>
                  ))}
                </tr>
              ))}
              {!loading && agents.map((a: any) => (
                <tr key={a.id} className="border-t border-white/[0.05] hover:bg-white/[0.02] transition-colors">
                  <td className="py-2 pr-3">
                    <span className="inline-flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full" style={{ background: agentColor(a.id) }} />
                      <span className="text-white/85">{agentLabel(a.id)}</span>
                    </span>
                  </td>
                  <td className="py-2 pr-3 text-right text-white/85 tabular-nums">{a.runs}</td>
                  <td className="py-2 pr-3 text-right text-white/85 tabular-nums">{fmtNum(a.tokens)}</td>
                  <td className="py-2 pr-3 text-right text-white/85 tabular-nums">${a.cost.toFixed(2)}</td>
                  <td className="py-2 pr-3 text-right text-white/85 tabular-nums">{fmtDur(a.avgDurationMs)}</td>
                  <td className="py-2 pr-3 text-right tabular-nums">
                    {a.errors ? (
                      <span className="inline-flex items-center gap-1 justify-end" style={{ color: "#f87171" }}>
                        <AlertTriangle className="h-3 w-3" /> {a.errors}
                      </span>
                    ) : <span style={{ color: "#4b5563" }}>0</span>}
                  </td>
                </tr>
              ))}
              {!loading && agents.length === 0 && (
                <tr><td colSpan={6} className="py-4 text-center text-muted-foreground">No runs recorded yet — send a chat to start collecting usage.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
