"use client";

import { useEffect, useRef, useState } from "react";
import { ArtistData } from "@/lib/types";
import { YouTubeVideo, formatCount, formatDuration, getYouTubeVideos } from "@/lib/youtube-studio";
import { youtubeThumbnail } from "@/lib/youtube-thumb";
import { logActivity } from "@/lib/team";
import { STATIC_DEMO } from "@/lib/static-demo";
import { formatCompact } from "@/lib/format";

const STATUS_LABEL: Record<YouTubeVideo["status"], string> = {
  publico: "Publico",
  "no listado": "No listado",
  borrador: "Borrador",
};

interface YouTubeChannelInfo {
  title: string;
  thumbnailUrl: string;
  subscriberCount: number;
  viewCount: number;
  videoCount: number;
}

interface YouTubeAnalyticsDay {
  date: string;
  views: number;
  minutesWatched: number;
  subscribersGained: number;
}

function YouTubeConnectPanel({ artistId, onConnectionChange }: { artistId: string; onConnectionChange?: (connected: boolean) => void }) {
  const [loading, setLoading] = useState(true);
  const [configured, setConfigured] = useState(false);
  const [connected, setConnected] = useState(false);
  const [channel, setChannel] = useState<YouTubeChannelInfo | null>(null);
  const [analytics, setAnalytics] = useState<YouTubeAnalyticsDay[] | null>(null);
  const [notice, setNotice] = useState<{ kind: "success" | "error"; text: string } | null>(null);
  const [disconnecting, setDisconnecting] = useState(false);
  const [debugInfo, setDebugInfo] = useState<unknown>(null);

  async function refreshStatus() {
    if (STATIC_DEMO) {
      setLoading(false);
      return;
    }
    try {
      const res = await fetch(`/api/youtube/status?artistId=${encodeURIComponent(artistId)}`);
      const data = await res.json();
      setConfigured(Boolean(data.configured));
      setConnected(Boolean(data.connected));
      setChannel(data.channel ?? null);
      setDebugInfo(data.debug ?? null);
      onConnectionChange?.(Boolean(data.connected));
    } catch {
      setConfigured(false);
      setConnected(false);
      onConnectionChange?.(false);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const connectedFor = params.get("youtube_connected");
    const err = params.get("youtube_error");
    if (connectedFor === artistId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- reflecting the OAuth redirect result back into the UI once
      setNotice({ kind: "success", text: "Cuenta de YouTube conectada." });
      window.history.replaceState({}, "", window.location.pathname);
    } else if (err) {
      setNotice({ kind: "error", text: `No se pudo conectar YouTube: ${err}` });
      window.history.replaceState({}, "", window.location.pathname);
    }
    refreshStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [artistId]);

  async function loadAnalytics() {
    try {
      const res = await fetch(`/api/youtube/stats?artistId=${encodeURIComponent(artistId)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "No se pudieron cargar las estadisticas");
      setAnalytics(data.analytics ?? []);
    } catch (err) {
      setNotice({ kind: "error", text: err instanceof Error ? err.message : "No se pudieron cargar las estadisticas" });
    }
  }

  async function handleDisconnect() {
    setDisconnecting(true);
    try {
      await fetch("/api/youtube/disconnect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ artistId }),
      });
      setConnected(false);
      setChannel(null);
      setAnalytics(null);
      onConnectionChange?.(false);
    } finally {
      setDisconnecting(false);
    }
  }

  const totalViews28d = analytics?.reduce((sum, d) => sum + d.views, 0) ?? 0;
  const totalMinutes28d = analytics?.reduce((sum, d) => sum + d.minutesWatched, 0) ?? 0;
  const totalSubsGained28d = analytics?.reduce((sum, d) => sum + d.subscribersGained, 0) ?? 0;

  return (
    <div className="rounded-2xl p-5" style={{ backgroundColor: "var(--surface-1)", border: "1px solid var(--border-hairline)" }}>
      <h3 className="mb-1 text-sm font-semibold" style={{ color: "var(--text-secondary)" }}>
        Conectar tu cuenta de YouTube
      </h3>
      <p className="mb-3 text-xs" style={{ color: "var(--text-muted)" }}>
        Inicia sesion con tu cuenta de Google para ver las estadisticas reales de tu canal (vistas, tiempo de
        reproduccion, suscriptores ganados) en vez de los datos de ejemplo.
      </p>

      {notice && (
        <p className="mb-3 text-xs" style={{ color: notice.kind === "success" ? "var(--status-good)" : "var(--status-critical)" }}>
          {notice.text}
        </p>
      )}

      {STATIC_DEMO ? (
        <p className="text-xs" style={{ color: "var(--status-warning)" }}>
          No disponible en esta demo estatica (GitHub Pages) — funciona en la app completa con su propio servidor.
        </p>
      ) : loading ? (
        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
          Verificando...
        </p>
      ) : !configured ? (
        <p className="text-xs" style={{ color: "var(--status-warning)" }}>
          Esta conexion todavia no esta configurada — hace falta un cliente de OAuth de Google
          (GOOGLE_OAUTH_CLIENT_ID / GOOGLE_OAUTH_CLIENT_SECRET) en el servidor.
        </p>
      ) : connected ? (
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-3">
            {channel?.thumbnailUrl && (
              // eslint-disable-next-line @next/next/no-img-element -- remote Google avatar, not an optimizable local asset
              <img src={channel.thumbnailUrl} alt="" className="h-10 w-10 rounded-full" />
            )}
            <div>
              <div className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                {channel?.title ?? "Cuenta conectada"}
              </div>
              {channel && (
                <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                  {formatCompact(channel.subscriberCount)} suscriptores · {formatCompact(channel.viewCount)} vistas totales
                </div>
              )}
            </div>
            <div className="ml-auto flex gap-2">
              <button
                onClick={loadAnalytics}
                className="rounded-full px-3 py-1.5 text-xs font-semibold"
                style={{ backgroundColor: "var(--text-primary)", color: "var(--page-plane)" }}
              >
                Ver estadisticas (28d)
              </button>
              <button
                onClick={handleDisconnect}
                disabled={disconnecting}
                className="rounded-full px-3 py-1.5 text-xs font-medium disabled:opacity-50"
                style={{ border: "1px solid var(--status-critical)", color: "var(--status-critical)" }}
              >
                Desconectar
              </button>
            </div>
          </div>
          {analytics && (
            <div className="grid grid-cols-3 gap-3">
              <div>
                <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                  Vistas
                </div>
                <div className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                  {formatCompact(totalViews28d)}
                </div>
              </div>
              <div>
                <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                  Minutos vistos
                </div>
                <div className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                  {formatCompact(totalMinutes28d)}
                </div>
              </div>
              <div>
                <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                  Suscriptores ganados
                </div>
                <div className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                  {formatCompact(totalSubsGained28d)}
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <a
          href={`/api/youtube/auth/start?artistId=${encodeURIComponent(artistId)}`}
          className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold"
          style={{ backgroundColor: "var(--text-primary)", color: "var(--page-plane)" }}
        >
          Conectar con Google
        </a>
      )}
      {debugInfo != null && (
        <pre
          className="mt-3 overflow-x-auto rounded-lg p-2 text-[10px]"
          style={{ backgroundColor: "var(--page-plane)", color: "var(--text-muted)" }}
        >
          {JSON.stringify(debugInfo, null, 2)}
        </pre>
      )}
    </div>
  );
}

export function YouTubeStudio({ data }: { data: ArtistData }) {
  const { artist } = data;
  const mockChannel = data.platforms.youtube;
  const [videos, setVideos] = useState<YouTubeVideo[]>(() => getYouTubeVideos(artist.id));
  const [realVideos, setRealVideos] = useState<YouTubeVideo[] | null>(null);
  const [realHeader, setRealHeader] = useState<{ headline: { value: string; label: string }; stats: { label: string; value: string }[] } | null>(
    null
  );

  const [title, setTitle] = useState("");
  const [hasFile, setHasFile] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleConnectionChange(connected: boolean) {
    if (!connected) {
      setRealVideos(null);
      setRealHeader(null);
      return;
    }
    try {
      const res = await fetch(`/api/youtube/stats?artistId=${encodeURIComponent(artist.id)}`);
      const stats = await res.json();
      if (!res.ok) return;
      setRealHeader({
        headline: { value: formatCompact(stats.channel.subscriberCount), label: "Suscriptores" },
        stats: [
          { label: "Vistas totales", value: formatCompact(stats.channel.viewCount) },
          { label: "Videos", value: String(stats.channel.videoCount) },
        ],
      });
      setRealVideos(
        (stats.videos as { id: string; title: string; thumbnailUrl: string; views: number; likes: number; comments: number; durationSec: number; publishedAt: string; status: YouTubeVideo["status"] }[]).map(
          (v) => ({ ...v, thumbSeed: v.id })
        )
      );
    } catch {
      // leave mock data in place if the real fetch fails
    }
  }

  const channel = realHeader ?? mockChannel;
  const displayVideos = realVideos ?? videos;

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    setHasFile(Boolean(e.target.files?.[0]));
  }

  async function handleUpload() {
    if (!title.trim()) return;
    setUploading(true);
    await new Promise((r) => setTimeout(r, 600));
    const video: YouTubeVideo = {
      id: `${artist.id}-yt-new-${Date.now()}`,
      title: title.trim(),
      thumbSeed: `${artist.id}-${title.trim()}-${Date.now()}`,
      views: 0,
      likes: 0,
      comments: 0,
      durationSec: hasFile ? 180 : 0,
      publishedAt: new Date().toISOString().slice(0, 10),
      status: "no listado",
    };
    setVideos((prev) => [video, ...prev]);
    logActivity("subio un video a YouTube Studio", artist.id, artist.name, title.trim().slice(0, 60));
    setTitle("");
    setHasFile(false);
    if (fileRef.current) fileRef.current.value = "";
    setUploading(false);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>
            YouTube Studio
          </h2>
          <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
            {realVideos ? `Videos de ${artist.name} — datos reales de su canal de YouTube.` : `Videos de ${artist.name} — datos de ejemplo hasta conectar la cuenta real de YouTube.`}
          </p>
        </div>
        <div className="flex gap-4 text-sm">
          <div>
            <div className="font-bold" style={{ color: "var(--text-primary)" }}>
              {channel.headline.value}
            </div>
            <div className="text-xs" style={{ color: "var(--text-muted)" }}>
              {channel.headline.label}
            </div>
          </div>
          {channel.stats.map((s) => (
            <div key={s.label}>
              <div className="font-bold" style={{ color: "var(--text-primary)" }}>
                {s.value}
              </div>
              <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      <YouTubeConnectPanel artistId={artist.id} onConnectionChange={handleConnectionChange} />

      <div className="rounded-2xl p-5" style={{ backgroundColor: "var(--surface-1)", border: "1px solid var(--border-hairline)" }}>
        <h3 className="mb-3 text-sm font-semibold" style={{ color: "var(--text-secondary)" }}>
          Subir video
        </h3>
        <div className="flex flex-wrap items-center gap-2">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Titulo del video"
            className="min-w-[220px] flex-1 rounded-xl px-3 py-2 text-sm outline-none"
            style={{ backgroundColor: "var(--surface-2)", border: "1px solid var(--border-hairline)", color: "var(--text-primary)" }}
          />
          <label
            className="flex cursor-pointer items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium"
            style={{ backgroundColor: "var(--surface-2)", border: "1px solid var(--border-hairline)", color: "var(--text-secondary)" }}
          >
            {hasFile ? "Video listo" : "Elegir video"}
            <input ref={fileRef} type="file" accept="video/*,image/*" onChange={handleFile} className="hidden" />
          </label>
          <button
            onClick={handleUpload}
            disabled={uploading || !title.trim()}
            className="rounded-xl px-4 py-2 text-sm font-semibold disabled:opacity-50"
            style={{ backgroundColor: "var(--text-primary)", color: "var(--page-plane)" }}
          >
            {uploading ? "Subiendo..." : "Subir"}
          </button>
        </div>
        <p className="mt-2 text-xs" style={{ color: "var(--status-warning)" }}>
          Simulado por ahora — cuando conectes la cuenta real de YouTube por OAuth, este boton publicara de verdad.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {displayVideos.map((v) => (
          <div
            key={v.id}
            className="flex flex-col gap-3 rounded-2xl"
            style={{ backgroundColor: "var(--surface-1)", border: "1px solid var(--border-hairline)" }}
          >
            <div className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element -- remote YouTube thumbnail or generated data-URI placeholder */}
              <img src={v.thumbnailUrl || youtubeThumbnail(v.thumbSeed)} alt="" className="aspect-video w-full rounded-t-2xl object-cover" />
              {v.durationSec > 0 && (
                <span
                  className="absolute bottom-2 right-2 rounded px-1.5 py-0.5 text-[13px] font-semibold text-white"
                  style={{ backgroundColor: "rgba(0,0,0,0.75)" }}
                >
                  {formatDuration(v.durationSec)}
                </span>
              )}
            </div>
            <div className="flex flex-col gap-2 px-4 pb-4">
              <div className="flex items-start justify-between gap-2">
                <h4 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                  {v.title}
                </h4>
                <span
                  className="flex-shrink-0 rounded-full px-2 py-0.5 text-[12px] font-semibold"
                  style={
                    v.status === "publico"
                      ? { color: "var(--status-good)", border: "1px solid var(--status-good)" }
                      : v.status === "borrador"
                        ? { color: "var(--status-warning)", border: "1px solid var(--status-warning)" }
                        : { color: "var(--text-muted)", border: "1px solid var(--border-hairline)" }
                  }
                >
                  {STATUS_LABEL[v.status]}
                </span>
              </div>
              <div className="flex flex-wrap gap-3 text-xs" style={{ color: "var(--text-muted)" }}>
                <span>{formatCount(v.views)} vistas</span>
                <span>{formatCount(v.likes)} likes</span>
                <span>{formatCount(v.comments)} comentarios</span>
              </div>
              <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                {v.publishedAt}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
