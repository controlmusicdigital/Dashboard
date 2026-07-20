"use client";

import { useEffect, useState } from "react";

function useClock() {
  const [time, setTime] = useState<string | null>(null);
  useEffect(() => {
    function tick() {
      setTime(
        new Date().toLocaleTimeString("es-DO", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false })
      );
    }
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return time;
}

function AudioWave() {
  const bars = [0.4, 0.9, 0.6, 1, 0.5, 0.75, 0.35];
  return (
    <div className="flex h-4 items-end gap-[2px]" aria-hidden>
      {bars.map((h, i) => (
        <span
          key={i}
          className="w-[2px] rounded-full"
          style={{
            backgroundColor: "var(--accent-cyan)",
            height: `${h * 100}%`,
            animation: `orb-drift ${0.6 + (i % 3) * 0.25}s ease-in-out infinite alternate`,
            animationDelay: `${i * 0.07}s`,
            opacity: 0.8,
          }}
        />
      ))}
    </div>
  );
}

export function HudStatusBar() {
  const time = useClock();

  return (
    <div className="font-hud-mono flex flex-wrap items-center gap-3 text-[13px]" style={{ color: "var(--text-muted)" }}>
      <span className="flex items-center gap-1.5">
        <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: "var(--status-good)", boxShadow: "0 0 6px var(--status-good)" }} />
        PING: 18ms · SDQ-EDGE
      </span>
      <span>{time ?? "--:--:--"}</span>
      <AudioWave />
    </div>
  );
}
