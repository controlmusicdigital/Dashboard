"use client";

import { useMemo, useRef } from "react";
import { motion, useMotionTemplate, useMotionValue, useSpring, useTransform } from "framer-motion";
import { AnimatedCounter } from "./AnimatedCounter";
import { formatDelta } from "@/lib/format";

function Sparkline({ series, color }: { series: number[]; color: string }) {
  const path = useMemo(() => {
    if (series.length < 2) return "";
    const max = Math.max(...series);
    const min = Math.min(...series);
    const range = max - min || 1;
    const w = 100;
    const h = 28;
    return series
      .map((v, i) => {
        const x = (i / (series.length - 1)) * w;
        const y = h - ((v - min) / range) * h;
        return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(" ");
  }, [series]);

  if (!path) return null;

  return (
    <svg viewBox="0 0 100 28" preserveAspectRatio="none" className="h-7 w-full" aria-hidden>
      <path d={path} fill="none" stroke={color} strokeWidth={1.6} style={{ filter: `drop-shadow(0 0 3px ${color})` }} />
    </svg>
  );
}

export function FuturisticKpiCard({
  label,
  raw,
  format,
  deltaPct = 0,
  series,
  accent = "var(--accent-cyan)",
}: {
  label: string;
  raw: number;
  format: (n: number) => string;
  deltaPct?: number;
  series?: number[];
  accent?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0.5);
  const y = useMotionValue(0.5);
  const rotateX = useSpring(useTransform(y, [0, 1], [8, -8]), { stiffness: 220, damping: 20 });
  const rotateY = useSpring(useTransform(x, [0, 1], [-8, 8]), { stiffness: 220, damping: 20 });
  const glowX = useTransform(x, [0, 1], ["0%", "100%"]);
  const glowY = useTransform(y, [0, 1], ["0%", "100%"]);
  const glowBackground = useMotionTemplate`radial-gradient(circle at ${glowX} ${glowY}, color-mix(in srgb, ${accent} 20%, transparent), transparent 60%)`;

  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    x.set((e.clientX - rect.left) / rect.width);
    y.set((e.clientY - rect.top) / rect.height);
  }

  function handlePointerLeave() {
    x.set(0.5);
    y.set(0.5);
  }

  const good = deltaPct >= 0;

  return (
    <motion.div
      ref={ref}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      style={{ rotateX, rotateY, transformPerspective: 800, backgroundColor: "var(--surface-2)", borderColor: "var(--border-hairline)" }}
      whileHover={{ scale: 1.015 }}
      className="hud-corners group relative flex flex-col gap-1 overflow-hidden rounded-2xl border p-3.5"
    >
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{ background: glowBackground }}
      />
      <span className="relative text-xs" style={{ color: "var(--text-muted)" }}>
        {label}
      </span>
      <div className="relative flex items-baseline gap-2">
        <span className="font-hud-mono text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
          <AnimatedCounter value={raw} format={format} />
        </span>
        {deltaPct !== 0 && (
          <span
            className="font-hud-mono inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[13px] font-medium"
            style={{
              color: good ? "var(--status-good)" : "var(--status-critical)",
              backgroundColor: good ? "color-mix(in srgb, var(--status-good) 14%, transparent)" : "color-mix(in srgb, var(--status-critical) 14%, transparent)",
            }}
          >
            {good ? "↑" : "↓"} {formatDelta(deltaPct)}
          </span>
        )}
      </div>
      {series && series.length > 1 && (
        <div className="relative mt-1">
          <Sparkline series={series} color={accent} />
        </div>
      )}
    </motion.div>
  );
}
