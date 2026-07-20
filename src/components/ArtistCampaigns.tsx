"use client";

import { useEffect, useState } from "react";
import { Artist } from "@/lib/types";
import { AIProvider } from "@/lib/studio-types";
import {
  AdContent,
  Campaign,
  CampaignObjective,
  CampaignPlatformId,
  CampaignStatus,
  OBJECTIVE_LABEL,
} from "@/lib/campaign-types";
import { PLATFORM_META, PlatformIcon } from "@/lib/platforms";
import { formatUSD } from "@/lib/format";

const CAMPAIGN_PLATFORMS: CampaignPlatformId[] = ["googleAds", "instagram", "tiktok", "facebook", "youtube"];
const OBJECTIVES: CampaignObjective[] = ["reconocimiento", "trafico", "conversiones", "streams"];

function providerLabel(p: AIProvider) {
  return p === "gemini" ? "Gemini" : "ChatGPT";
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}
function inDaysISO(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function ArtistCampaigns({ artist }: { artist: Artist }) {
  const [aiStatus, setAiStatus] = useState<{ gemini: boolean; chatgpt: boolean } | null>(null);
  const [provider, setProvider] = useState<AIProvider>("gemini");

  const [name, setName] = useState("");
  const [objective, setObjective] = useState<CampaignObjective>("streams");
  const [platforms, setPlatforms] = useState<Set<CampaignPlatformId>>(new Set(CAMPAIGN_PLATFORMS));
  const [budget, setBudget] = useState(500);
  const [startDate, setStartDate] = useState(todayISO());
  const [endDate, setEndDate] = useState(inDaysISO(14));
  const [audience, setAudience] = useState("");
  const [topic, setTopic] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [content, setContent] = useState<AdContent | null>(null);
  const [activeVariant, setActiveVariant] = useState<CampaignPlatformId>("instagram");

  const [campaigns, setCampaigns] = useState<Campaign[]>([]);

  useEffect(() => {
    fetch("/api/ai-status")
      .then((r) => r.json())
      .then(setAiStatus)
      .catch(() => setAiStatus({ gemini: false, chatgpt: false }));
  }, []);

  function togglePlatform(id: CampaignPlatformId) {
    setPlatforms((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleGenerate() {
    if (!topic.trim()) {
      setError("Escribe el tema o gancho de la campana antes de generar.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/generate-ad", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider, artistId: artist.id, objective, audience: audience.trim(), topic: topic.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "No se pudo generar el copy");
      setContent(data as AdContent);
      setActiveVariant("instagram");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo generar el copy");
    } finally {
      setLoading(false);
    }
  }

  function handleCreateCampaign() {
    if (!name.trim()) {
      setError("Ponle un nombre a la campana.");
      return;
    }
    if (platforms.size === 0) {
      setError("Selecciona al menos una plataforma.");
      return;
    }
    if (!content) {
      setError("Genera el copy con IA antes de crear la campana.");
      return;
    }
    setError(null);
    const campaign: Campaign = {
      id: `${Date.now()}`,
      name: name.trim(),
      objective,
      platforms: Array.from(platforms),
      budgetUSD: budget,
      startDate,
      endDate,
      audience: audience.trim(),
      content,
      status: "borrador",
      createdAt: new Date().toLocaleString("es-DO", { dateStyle: "short", timeStyle: "short" }),
    };
    setCampaigns((prev) => [campaign, ...prev]);
    setName("");
    setContent(null);
    setTopic("");
  }

  function setCampaignStatus(id: string, status: CampaignStatus) {
    setCampaigns((prev) => prev.map((c) => (c.id === id ? { ...c, status } : c)));
  }

  async function activate(id: string) {
    setCampaignStatus(id, "activa");
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[380px_1fr]">
        {/* Left: campaign settings */}
        <div className="flex flex-col gap-3 rounded-2xl p-5" style={{ backgroundColor: "var(--surface-1)", border: "1px solid var(--border-hairline)" }}>
          <h3 className="text-sm font-semibold" style={{ color: "var(--text-secondary)" }}>
            Nueva campana de {artist.name}
          </h3>

          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nombre de la campana"
            className="rounded-xl px-3 py-2.5 text-sm outline-none"
            style={{ backgroundColor: "var(--surface-2)", border: "1px solid var(--border-hairline)", color: "var(--text-primary)" }}
          />

          <div>
            <label className="mb-1.5 block text-xs font-medium" style={{ color: "var(--text-muted)" }}>
              Objetivo
            </label>
            <div className="flex flex-wrap gap-2">
              {OBJECTIVES.map((o) => (
                <button
                  key={o}
                  onClick={() => setObjective(o)}
                  className="rounded-full px-3 py-1.5 text-xs font-medium"
                  style={
                    objective === o
                      ? { backgroundColor: "var(--text-primary)", color: "var(--page-plane)" }
                      : { backgroundColor: "var(--surface-2)", color: "var(--text-secondary)", border: "1px solid var(--border-hairline)" }
                  }
                >
                  {OBJECTIVE_LABEL[o]}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium" style={{ color: "var(--text-muted)" }}>
              Plataformas
            </label>
            <div className="flex flex-wrap gap-2">
              {CAMPAIGN_PLATFORMS.map((p) => (
                <button
                  key={p}
                  onClick={() => togglePlatform(p)}
                  className="flex items-center gap-1.5 rounded-full py-1.5 pl-2 pr-3 text-xs font-medium"
                  style={{
                    backgroundColor: platforms.has(p) ? "var(--surface-2)" : "transparent",
                    border: `1px solid ${platforms.has(p) ? "var(--border-hairline)" : "var(--gridline)"}`,
                    color: platforms.has(p) ? "var(--text-primary)" : "var(--text-muted)",
                    opacity: platforms.has(p) ? 1 : 0.6,
                  }}
                >
                  <PlatformIcon platform={p} />
                  {PLATFORM_META[p].label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium" style={{ color: "var(--text-muted)" }}>
                Presupuesto (USD)
              </label>
              <input
                type="number"
                min={0}
                value={budget}
                onChange={(e) => setBudget(Number(e.target.value))}
                className="w-full rounded-xl px-3 py-2 text-sm outline-none"
                style={{ backgroundColor: "var(--surface-2)", border: "1px solid var(--border-hairline)", color: "var(--text-primary)" }}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium" style={{ color: "var(--text-muted)" }}>
                Audiencia
              </label>
              <input
                value={audience}
                onChange={(e) => setAudience(e.target.value)}
                placeholder="Ej. 16-34, RD y diaspora"
                className="w-full rounded-xl px-3 py-2 text-sm outline-none"
                style={{ backgroundColor: "var(--surface-2)", border: "1px solid var(--border-hairline)", color: "var(--text-primary)" }}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium" style={{ color: "var(--text-muted)" }}>
                Inicio
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full rounded-xl px-3 py-2 text-sm outline-none"
                style={{ backgroundColor: "var(--surface-2)", border: "1px solid var(--border-hairline)", color: "var(--text-primary)" }}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium" style={{ color: "var(--text-muted)" }}>
                Fin
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full rounded-xl px-3 py-2 text-sm outline-none"
                style={{ backgroundColor: "var(--surface-2)", border: "1px solid var(--border-hairline)", color: "var(--text-primary)" }}
              />
            </div>
          </div>
        </div>

        {/* Right: AI copy + review */}
        <div className="flex flex-col gap-5">
          <div className="rounded-2xl p-5" style={{ backgroundColor: "var(--surface-1)", border: "1px solid var(--border-hairline)" }}>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold" style={{ color: "var(--text-secondary)" }}>
                Generar copy con IA
              </h3>
              <div className="flex gap-2">
                {(["gemini", "chatgpt"] as AIProvider[]).map((p) => (
                  <button
                    key={p}
                    onClick={() => setProvider(p)}
                    className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold"
                    style={
                      provider === p
                        ? { backgroundColor: "var(--text-primary)", color: "var(--page-plane)" }
                        : { backgroundColor: "var(--surface-2)", color: "var(--text-secondary)", border: "1px solid var(--border-hairline)" }
                    }
                  >
                    {providerLabel(p)}
                    <span
                      className="h-1.5 w-1.5 rounded-full"
                      style={{ backgroundColor: aiStatus?.[p] ? "var(--status-good)" : "var(--text-muted)" }}
                      title={aiStatus?.[p] ? "API key configurada" : "Sin API key, usara ejemplo"}
                    />
                  </button>
                ))}
              </div>
            </div>

            <textarea
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              rows={2}
              placeholder={`Ej: gira 2026 de ${artist.name} por RD`}
              className="w-full resize-none rounded-xl px-3 py-2.5 text-sm outline-none"
              style={{ backgroundColor: "var(--surface-2)", border: "1px solid var(--border-hairline)", color: "var(--text-primary)" }}
            />

            <button
              onClick={handleGenerate}
              disabled={loading}
              className="mt-3 w-full rounded-xl py-2.5 text-sm font-semibold disabled:opacity-60"
              style={{ backgroundColor: "var(--seq-500)", color: "#fff" }}
            >
              {loading ? "Generando..." : `Generar con ${providerLabel(provider)}`}
            </button>

            {content?.note && (
              <p className="mt-2 text-xs" style={{ color: "var(--status-warning)" }}>
                {content.note}
              </p>
            )}
            {error && (
              <p className="mt-2 text-xs" style={{ color: "var(--status-critical)" }}>
                {error}
              </p>
            )}
          </div>

          {content && (
            <div className="flex flex-col gap-4 rounded-2xl p-5" style={{ backgroundColor: "var(--surface-1)", border: "1px solid var(--border-hairline)" }}>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-medium" style={{ color: "var(--text-muted)" }}>
                    Titular
                  </label>
                  <input
                    value={content.headline}
                    onChange={(e) => setContent({ ...content, headline: e.target.value })}
                    className="w-full rounded-xl px-3 py-2 text-sm outline-none"
                    style={{ backgroundColor: "var(--surface-2)", border: "1px solid var(--border-hairline)", color: "var(--text-primary)" }}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium" style={{ color: "var(--text-muted)" }}>
                    Llamado a la accion
                  </label>
                  <input
                    value={content.cta}
                    onChange={(e) => setContent({ ...content, cta: e.target.value })}
                    className="w-full rounded-xl px-3 py-2 text-sm outline-none"
                    style={{ backgroundColor: "var(--surface-2)", border: "1px solid var(--border-hairline)", color: "var(--text-primary)" }}
                  />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium" style={{ color: "var(--text-muted)" }}>
                  Descripcion
                </label>
                <textarea
                  value={content.description}
                  onChange={(e) => setContent({ ...content, description: e.target.value })}
                  rows={2}
                  className="w-full resize-none rounded-xl px-3 py-2.5 text-sm outline-none"
                  style={{ backgroundColor: "var(--surface-2)", border: "1px solid var(--border-hairline)", color: "var(--text-primary)" }}
                />
              </div>

              <div>
                <div className="mb-2 flex flex-wrap gap-2">
                  {CAMPAIGN_PLATFORMS.map((p) => (
                    <button
                      key={p}
                      onClick={() => setActiveVariant(p)}
                      className="flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium"
                      style={
                        activeVariant === p
                          ? { backgroundColor: "var(--text-primary)", color: "var(--page-plane)" }
                          : { backgroundColor: "var(--surface-2)", color: "var(--text-secondary)", border: "1px solid var(--border-hairline)" }
                      }
                    >
                      {PLATFORM_META[p].label}
                    </button>
                  ))}
                </div>
                <textarea
                  value={content.variants[activeVariant]}
                  onChange={(e) => setContent({ ...content, variants: { ...content.variants, [activeVariant]: e.target.value } })}
                  rows={3}
                  className="w-full resize-none rounded-xl px-3 py-2.5 text-sm outline-none"
                  style={{ backgroundColor: "var(--surface-2)", border: "1px solid var(--border-hairline)", color: "var(--text-primary)" }}
                />
              </div>

              <button
                onClick={handleCreateCampaign}
                className="w-full rounded-xl py-2.5 text-sm font-semibold"
                style={{ backgroundColor: "var(--text-primary)", color: "var(--page-plane)" }}
              >
                Crear campana
              </button>
            </div>
          )}
        </div>
      </div>

      {campaigns.length > 0 && (
        <div className="rounded-2xl p-5" style={{ backgroundColor: "var(--surface-1)", border: "1px solid var(--border-hairline)" }}>
          <h3 className="mb-3 text-sm font-semibold" style={{ color: "var(--text-secondary)" }}>
            Campanas de {artist.name}
          </h3>
          <div className="flex flex-col gap-3">
            {campaigns.map((c) => (
              <CampaignCard key={c.id} campaign={c} onActivate={() => activate(c.id)} onPause={() => setCampaignStatus(c.id, "pausada")} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function statusColor(status: CampaignStatus) {
  if (status === "activa") return "var(--status-good)";
  if (status === "pausada") return "var(--status-warning)";
  if (status === "finalizada") return "var(--text-muted)";
  return "var(--text-secondary)";
}

function CampaignCard({ campaign, onActivate, onPause }: { campaign: Campaign; onActivate: () => void; onPause: () => void }) {
  return (
    <div className="flex flex-col gap-3 rounded-xl p-4 sm:flex-row sm:items-center sm:justify-between" style={{ backgroundColor: "var(--surface-2)", border: "1px solid var(--border-hairline)" }}>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-semibold" style={{ color: "var(--text-primary)" }}>
            {campaign.name}
          </span>
          <span
            className="flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium"
            style={{ color: statusColor(campaign.status), border: `1px solid ${statusColor(campaign.status)}` }}
          >
            <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: statusColor(campaign.status) }} />
            {campaign.status}
          </span>
        </div>
        <div className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
          {OBJECTIVE_LABEL[campaign.objective]} · {formatUSD(campaign.budgetUSD)} · {campaign.startDate} a {campaign.endDate}
        </div>
        <div className="mt-1 truncate text-sm" style={{ color: "var(--text-secondary)" }}>
          {campaign.content.headline}
        </div>
        <div className="mt-2 flex gap-2">
          {campaign.platforms.map((p) => (
            <PlatformIcon key={p} platform={p} />
          ))}
        </div>
      </div>
      <div className="flex shrink-0 gap-2">
        {campaign.status !== "activa" && campaign.status !== "finalizada" && (
          <button
            onClick={onActivate}
            className="rounded-lg px-3 py-1.5 text-xs font-semibold"
            style={{ backgroundColor: "var(--text-primary)", color: "var(--page-plane)" }}
          >
            Activar
          </button>
        )}
        {campaign.status === "activa" && (
          <button
            onClick={onPause}
            className="rounded-lg px-3 py-1.5 text-xs font-semibold"
            style={{ backgroundColor: "var(--surface-1)", border: "1px solid var(--border-hairline)", color: "var(--text-secondary)" }}
          >
            Pausar
          </button>
        )}
      </div>
    </div>
  );
}
