"use client";

import { useEffect, useState } from "react";
import { ArtistData } from "@/lib/types";
import { InstagramPost, getInstagramPosts } from "@/lib/instagram-studio";
import { instagramThumbnail } from "@/lib/instagram-thumb";
import { STATIC_DEMO } from "@/lib/static-demo";
import { formatCompact } from "@/lib/format";

const MEDIA_TYPE_LABEL: Record<InstagramPost["mediaType"], string> = {
  IMAGE: "Foto",
  VIDEO: "Video",
  CAROUSEL_ALBUM: "Carrusel",
};

interface InstagramProfileInfo {
  username: string;
  name: string;
  profilePictureUrl: string;
  followersCount: number;
  mediaCount: number;
}

function InstagramConnectPanel({ artistId, onConnectionChange }: { artistId: string; onConnectionChange?: (connected: boolean) => void }) {
  const [loading, setLoading] = useState(true);
  const [configured, setConfigured] = useState(false);
  const [connected, setConnected] = useState(false);
  const [profile, setProfile] = useState<InstagramProfileInfo | null>(null);
  const [notice, setNotice] = useState<{ kind: "success" | "error"; text: string } | null>(null);
  const [disconnecting, setDisconnecting] = useState(false);

  async function refreshStatus() {
    if (STATIC_DEMO) {
      setLoading(false);
      return;
    }
    try {
      const res = await fetch(`/api/instagram/status?artistId=${encodeURIComponent(artistId)}`);
      const data = await res.json();
      setConfigured(Boolean(data.configured));
      setConnected(Boolean(data.connected));
      setProfile(data.profile ?? null);
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
    const connectedFor = params.get("instagram_connected");
    const err = params.get("instagram_error");
    if (connectedFor === artistId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- reflecting the OAuth redirect result back into the UI once
      setNotice({ kind: "success", text: "Cuenta de Instagram conectada." });
      window.history.replaceState({}, "", window.location.pathname);
    } else if (err) {
      setNotice({ kind: "error", text: `No se pudo conectar Instagram: ${err}` });
      window.history.replaceState({}, "", window.location.pathname);
    }
    refreshStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [artistId]);

  async function handleDisconnect() {
    setDisconnecting(true);
    try {
      await fetch("/api/instagram/disconnect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ artistId }),
      });
      setConnected(false);
      setProfile(null);
      onConnectionChange?.(false);
    } finally {
      setDisconnecting(false);
    }
  }

  return (
    <div className="rounded-2xl p-5" style={{ backgroundColor: "var(--surface-1)", border: "1px solid var(--border-hairline)" }}>
      <h3 className="mb-1 text-sm font-semibold" style={{ color: "var(--text-secondary)" }}>
        Conectar tu cuenta de Instagram
      </h3>
      <p className="mb-3 text-xs" style={{ color: "var(--text-muted)" }}>
        Inicia sesion con tu cuenta profesional de Instagram (Business o Creator) para ver seguidores, publicaciones
        y su engagement real en vez de los datos de ejemplo.
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
          Esta conexion todavia no esta configurada — hace falta una app de Meta para desarrolladores
          (INSTAGRAM_APP_ID / INSTAGRAM_APP_SECRET) en el servidor.
        </p>
      ) : connected ? (
        <div className="flex flex-wrap items-center gap-3">
          {profile?.profilePictureUrl && (
            // eslint-disable-next-line @next/next/no-img-element -- remote Instagram avatar, not an optimizable local asset
            <img src={profile.profilePictureUrl} alt="" className="h-10 w-10 rounded-full" />
          )}
          <div>
            <div className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
              {profile?.name ?? "Cuenta conectada"} {profile?.username && <span style={{ color: "var(--text-muted)" }}>@{profile.username}</span>}
            </div>
            {profile && (
              <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                {formatCompact(profile.followersCount)} seguidores · {formatCompact(profile.mediaCount)} publicaciones
              </div>
            )}
          </div>
          <button
            onClick={handleDisconnect}
            disabled={disconnecting}
            className="ml-auto rounded-full px-3 py-1.5 text-xs font-medium disabled:opacity-50"
            style={{ border: "1px solid var(--status-critical)", color: "var(--status-critical)" }}
          >
            Desconectar
          </button>
        </div>
      ) : (
        <a
          href={`/api/instagram/auth/start?artistId=${encodeURIComponent(artistId)}`}
          className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold"
          style={{ backgroundColor: "var(--text-primary)", color: "var(--page-plane)" }}
        >
          Conectar con Instagram
        </a>
      )}
    </div>
  );
}

