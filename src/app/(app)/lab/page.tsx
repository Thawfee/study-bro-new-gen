"use client";

import { useEffect, useMemo, useState } from "react";
import { Beaker, Plus, RotateCcw, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

type DetectionName = "Drowsiness" | "Phone" | "Distraction" | "Posture" | "Presence";
type Trial = { id: string; detection: DetectionName; expected: boolean; detected: boolean; latencyMs: number };
const KEY = "studybro.ai-test-lab.v1";
const DETECTIONS: DetectionName[] = ["Drowsiness", "Phone", "Distraction", "Posture", "Presence"];

export default function AILabPage() {
  const [detection, setDetection] = useState<DetectionName>("Drowsiness");
  const [expected, setExpected] = useState(true);
  const [detected, setDetected] = useState(true);
  const [latency, setLatency] = useState(0);
  const [trials, setTrials] = useState<Trial[]>([]);

  useEffect(() => {
    try { const raw = localStorage.getItem(KEY); if (raw) setTrials(JSON.parse(raw) as Trial[]); } catch { /* ignore */ }
  }, []);
  useEffect(() => { try { localStorage.setItem(KEY, JSON.stringify(trials)); } catch { /* ignore */ } }, [trials]);

  const selected = trials.filter((t) => t.detection === detection);
  const stats = useMemo(() => {
    const total = selected.length;
    const correct = selected.filter((t) => t.expected === t.detected).length;
    const positives = selected.filter((t) => t.expected).length;
    const truePositives = selected.filter((t) => t.expected && t.detected).length;
    const negatives = selected.filter((t) => !t.expected).length;
    const falsePositives = selected.filter((t) => !t.expected && t.detected).length;
    const avgLatency = total ? selected.reduce((a, t) => a + t.latencyMs, 0) / total : 0;
    return {
      total,
      accuracy: total ? (correct / total) * 100 : null,
      detectionRate: positives ? (truePositives / positives) * 100 : null,
      falsePositiveRate: negatives ? (falsePositives / negatives) * 100 : null,
      avgLatency: total ? avgLatency : null,
    };
  }, [selected]);

  const add = () => setTrials((items) => [{ id: crypto.randomUUID(), detection, expected, detected, latencyMs: Math.max(0, latency || 0) }, ...items]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--accent)]"><Beaker size={13}/> Student-collected prototype evaluation</div>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-[var(--text)]">AI Test Lab</h1>
          <p className="mt-1 max-w-2xl text-sm text-[var(--text-dim)]">Record your real experiments instead of displaying invented accuracy numbers. StudyBro calculates the evaluation metrics from exactly what you enter.</p>
        </div>
        <button onClick={() => setTrials([])} className="inline-flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text-dim)] hover:text-[var(--text)]"><RotateCcw size={14}/> Clear lab data</button>
      </div>

      <div className="card p-5">
        <div className="grid gap-3 md:grid-cols-5">
          <label className="space-y-1.5"><span className="text-xs text-[var(--text-dim)]">Detection</span><select value={detection} onChange={(e)=>setDetection(e.target.value as DetectionName)} className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-elev)] px-3 py-2.5 text-sm text-[var(--text)]">{DETECTIONS.map(d=><option key={d}>{d}</option>)}</select></label>
          <Choice label="Expected" value={expected} onChange={setExpected}/>
          <Choice label="Detected" value={detected} onChange={setDetected}/>
          <label className="space-y-1.5"><span className="text-xs text-[var(--text-dim)]">Latency (ms)</span><input type="number" min={0} value={latency} onChange={(e)=>setLatency(Number(e.target.value))} className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-elev)] px-3 py-2.5 text-sm text-[var(--text)]"/></label>
          <button onClick={add} className="mt-auto inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-500 to-indigo-500 px-4 py-2.5 text-sm font-semibold text-white"><Plus size={15}/> Record trial</button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Metric label="Trials" value={String(stats.total)} />
        <Metric label="Accuracy" value={stats.accuracy == null ? "—" : `${stats.accuracy.toFixed(1)}%`} />
        <Metric label="Detection Rate" value={stats.detectionRate == null ? "—" : `${stats.detectionRate.toFixed(1)}%`} />
        <Metric label="False Positive Rate" value={stats.falsePositiveRate == null ? "—" : `${stats.falsePositiveRate.toFixed(1)}%`} />
        <Metric label="Avg Detection Time" value={stats.avgLatency == null ? "—" : `${Math.round(stats.avgLatency)} ms`} />
      </div>

      <div className="card overflow-hidden">
        <div className="flex items-center justify-between border-b border-[var(--border)] p-4"><div><h2 className="text-sm font-semibold text-[var(--text)]">{detection} trials</h2><p className="text-xs text-[var(--text-faint)]">Only your entered results are shown.</p></div><span className="text-xs text-[var(--text-dim)]">{selected.length} records</span></div>
        {selected.length === 0 ? <p className="p-8 text-center text-sm text-[var(--text-faint)]">No trials recorded yet.</p> : <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="text-[11px] uppercase tracking-wider text-[var(--text-faint)]"><tr><th className="px-4 py-3">Expected</th><th className="px-4 py-3">Detected</th><th className="px-4 py-3">Result</th><th className="px-4 py-3">Latency</th><th className="px-4 py-3"></th></tr></thead><tbody>{selected.map(t=><tr key={t.id} className="border-t border-[var(--border)]"><td className="px-4 py-3">{t.expected ? "Positive" : "Negative"}</td><td className="px-4 py-3">{t.detected ? "Positive" : "Negative"}</td><td className={cn("px-4 py-3 font-medium", t.expected===t.detected ? "text-[var(--good)]" : "text-[var(--bad)]")}>{t.expected===t.detected ? "Correct" : "Incorrect"}</td><td className="px-4 py-3 tabular-nums text-[var(--text-dim)]">{t.latencyMs} ms</td><td className="px-4 py-3 text-right"><button onClick={()=>setTrials(items=>items.filter(x=>x.id!==t.id))} className="text-[var(--text-faint)] hover:text-[var(--bad)]" aria-label="Delete trial"><Trash2 size={15}/></button></td></tr>)}</tbody></table></div>}
      </div>
    </div>
  );
}

function Choice({ label, value, onChange }: { label: string; value: boolean; onChange: (v:boolean)=>void }) {
  return <label className="space-y-1.5"><span className="text-xs text-[var(--text-dim)]">{label}</span><div className="grid grid-cols-2 overflow-hidden rounded-xl border border-[var(--border)]"><button type="button" onClick={()=>onChange(true)} className={cn("px-3 py-2.5 text-sm", value ? "bg-emerald-500/15 text-[var(--good)]" : "bg-[var(--surface)] text-[var(--text-dim)]")}>Yes</button><button type="button" onClick={()=>onChange(false)} className={cn("px-3 py-2.5 text-sm", !value ? "bg-rose-500/15 text-[var(--bad)]" : "bg-[var(--surface)] text-[var(--text-dim)]")}>No</button></div></label>;
}
function Metric({ label, value }: { label:string; value:string }) { return <div className="card p-4"><p className="text-[10px] uppercase tracking-[0.14em] text-[var(--text-faint)]">{label}</p><p className="mt-2 text-2xl font-bold tabular-nums text-[var(--text)]">{value}</p></div>; }
