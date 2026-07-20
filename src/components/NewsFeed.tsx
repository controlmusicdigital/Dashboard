"use client";

import { useEffect, useRef, useState } from "react";
import { NewsItem } from "@/lib/news-types";
import { newsThumbnail } from "@/lib/news-thumb";
import { PlatformIcon } from "@/lib/platforms";
import { SHARE_PLATFORMS, buildShare } from "@/lib/share";
import { logActivity } from "@/lib/team";
import { STATIC_DEMO } from "@/lib/static-demo";
import { mockNews } from "@/lib/claude/news-mock";

const REFRESH_MS = 60 * 60 * 1000; // 1 hour

export function NewsFeed() {
  const [items, setItems] = useState<NewsItem[]>([]);
  const [source, setSource] = useState<"claude" | "mock" | null>(null);
  const [note, setNote] = useState<string | undefined>();
  const [generatedAt, setGeneratedAt] = useState<Date | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notifPermission, setNotifPermission] = useState<NotificationPermission | "unsupported">("default");
  const hasLoadedOnce = useRef(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time browser capability check, unavailable during SSR
    setNotifPermission(typeof window !== "undefined" && "Notification" in window ? Notification.permission : "unsupported");
  }, []);

  async function load() {
    setLoading(true);
    setError(null);
    if (STATIC_DEMO) {
      setItems(mockNews());
      setSource("mock");
      setNote("Demo estatica — la busqueda en vivo con Claude necesita la app completa con servidor.");
      setGeneratedAt(new Date());
      setLoading(false);
      return;
    }
    try {
      const res = await fetch("/api/news");
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "No se pudieron cargar las noticias");
      setItems(data.items ?? []);
      setSource(data.source ?? null);
      setNote(data.note);
      setGeneratedAt(new Date(data.generatedAt));

      if (hasLoadedOnce.current && typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
        new Notification("Noticias de la industria actualizadas", {
          body: `${(data.items ?? []).length} titulares de musica y farandula en Republica Dominicana.`,
        });
      }
      hasLoadedOnce.current = true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudieron cargar las noticias");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial fetch-on-mount, deliberately shows a loading state immediately
    load();
    if (STATIC_DEMO) return;
    const interval = setInterval(load, REFRESH_MS);
    return () => clearInterval(interval);
  }, []);

  async function enableNotifications() {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    const permission = await Notification.requestPermission();
    setNotifPermission(permission);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>
            Noticias y farandula
          </h2>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            Industria musical de Republica Dominicana · se actualiza automaticamente cada hora
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {notifPermission !== "unsupported" && notifPermission !== "granted" && (
            <button
              onClick={enableNotifications}
              className="rounded-full px-3 py-1.5 text-xs font-medium"
              style={{ border: "1px solid var(--border-hairline)", color: "var(--text-secondary)" }}
            >
              🔔 Activar notificaciones
            </button>
          )}
          {notifPermission === "granted" && (
            <span
              className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium"
              style={{ color: "var(--status-good)", border: "1px solid var(--status-good)" }}
            >
              <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: "var(--status-good)" }} />
              Notificaciones activas
            </span>
          )}
          <span
            className="rounded-full px-2.5 py-1 text-xs font-medium"
            style={{
              color: source === "claude" ? "var(--status-good)" : "var(--status-warning)",
              border: `1px solid ${source === "claude" ? "var(--status-good)" : "var(--status-warning)"}`,
            }}
          >
            {source === "claude" ? "Busqueda en vivo" : "Datos de ejemplo"}
          </span>
          <button
            onClick={load}
            disabled={loading}
            className="rounded-full px-3 py-1.5 text-xs font-semibold disabled:opacity-60"
            style={{ backgroundColor: "var(--text-primary)", color: "var(--page-plane)" }}
          >
            {loading ? "Actualizando..." : "Actualizar ahora"}
          </button>
        </div>
      </div>

      {generatedAt && (
        <p className="-mt-2 text-xs" style={{ color: "var(--text-muted)" }}>
          Ultima actualizacion: {generatedAt.toLocaleTimeString("es-DO", { hour: "2-digit", minute: "2-digit" })}
        </p>
      )}
      {note && (
        <p className="-mt-2 text-xs" style={{ color: "var(--status-warning)" }}>
          {note}
        </p>
      )}
      {error && (
        <p className="-mt-2 text-xs" style={{ color: "var(--status-critical)" }}>
          {error}
        </p>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {items.map((item, i) => (
          <article
            key={i}
            className="flex flex-col gap-3 rounded-2xl"
            style={{ backgroundColor: "var(--surface-1)", border: "1px solid var(--border-hairline)" }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- generated data-URI thumbnail, not an optimizable remote asset */}
            <img src={newsThumbnail(item.title)} alt="" className="h-32 w-full rounded-t-2xl object-cover" />
            <div className="flex flex-col gap-2 px-5 pb-5">
              <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                {item.url ? (
                  <a href={item.url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                    {item.title}
                  </a>
                ) : (
                  item.title
                )}
              </h3>
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                {item.summary}
              </p>
              <div className="flex items-center justify-between gap-2">
                <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                  {item.source} · {item.publishedAt}
                </div>
                <ShareMenu item={item} />
              </div>
            </div>
          </article>
        ))}
        {items.length === 0 && !loading && (
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            No hay noticias disponibles todavia.
          </p>
        )}
      </div>
    </div>
  );
}

function ShareMenu({ item }: { item: NewsItem }) {
  const [open, setOpen] = useState(false);
  const [copiedNote, setCopiedNote] = useState<string | null>(null);

  async function handleShare(platform: (typeof SHARE_PLATFORMS)[number]) {
    const link = item.url || "https://controlmusicdigital.com";
    const target = buildShare(platform, item.title, link);
    if (target.kind === "link") {
      window.open(target.url, "_blank", "noopener,noreferrer");
    } else {
      try {
        await navigator.clipboard.writeText(target.text);
        setCopiedNote(`Texto copiado — pegalo en la app de ${platform === "instagram" ? "Instagram" : "TikTok"}.`);
      } catch {
        setCopiedNote("No se pudo copiar automaticamente.");
      }
      setTimeout(() => setCopiedNote(null), 4000);
    }
    logActivity(`compartio una noticia en ${platform === "x" ? "X" : platform}`, "news", "Noticias", item.title.slice(0, 60));
    setOpen(false);
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="rounded-full px-3 py-1.5 text-xs font-semibold"
        style={{ backgroundColor: "var(--surface-2)", border: "1px solid var(--border-hairline)", color: "var(--text-secondary)" }}
      >
        Compartir
      </button>
      {open && (
        <div
          className="absolute right-0 z-10 mt-2 flex flex-col gap-1 rounded-xl p-2"
          style={{ backgroundColor: "var(--surface-2)", border: "1px solid var(--border-hairline)", minWidth: 160 }}
        >
          {SHARE_PLATFORMS.map((p) => (
            <button
              key={p}
              onClick={() => handleShare(p)}
              className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs font-medium hover:opacity-80"
              style={{ color: "var(--text-primary)" }}
            >
              <PlatformIcon platform={p} />
              {p === "x" ? "X" : p[0].toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>
      )}
      {copiedNote && (
        <p className="absolute right-0 mt-1 w-48 text-right text-[11px]" style={{ color: "var(--status-good)" }}>
          {copiedNote}
        </p>
      )}
    </div>
  );
}
