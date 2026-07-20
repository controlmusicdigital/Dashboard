"use client";

import { useRef, useState } from "react";
import { ArtistData } from "@/lib/types";
import { YouTubeVideo, formatCount, formatDuration, getYouTubeVideos } from "@/lib/youtube-studio";
import { youtubeThumbnail } from "@/lib/youtube-thumb";
import { logActivity } from "@/lib/team";

const STATUS_LABEL: Record<YouTubeVideo["status"], string> = {
  publico: "Publico",
  "no listado": "No listado",
  borrador: "Borrador",
};

export function YouTubeStudio({ data }: { data: ArtistData }) {
  const { artist } = data;
  const channel = data.platforms.youtube;
  const [videos, setVideos] = useState<YouTubeVideo[]>(() => getYouTubeVideos(artist.id));

  const [title, setTitle] = useState("");
  const [hasFile, setHasFile] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

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
            Videos de {artist.name} — datos de ejemplo hasta conectar la cuenta real de YouTube.
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
        {videos.map((v) => (
          <div
            key={v.id}
            className="flex flex-col gap-3 rounded-2xl"
            style={{ backgroundColor: "var(--surface-1)", border: "1px solid var(--border-hairline)" }}
          >
            <div className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element -- generated data-URI thumbnail, not an optimizable remote asset */}
              <img src={youtubeThumbnail(v.thumbSeed)} alt="" className="aspect-video w-full rounded-t-2xl object-cover" />
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
