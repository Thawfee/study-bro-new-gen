"use client";

/* Single-series charts → one hue each (brand violet), identity carried by the
   title. Thin rounded bars, 2px lines, recessive grid, hover tooltips. */

import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useTheme } from "@/components/theme/ThemeProvider";

function palette(dark: boolean) {
  return {
    series: dark ? "#8b5cf6" : "#7c3aed",
    grid: dark ? "rgba(255,255,255,0.06)" : "rgba(15,23,42,0.07)",
    axis: dark ? "#69789a" : "#64748b",
    tipBg: dark ? "#0f1525" : "#ffffff",
    tipBorder: dark ? "rgba(255,255,255,0.14)" : "rgba(15,23,42,0.12)",
    text: dark ? "#edf2ff" : "#0f172a",
    cursor: dark ? "rgba(255,255,255,0.05)" : "rgba(15,23,42,0.05)",
  };
}

function useChartColors() {
  const { resolved } = useTheme();
  return palette(resolved === "dark");
}

function tooltipProps(c: ReturnType<typeof palette>) {
  return {
    cursor: { fill: c.cursor, stroke: c.grid },
    contentStyle: { background: c.tipBg, border: `1px solid ${c.tipBorder}`, borderRadius: 12, fontSize: 12, color: c.text, boxShadow: "0 10px 30px -12px rgba(0,0,0,0.4)" },
    labelStyle: { color: c.axis, marginBottom: 2 },
    itemStyle: { color: c.text },
  };
}

export function MinutesBarChart({ data, height = 220 }: { data: { label: string; minutes: number }[]; height?: number }) {
  const c = useChartColors();
  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 4, left: -18, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke={c.grid} />
          <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: c.axis, fontSize: 11 }} interval="preserveStartEnd" />
          <YAxis tickLine={false} axisLine={false} tick={{ fill: c.axis, fontSize: 11 }} allowDecimals={false} width={44} />
          <Tooltip {...tooltipProps(c)} formatter={(v) => [`${v} min`, "Study time"]} />
          <Bar dataKey="minutes" fill={c.series} radius={[4, 4, 0, 0]} maxBarSize={28} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function FocusLineChart({ data, height = 220 }: { data: { label: string; focusPct: number | null }[]; height?: number }) {
  const c = useChartColors();
  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke={c.grid} />
          <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: c.axis, fontSize: 11 }} interval="preserveStartEnd" />
          <YAxis domain={[0, 100]} tickLine={false} axisLine={false} tick={{ fill: c.axis, fontSize: 11 }} width={44} unit="%" />
          <Tooltip {...tooltipProps(c)} formatter={(v) => [`${v}%`, "Focused"]} />
          <Line type="monotone" dataKey="focusPct" stroke={c.series} strokeWidth={2} dot={{ r: 4, strokeWidth: 2, fill: c.tipBg }} activeDot={{ r: 5 }} connectNulls />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Horizontal bars as plain HTML (ranked list reads better than a chart axis). */
export function RankedBars({ rows, unit = "" }: { rows: { label: string; value: number }[]; unit?: string }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <ul className="space-y-2.5">
      {rows.map((r) => (
        <li key={r.label} className="group grid grid-cols-[7rem_1fr_2.5rem] items-center gap-3 text-sm" title={`${r.label}: ${r.value}${unit}`}>
          <span className="truncate text-[var(--text-dim)]">{r.label}</span>
          <span className="h-2.5 overflow-hidden rounded-full bg-[var(--surface-2)]">
            <span className="block h-full rounded-full bg-[var(--brand)] transition-all group-hover:brightness-125" style={{ width: `${(r.value / max) * 100}%` }} />
          </span>
          <span className="text-right tabular-nums text-[var(--text)]">{r.value}{unit}</span>
        </li>
      ))}
    </ul>
  );
}
