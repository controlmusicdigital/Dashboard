"use client";

import { useEffect, useRef, useState } from "react";
import { Artist } from "@/lib/types";
import { AIProvider, GeneratedContent, PublishState, SocialPlatformId } from "@/lib/studio-types";
import { PLATFORM_META, PlatformIcon } from "@/lib/platforms";

const STUDIO_PLATFORMS: SocialPlatformId[] = ["instagram", "tiktok", "facebook", "youtube", "x"];

const ASPECTS: { id: string; label: string; className: string }[] = [
  { id: "1:1", label: "Feed 1:1", className: "aspect-square" },
  { id: "4:5", label: "Retrato 4:5", className: "aspect-[4/5]" },
  { id: "9:16", label: "Reel/Story 9:16", className: "aspect-[9/16]" },
  { id: "16:9", label: "YouTube 16:9", className: "aspect-video" },
];

interface HistoryEntry {
  id: string;
  time: string;
  platforms: SocialPlatformId[];
  caption: string;
  thumb: string | null;
  thumbType: "image" | "video";
}

function providerLabel(p: AIProvider) {
  return p === "gemini" ? "Gemini" : "ChatGPT";
}

export function ArtistStudio({ artist }: { artist: Artist }) {
  const [aiStatus, setAiStatus] = useState<{ gemini: boolean; chatgpt: boolean } | null>(null);
  const [provider, setProvider] = useState<AIProvider>("gemini");
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generated, setGenerated] = useState<GeneratedContent | null>(null);
  const [caption, setCaption] = useState("");
  const [hashtags, setHashtags] = useState("");
  const [variants, setVariants] = useState<Record<SocialPlatformId, string>>({
    instagram: "",
    tiktok: "",
    facebook: "",
    youtube: "",
    x: "",
  });
  const [activeVariant, setActiveVariant] = useState<SocialPlatformId>("instagram");

  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<"image" | "video">("image");
  const [aspect, setAspect] = useState(ASPECTS[0]);
  const [overlayText, setOverlayText] = useState("");
  const [stickerPos, setStickerPos] = useState({ x: 50, y: 80 });
  const frameRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const [selectedPlatforms, setSelectedPlatforms] = useState<Set<SocialPlatformId>>(new Set(STUDIO_PLATFORMS));
  const [publishStatuses, setPublishStatuses] = useState<Record<SocialPlatformId, PublishState>>({
    instagram: "idle",
    tiktok: "idle",
    facebook: "idle",
    youtube: "idle",
    x: "idle",
  });
  const [publishing, setPublishing] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  useEffect(() => {
    fetch("/api/ai-status")
      .then((r) => r.json())
      .then(setAiStatus)
      .catch(() => setAiStatus({ gemini: false, chatgpt: false }));
  }, []);

  useEffect(() => {
    return () => {
      if (mediaUrl) URL.revokeObjectURL(mediaUrl);
    };
  }, [mediaUrl]);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (mediaUrl) URL.revokeObjectURL(mediaUrl);
    setMediaType(file.type.startsWith("video/") ? "video" : "image");
    setMediaUrl(URL.createObjectURL(file));
  }

  function handlePointerDown() {
    dragging.current = true;
  }
  function handlePointerMove(e: React.PointerEvent) {
    if (!dragging.current || !frameRef.current) return;
    const rect = frameRef.current.getBoundingClientRect();
    const x = Math.min(96, Math.max(4, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.min(96, Math.max(4, ((e.clientY - rect.top) / rect.height) * 100));
    setStickerPos({ x, y });
  }
  function handlePointerUp() {
    dragging.current = false;
  }

  async function handleGenerate() {
    if (!prompt.trim()) {
      setError("Escribe de que trata el post antes de generar.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/generate-post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider, artistId: artist.id, prompt: prompt.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "No se pudo generar el contenido");
      const content = data as GeneratedContent;
      setGenerated(content);
      setCaption(content.caption);
      setHashtags(content.hashtags.join(" "));
      setVariants(content.variants);
      setActiveVariant("instagram");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo generar el contenido");
    } finally {
      setLoading(false);
    }
  }

  function togglePlatform(id: SocialPlatformId) {
    setSelectedPlatforms((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handlePublish() {
    if (selectedPlatforms.size === 0) {
      setError("Selecciona al menos una red para publicar.");
      return;
    }
    if (!caption.trim()) {
      setError("Genera o escribe un caption antes de publicar.");
      return;
    }
    setError(null);
    setPublishing(true);
    const targets = Array.from(selectedPlatforms);
    setPublishStatuses((prev) => {
      const next = { ...prev };
      targets.forEach((t) => (next[t] = "queued"));
      return next;
    });

    await Promise.all(
      targets.map(async (platform, i) => {
        await new Promise((r) => setTimeout(r, 250 + i * 180));
        setPublishStatuses((prev) => ({ ...prev, [platform]: "publishing" }));
        await new Promise((r) => setTimeout(r, 700 + Math.random() * 900));
        const failed = Math.random() < 0.08;
        setPublishStatuses((prev) => ({ ...prev, [platform]: failed ? "error" : "success" }));
      })
    );

    setPublishing(false);
    setHistory((prev) => [
      {
        id: `${Date.now()}`,
        time: new Date().toLocaleTimeString("es-DO", { hour: "2-digit", minute: "2-digit" }),
        platforms: targets,
        caption,
        thumb: mediaUrl,
        thumbType: mediaType,
      },
      ...prev,
    ]);
  }

  function retryPlatform(platform: SocialPlatformId) {
    setPublishStatuses((prev) => ({ ...prev, [platform]: "publishing" }));
    setTimeout(() => {
      setPublishStatuses((prev) => ({ ...prev, [platform]: "success" }));
    }, 700);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[360px_1fr]">
        {/* Left: media preview */}
        <div className="flex flex-col gap-3">
          <div
            ref={frameRef}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
            className={`relative w-full overflow-hidden rounded-2xl ${aspect.className}`}
            style={{ backgroundColor: "var(--surface-2)", border: "1px solid var(--border-hairline)" }}
          >
            {mediaUrl ? (
              mediaType === "video" ? (
                <video src={mediaUrl} controls muted loop playsInline className="h-full w-full object-cover" />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={mediaUrl} alt="Vista previa del post" className="h-full w-full object-cover" draggable={false} />
              )
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center gap-2 p-6 text-center" style={{ color: "var(--text-muted)" }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                  <rect x="3" y="3" width="18" height="18" rx="3" />
                  <circle cx="9" cy="9" r="2" />
                  <path d="M21 15l-5-5L5 21" />
                </svg>
                <span className="text-xs">Sube una foto o video para este post</span>
              </div>
            )}
            {overlayText && (
              <div
                onPointerDown={handlePointerDown}
                className="absolute max-w-[85%] -translate-x-1/2 -translate-y-1/2 cursor-grab select-none rounded-lg px-3 py-1.5 text-center text-sm font-bold active:cursor-grabbing"
                style={{ left: `${stickerPos.x}%`, top: `${stickerPos.y}%`, backgroundColor: "rgba(0,0,0,0.55)", color: "#fff" }}
              >
                {overlayText}
              </div>
            )}
          </div>

          <label
            className="flex cursor-pointer items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-medium"
            style={{ backgroundColor: "var(--surface-2)", border: "1px solid var(--border-hairline)", color: "var(--text-secondary)" }}
          >
            {mediaUrl ? "Cambiar imagen o video" : "Subir imagen o video"}
            <input type="file" accept="image/*,video/*" className="hidden" onChange={handleFile} />
          </label>

          <input
            value={overlayText}
            onChange={(e) => setOverlayText(e.target.value)}
            placeholder="Texto sobre la imagen (opcional, arrastralo)"
            className="rounded-xl px-3 py-2 text-sm outline-none"
            style={{ backgroundColor: "var(--surface-2)", border: "1px solid var(--border-hairline)", color: "var(--text-primary)" }}
          />

          <div className="flex flex-wrap gap-2">
            {ASPECTS.map((a) => (
              <button
                key={a.id}
                onClick={() => setAspect(a)}
                className="rounded-full px-3 py-1.5 text-xs font-medium"
                style={
                  aspect.id === a.id
                    ? { backgroundColor: "var(--text-primary)", color: "var(--page-plane)" }
                    : { backgroundColor: "var(--surface-2)", color: "var(--text-secondary)", border: "1px solid var(--border-hairline)" }
                }
              >
                {a.label}
              </button>
            ))}
          </div>
        </div>

        {/* Right: AI + content */}
        <div className="flex flex-col gap-5">
          <div className="rounded-2xl p-5" style={{ backgroundColor: "var(--surface-1)", border: "1px solid var(--border-hairline)" }}>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold" style={{ color: "var(--text-secondary)" }}>
                Generar con IA
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
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={3}
              placeholder={`Ej: adelanto del proximo sencillo de ${artist.name}, grabado en Santo Domingo`}
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

            {generated?.note && (
              <p className="mt-2 text-xs" style={{ color: "var(--status-warning)" }}>
                {generated.note}
              </p>
            )}
            {error && (
              <p className="mt-2 text-xs" style={{ color: "var(--status-critical)" }}>
                {error}
              </p>
            )}
          </div>

          {generated && (
            <div className="flex flex-col gap-4 rounded-2xl p-5" style={{ backgroundColor: "var(--surface-1)", border: "1px solid var(--border-hairline)" }}>
              <div>
                <label className="mb-1 block text-xs font-medium" style={{ color: "var(--text-muted)" }}>
                  Caption
                </label>
                <textarea
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  rows={3}
                  className="w-full resize-none rounded-xl px-3 py-2.5 text-sm outline-none"
                  style={{ backgroundColor: "var(--surface-2)", border: "1px solid var(--border-hairline)", color: "var(--text-primary)" }}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium" style={{ color: "var(--text-muted)" }}>
                  Hashtags
                </label>
                <input
                  value={hashtags}
                  onChange={(e) => setHashtags(e.target.value)}
                  className="w-full rounded-xl px-3 py-2 text-sm outline-none"
                  style={{ backgroundColor: "var(--surface-2)", border: "1px solid var(--border-hairline)", color: "var(--text-primary)" }}
                />
              </div>

              <div>
                <div className="mb-2 flex flex-wrap gap-2">
                  {STUDIO_PLATFORMS.map((p) => (
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
                  value={variants[activeVariant]}
                  onChange={(e) => setVariants((prev) => ({ ...prev, [activeVariant]: e.target.value }))}
                  rows={3}
                  className="w-full resize-none rounded-xl px-3 py-2.5 text-sm outline-none"
                  style={{ backgroundColor: "var(--surface-2)", border: "1px solid var(--border-hairline)", color: "var(--text-primary)" }}
                />
              </div>
            </div>
          )}

          <div className="rounded-2xl p-5" style={{ backgroundColor: "var(--surface-1)", border: "1px solid var(--border-hairline)" }}>
            <h3 className="mb-3 text-sm font-semibold" style={{ color: "var(--text-secondary)" }}>
              Publicar en las redes de {artist.name}
            </h3>
            <div className="mb-4 flex flex-wrap gap-2">
              {STUDIO_PLATFORMS.map((p) => (
                <PlatformStatusChip
                  key={p}
                  platform={p}
                  selected={selectedPlatforms.has(p)}
                  status={publishStatuses[p]}
                  onToggle={() => togglePlatform(p)}
                  onRetry={() => retryPlatform(p)}
                />
              ))}
            </div>
            <button
              onClick={handlePublish}
              disabled={publishing || !generated}
              className="w-full rounded-xl py-2.5 text-sm font-semibold disabled:opacity-50"
              style={{ backgroundColor: "var(--text-primary)", color: "var(--page-plane)" }}
            >
              {publishing ? "Publicando..." : "Publicar en todas"}
            </button>
            <p className="mt-2 text-xs" style={{ color: "var(--text-muted)" }}>
              Simulado por ahora — cuando conectes las cuentas reales de {artist.name} por OAuth, este boton publicara de verdad.
            </p>
          </div>
        </div>
      </div>

      {history.length > 0 && (
        <div className="rounded-2xl p-5" style={{ backgroundColor: "var(--surface-1)", border: "1px solid var(--border-hairline)" }}>
          <h3 className="mb-3 text-sm font-semibold" style={{ color: "var(--text-secondary)" }}>
            Publicaciones de esta sesion
          </h3>
          <ul className="flex flex-col gap-3">
            {history.map((h) => (
              <li key={h.id} className="flex items-center gap-3 text-sm">
                {h.thumb ? (
                  h.thumbType === "video" ? (
                    <video src={h.thumb} muted className="h-10 w-10 rounded-lg object-cover" />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={h.thumb} alt="" className="h-10 w-10 rounded-lg object-cover" />
                  )
                ) : (
                  <div className="h-10 w-10 rounded-lg" style={{ backgroundColor: "var(--surface-2)" }} />
                )}
                <div className="min-w-0 flex-1">
                  <div className="truncate" style={{ color: "var(--text-secondary)" }}>
                    {h.caption}
                  </div>
                  <div className="flex items-center gap-2 text-xs" style={{ color: "var(--text-muted)" }}>
                    {h.time} ·{" "}
                    {h.platforms.map((p) => (
                      <PlatformIcon key={p} platform={p} />
                    ))}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function PlatformStatusChip({
  platform,
  selected,
  status,
  onToggle,
  onRetry,
}: {
  platform: SocialPlatformId;
  selected: boolean;
  status: PublishState;
  onToggle: () => void;
  onRetry: () => void;
}) {
  const label: Record<PublishState, string> = {
    idle: "",
    queued: "En cola",
    publishing: "Publicando…",
    success: "Publicado",
    error: "Error",
  };
  const color =
    status === "success"
      ? "var(--status-good)"
      : status === "error"
        ? "var(--status-critical)"
        : status === "publishing" || status === "queued"
          ? "var(--status-warning)"
          : "var(--text-muted)";

  return (
    <button
      onClick={status === "error" ? onRetry : onToggle}
      className="flex items-center gap-2 rounded-full py-1.5 pl-2 pr-3 text-xs font-medium"
      style={{
        backgroundColor: selected ? "var(--surface-2)" : "transparent",
        border: `1px solid ${selected ? "var(--border-hairline)" : "var(--gridline)"}`,
        color: selected ? "var(--text-primary)" : "var(--text-muted)",
        opacity: selected ? 1 : 0.6,
      }}
    >
      <PlatformIcon platform={platform} />
      {PLATFORM_META[platform].label}
      {status !== "idle" && (
        <span className="flex items-center gap-1" style={{ color }}>
          <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: color }} />
          {label[status]}
          {status === "error" ? " · reintentar" : ""}
        </span>
      )}
    </button>
  );
}