export function InstagramStudio({ data }: { data: ArtistData }) {
  const { artist } = data;
  const mockChannel = data.platforms.instagram;
  const posts = getInstagramPosts(artist.id);
  const [realPosts, setRealPosts] = useState<InstagramPost[] | null>(null);
  const [realHeader, setRealHeader] = useState<{ headline: { value: string; label: string }; stats: { label: string; value: string }[] } | null>(
    null
  );
  const [postsNote, setPostsNote] = useState<string | null>(null);

  async function handleConnectionChange(connected: boolean) {
    if (!connected) {
      setRealPosts(null);
      setRealHeader(null);
      setPostsNote(null);
      return;
    }
    try {
      const res = await fetch(`/api/instagram/stats?artistId=${encodeURIComponent(artist.id)}`);
      const stats = await res.json();
      if (!res.ok) return;
      setRealHeader({
        headline: { value: formatCompact(stats.profile.followersCount), label: "Seguidores" },
        stats: [{ label: "Publicaciones", value: formatCompact(stats.profile.mediaCount) }],
      });
      if (Array.isArray(stats.media)) {
        setRealPosts(
          (
            stats.media as {
              id: string;
              caption: string;
              mediaType: InstagramPost["mediaType"];
              thumbnailUrl: string;
              likeCount: number;
              commentsCount: number;
              timestamp: string;
            }[]
          ).map((m) => ({
            id: m.id,
            caption: m.caption,
            thumbSeed: m.id,
            thumbnailUrl: m.thumbnailUrl,
            mediaType: m.mediaType,
            likes: m.likeCount,
            comments: m.commentsCount,
            publishedAt: m.timestamp,
          }))
        );
        setPostsNote(null);
      } else {
        setPostsNote(stats.mediaError ? `No se pudo cargar la lista de publicaciones: ${stats.mediaError}` : null);
      }
    } catch {
      // leave mock data in place if the real fetch fails
    }
  }

  const channel = realHeader ?? mockChannel;
  const displayPosts = realPosts ?? posts;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>
            Instagram Studio
          </h2>
          <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
            {realPosts
              ? `Publicaciones de ${artist.name} — datos reales de su cuenta de Instagram.`
              : `Publicaciones de ${artist.name} — datos de ejemplo hasta conectar la cuenta real de Instagram.`}
          </p>
          {postsNote && (
            <p className="mt-1 text-xs" style={{ color: "var(--status-warning)" }}>
              {postsNote}
            </p>
          )}
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

      <InstagramConnectPanel artistId={artist.id} onConnectionChange={handleConnectionChange} />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {displayPosts.map((p) => (
          <div
            key={p.id}
            className="flex flex-col gap-2 rounded-2xl"
            style={{ backgroundColor: "var(--surface-1)", border: "1px solid var(--border-hairline)" }}
          >
            <div className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element -- remote Instagram thumbnail or generated data-URI placeholder */}
              <img
                src={p.thumbnailUrl || instagramThumbnail(p.thumbSeed)}
                alt=""
                className="aspect-square w-full rounded-t-2xl object-cover"
              />
              <span
                className="absolute bottom-2 right-2 rounded px-1.5 py-0.5 text-[12px] font-semibold text-white"
                style={{ backgroundColor: "rgba(0,0,0,0.75)" }}
              >
                {MEDIA_TYPE_LABEL[p.mediaType]}
              </span>
            </div>
            <div className="flex flex-col gap-1.5 px-3 pb-3">
              <p className="line-clamp-2 text-xs" style={{ color: "var(--text-primary)" }}>
                {p.caption}
              </p>
              <div className="flex flex-wrap gap-2 text-xs" style={{ color: "var(--text-muted)" }}>
                <span>{formatCompact(p.likes)} likes</span>
                <span>{formatCompact(p.comments)} comentarios</span>
              </div>
              <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                {p.publishedAt}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
