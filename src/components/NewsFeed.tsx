"use client";

import { useEffect, useRef, useState } from "react";
import { NewsItem } from "@/lib/news-types";

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
            className="flex flex-col gap-2 rounded-2xl p-5"
            style={{ backgroundColor: "var(--surface-1)", border: "1px solid var(--border-hairline)" }}
          >
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
            <div className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
              {item.source} · {item.publishedAt}
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
