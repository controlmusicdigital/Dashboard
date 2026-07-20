"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { Sparkles, TrendingUp, Wand2 } from "lucide-react";
import { getAllArtistData } from "@/lib/mock-data";
import { getLabelData } from "@/lib/label-data";
import { PLATFORM_META, PlatformIcon } from "@/lib/platforms";
import { PlatformId } from "@/lib/types";
import { formatCompact, formatUSD } from "@/lib/format";
import { Hero3DCanvas } from "./Hero3DCanvas";
import { GeminiBananaCopilot } from "./GeminiBananaCopilot";
import { AnimatedCounter } from "./AnimatedCounter";
import { TiltCard } from "./TiltCard";
import { GeminiNanoState } from "@/hooks/useGeminiNano";

const CHART_PLATFORMS: PlatformId[] = ["spotify", "youtube", "instagram", "tiktok", "facebook", "x"];

export function AIInsights() {
  const allData = useMemo(() => getAllArtistData(), []);
  const dataList = Object.values(allData);
  const labelData = useMemo(() => getLabelData(), []);

  const [chartPlatform, setChartPlatform] = useState<PlatformId>("spotify");
  const [aiState, setAiState] = useState<GeminiNanoState>("idle");
  const [copilotPrompt, setCopilotPrompt] = useState<string | null>(null);
  const [adSpendInput, setAdSpendInput] = useState(2000);

  const socialReach = ["instagram", "tiktok", "facebook", "x"].reduce(
    (sum, p) => sum + (labelData.platforms[p as PlatformId].headline.raw ?? 0),
    0
  );
  const spotifyListeners = labelData.platforms.spotify.headline.raw ?? 0;
  const youtubeSubs = labelData.platforms.youtube.headline.raw ?? 0;
  const adSpend = labelData.platforms.googleAds.headline.raw ?? 0;
  const distroRevenue = labelData.platforms.distrokid.headline.raw ?? 0;

  const revenuePerAdDollar = adSpend > 0 ? distroRevenue / adSpend : 0;
  const streamsPerAdDollar = adSpend > 0 ? spotifyListeners / adSpend : 0;
  const projectedRevenue = adSpendInput * revenuePerAdDollar;
  const projectedStreams = adSpendInput * streamsPerAdDollar;

  const kpis = [
    { label: "Oyentes mensuales (Spotify)", raw: spotifyListeners, format: formatCompact },
    { label: "Suscriptores (YouTube)", raw: youtubeSubs, format: formatCompact },
    { label: "Alcance social cruzado", raw: socialReach, format: formatCompact },
    { label: "Inversion en Google Ads", raw: adSpend, format: formatUSD },
    { label: "Ingresos brutos DistroKid", raw: distroRevenue, format: formatUSD },
  ];

  const metricsContext = kpis.map((k) => `${k.label}: ${k.format(k.raw)}`).join(" · ");

  function auditArtist(artistName: string) {
    setCopilotPrompt(`Dame un analisis rapido del rendimiento de ${artistName} y una recomendacion accionable.`);
    setTimeout(() => setCopilotPrompt(null), 100);
  }

  return (
    <div
      className="relative -mx-4 overflow-hidden rounded-3xl px-4 py-8 sm:-mx-6 sm:px-8"
      style={{ background: "radial-gradient(circle at 20% 0%, #131a2e 0%, #0b0e14 55%, #08090d 100%)" }}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-72 opacity-70">
        <Hero3DCanvas aiState={aiState} />
      </div>

      <div className="relative flex flex-col gap-8 text-white">
        <div className="flex flex-col items-center gap-2 pt-6 text-center">
          <span className="flex items-center gap-1.5 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-[11px] font-medium text-cyan-300">
            <Sparkles size={12} /> Gemini Nano Banana &middot; IA en el dispositivo
          </span>
          <h2 className="text-2xl font-bold sm:text-3xl">AI Insights</h2>
          <p className="max-w-lg text-sm text-white/50">
            Metricas del sello con analisis en tiempo real. Datos de demostracion &mdash; conecta las cuentas reales
            para reemplazarlos.
          </p>
        </div>

        {/* KPI ribbon */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {kpis.map((kpi, i) => (
            <motion.div
              key={kpi.label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06, duration: 0.5 }}
              whileHover={{ y: -3 }}
              className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur-xl"
            >
              <div className="text-[11px] text-white/45">{kpi.label}</div>
              <div className="mt-1 text-xl font-bold tabular-nums">
                <AnimatedCounter value={kpi.raw} format={kpi.format} />
              </div>
            </motion.div>
          ))}
        </div>

        {/* Analytics area */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.4fr_1fr]">
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-xl">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm font-semibold text-white/80">Alcance por plataforma</h3>
              <div className="flex flex-wrap gap-1.5">
                {CHART_PLATFORMS.map((p) => (
                  <button
                    key={p}
                    onClick={() => setChartPlatform(p)}
                    className="flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors"
                    style={
                      chartPlatform === p
                        ? { background: "linear-gradient(135deg, #22d3ee, #e879f9)", color: "#04121a" }
                        : { background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.6)" }
                    }
                  >
                    <PlatformIcon platform={p} className="h-3 w-3" />
                    {PLATFORM_META[p].label}
                  </button>
                ))}
              </div>
            </div>
            <AnimatePresence mode="wait">
              <motion.div
                key={chartPlatform}
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.3 }}
              >
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={labelData.platforms[chartPlatform].series} margin={{ top: 4, right: 4, bottom: 0, left: 4 }}>
                    <defs>
                      <linearGradient id="insightsFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.5} />
                        <stop offset="100%" stopColor="#e879f9" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="date" hide />
                    <Tooltip
                      contentStyle={{ background: "rgba(13,15,23,0.9)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10 }}
                      labelStyle={{ color: "rgba(255,255,255,0.5)" }}
                      itemStyle={{ color: "#fff" }}
                      formatter={(v) => formatCompact(Number(v))}
                    />
                    <Area type="monotone" dataKey="value" stroke="#22d3ee" strokeWidth={2} fill="url(#insightsFill)" />
                  </AreaChart>
                </ResponsiveContainer>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* ROI calculator */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-xl">
            <h3 className="mb-1 flex items-center gap-1.5 text-sm font-semibold text-white/80">
              <TrendingUp size={14} /> Calculadora de ROI
            </h3>
            <p className="mb-3 text-[11px] text-white/40">
              Estimado a partir de los ratios actuales del sello &mdash; no es una prediccion garantizada.
            </p>
            <label className="mb-1 block text-[11px] text-white/50">Gasto hipotetico en Ads (USD)</label>
            <input
              type="range"
              min={0}
              max={20000}
              step={100}
              value={adSpendInput}
              onChange={(e) => setAdSpendInput(Number(e.target.value))}
              className="w-full accent-cyan-400"
            />
            <div className="mt-1 text-lg font-bold">{formatUSD(adSpendInput)}</div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div>
                <div className="text-[11px] text-white/45">Ingresos estimados</div>
                <div className="text-base font-semibold text-cyan-300">{formatUSD(projectedRevenue)}</div>
              </div>
              <div>
                <div className="text-[11px] text-white/45">Streams estimados</div>
                <div className="text-base font-semibold text-fuchsia-300">{formatCompact(projectedStreams)}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Artist portfolio grid */}
        <div>
          <h3 className="mb-3 text-sm font-semibold text-white/80">Portafolio de artistas</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {dataList.map((d, i) => (
              <motion.div
                key={d.artist.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08, duration: 0.5 }}
              >
                <TiltCard>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span
                        className="flex h-11 w-11 items-center justify-center rounded-full text-sm font-bold"
                        style={{ backgroundColor: d.artist.accent, color: "#0b0b0b" }}
                      >
                        {d.artist.initials}
                      </span>
                      <div>
                        <div className="text-sm font-semibold text-white">{d.artist.name}</div>
                        <div className="text-[11px] text-white/45">{d.artist.genre}</div>
                      </div>
                    </div>
                    <button
                      onClick={() => auditArtist(d.artist.name)}
                      title="Auditoria rapida con Gemini Nano"
                      className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-cyan-300 transition-colors hover:bg-white/10"
                    >
                      <Wand2 size={14} />
                    </button>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <div>
                      <div className="text-[11px] text-white/45">Oyentes Spotify</div>
                      <div className="text-sm font-semibold text-white">{d.platforms.spotify.headline.value}</div>
                    </div>
                    <div>
                      <div className="text-[11px] text-white/45">Suscriptores YouTube</div>
                      <div className="text-sm font-semibold text-white">{d.platforms.youtube.headline.value}</div>
                    </div>
                  </div>
                </TiltCard>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      <GeminiBananaCopilot metricsContext={metricsContext} onStateChange={setAiState} externalPrompt={copilotPrompt} />
    </div>
  );
}
