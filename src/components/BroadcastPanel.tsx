"use client";

import { useEffect, useRef, useState } from "react";
import { BroadcastMedia, BroadcastPlatform, BroadcastResult } from "@/lib/broadcast-types";
import { AIProvider } from "@/lib/studio-types";
import { logActivity } from "@/lib/team";
import { getSuggested, recordChoice } from "@/lib/memory";
import { STATIC_DEMO, STATIC_DEMO_NOTE } from "@/lib/static-demo";

const MEMORY_SCOPE = "broadcast";

const PLATFORMS: { id: BroadcastPlatform; label: string; color: string }[] = [
  { id: "telegram", label: "Telegram", color: "#26A5E4" },
  { id: "whatsapp", label: "WhatsApp", color: "#25D366" },
];

function PlatformGlyph({ id, color }: { id: BroadcastPlatform; color: string }) {
  return (
    <span
      className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
      style={{ backgroundColor: `${color}1f`, color }}
      aria-hidden
    >
      {id === "telegram" ? (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M21.5 4.5 3 11.6c-1 .4-1 1.6.1 1.9l4.6 1.4 1.8 5.6c.3 1 1.6 1.2 2.2.4l2.4-3 4.6 3.4c.9.6 2.1.1 2.3-1l2.6-13.6c.2-1.2-1-2-2.1-1.2Zm-3.1 3.5-7.6 6.9-.3 3.1-1.4-4.4 9-6.5c.2-.1.5.2.3.4Z" />
        </svg>
      ) : (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5.1-1.3A10 10 0 1 0 12 2Zm5.6 14.2c-.2.7-1.4 1.3-2 1.4-.5.1-1.2.1-1.9-.1-.4-.1-1-.3-1.7-.6-3-1.3-4.9-4.3-5.1-4.5-.1-.2-1.2-1.6-1.2-3.1 0-1.5.8-2.2 1-2.5.3-.3.6-.4.8-.4h.6c.2 0 .4 0 .6.5.2.5.7 1.8.8 1.9.1.2.1.3 0 .5-.1.2-.1.3-.3.5l-.5.5c-.2.2-.3.3-.1.6.2.3.8 1.3 1.7 2.1 1.2 1 2.1 1.4 2.5 1.6.3.1.4.1.6-.1l.9-1c.2-.3.4-.2.7-.1l1.7.8c.2.1.4.2.4.4.1.2.1.9-.1 1.6Z" />
        </svg>
      )}
    </span>
  );
}

export function BroadcastPanel() {
  const [status, setStatus] = useState<{ telegram: boolean; whatsapp: boolean } | null>(null);
  const [selected, setSelected] = useState<Set<BroadcastPlatform>>(new Set(["telegram", "whatsapp"]));
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<{ id: string; time: string; message: string; results: BroadcastResult[] }[]>([]);

  const [topic, setTopic] = useState("");
  const [provider, setProvider] = useState<AIProvider>("gemini");
  const [generating, setGenerating] = useState(false);
  const [genNote, setGenNote] = useState<string | null>(null);

  const [media, setMedia] = useState<BroadcastMedia | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (STATIC_DEMO) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- static export has no API routes, so the status is known at build time
      setStatus({ telegram: false, whatsapp: false });
    } else {
      fetch("/api/broadcast-status")
        .then((r) => r.json())
        .then(setStatus)
        .catch(() => setStatus({ telegram: false, whatsapp: false }));
    }

    const suggestedProvider = getSuggested(MEMORY_SCOPE, "provider");
    if (suggestedProvider === "gemini" || suggestedProvider === "chatgpt") setProvider(suggestedProvider);

    const suggestedPlatforms = getSuggested(MEMORY_SCOPE, "platforms");
    if (suggestedPlatforms) {
      const ids = suggestedPlatforms.split(",").filter((p): p is BroadcastPlatform => p === "telegram" || p === "whatsapp");
      if (ids.length > 0) setSelected(new Set(ids));
    }
  }, []);

  function togglePlatform(id: BroadcastPlatform) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleGenerate() {
    if (!topic.trim()) {
      setError("Escribe un tema para generar el mensaje.");
      return;
    }
    if (STATIC_DEMO) {
      setError(STATIC_DEMO_NOTE);
      return;
    }
    setError(null);
    setGenerating(true);
    setGenNote(null);
    try {
      const res = await fetch("/api/generate-broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider, topic: topic.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "No se pudo generar el mensaje");
      setMessage(data.message);
      if (data.note) setGenNote(data.note);
      recordChoice(MEMORY_SCOPE, "provider", provider);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo generar el mensaje");
    } finally {
      setGenerating(false);
    }
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const kind = file.type.startsWith("video") ? "video" : "image";
    const reader = new FileReader();
    reader.onload = () => setMedia({ dataUrl: reader.result as string, mimeType: file.type, kind });
    reader.readAsDataURL(file);
  }

  async function handleSend() {
    if (!message.trim() && !media) {
      setError("Escribe un mensaje o adjunta una imagen/video para difundir.");
      return;
    }
    if (selected.size === 0) {
      setError("Selecciona al menos una plataforma.");
      return;
    }
    if (STATIC_DEMO) {
      setError(STATIC_DEMO_NOTE);
      return;
    }
    setError(null);
    setSending(true);
    try {
      const platforms = Array.from(selected);
      const res = await fetch("/api/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: message.trim(), platforms, media }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "No se pudo enviar la difusion");
      const results = data.results as BroadcastResult[];
      setHistory((prev) => [
        {
          id: `${Date.now()}`,
          time: new Date().toLocaleTimeString("es-DO", { hour: "2-digit", minute: "2-digit" }),
          message: message.trim() || (media ? `[${media.kind === "image" ? "Imagen" : "Video"} sin texto]` : ""),
          results,
        },
        ...prev,
      ]);
      logActivity(
        `difundio un mensaje por ${results.map((r) => (r.platform === "telegram" ? "Telegram" : "WhatsApp")).join(" y ")}`,
        "broadcast",
        "Difusion",
        message.trim().slice(0, 60)
      );
      recordChoice(MEMORY_SCOPE, "platforms", platforms.slice().sort().join(","));
      setMessage("");
      setMedia(null);
      if (fileRef.current) fileRef.current.value = "";
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo enviar la difusion");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>
          Difusion
        </h2>
        <p className="mt-1 max-w-2xl text-xs" style={{ color: "var(--text-muted)" }}>
          Manda un mensaje — con foto o video si quieres — por Telegram, WhatsApp, o los dos a la vez. Cada uno se
          envia de verdad en cuanto configures sus credenciales en <code>.env.local</code>; sin configurar, se simula
          y queda marcado como tal.
        </p>
      </div>

      <div className="rounded-2xl p-5" style={{ backgroundColor: "var(--surface-1)", border: "1px solid var(--border-hairline)" }}>
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold" style={{ color: "var(--text-secondary)" }}>
            Generar con IA
          </h3>
          <div className="flex gap-1 rounded-full p-1" style={{ backgroundColor: "var(--surface-2)" }}>
            {(["gemini", "chatgpt"] as AIProvider[]).map((p) => (
              <button
                key={p}
                onClick={() => setProvider(p)}
                className="rounded-full px-3 py-1 text-xs font-semibold"
                style={
                  provider === p
                    ? { backgroundColor: "var(--text-primary)", color: "var(--page-plane)" }
                    : { color: "var(--text-muted)" }
                }
              >
                {p === "gemini" ? "Gemini" : "ChatGPT"}
              </button>
            ))}
          </div>
        </div>
        <input
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="Ej. adelanto del proximo sencillo de Pacheman"
          className="mt-3 w-full rounded-xl px-3 py-2 text-sm outline-none"
          style={{ backgroundColor: "var(--surface-2)", border: "1px solid var(--border-hairline)", color: "var(--text-primary)" }}
        />
        <button
          onClick={handleGenerate}
          disabled={generating || !topic.trim()}
          className="mt-2 w-full rounded-xl py-2.5 text-sm font-semibold disabled:opacity-50"
          style={{ backgroundColor: "var(--seq-500)", color: "#fff" }}
        >
          {generating ? "Generando..." : `Generar con ${provider === "gemini" ? "Gemini" : "ChatGPT"}`}
        </button>
        {genNote && (
          <p className="mt-2 text-xs" style={{ color: "var(--status-warning)" }}>
            {genNote}
          </p>
        )}
      </div>

      <div className="rounded-2xl p-5" style={{ backgroundColor: "var(--surface-1)", border: "1px solid var(--border-hairline)" }}>
        <label className="field-label" style={{ fontSize: 11, fontWeight: 500, color: "var(--text-muted)" }}>
          Mensaje
        </label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={4}
          placeholder="Ej. Nuevo sencillo de Pacheman disponible ahora en todas las plataformas 🔥"
          className="mt-1 w-full resize-none rounded-xl px-3 py-2 text-sm outline-none"
          style={{ backgroundColor: "var(--surface-2)", border: "1px solid var(--border-hairline)", color: "var(--text-primary)" }}
        />

        <div className="mt-3">
          {media ? (
            <div className="relative w-fit">
              {media.kind === "image" ? (
                // eslint-disable-next-line @next/next/no-img-element -- local preview of a user-picked file, not an optimizable remote asset
                <img src={media.dataUrl} alt="" className="h-32 w-32 rounded-xl object-cover" />
              ) : (
                <video src={media.dataUrl} className="h-32 w-32 rounded-xl object-cover" muted controls />
              )}
              <button
                onClick={() => {
                  setMedia(null);
                  if (fileRef.current) fileRef.current.value = "";
                }}
                className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold"
                style={{ backgroundColor: "var(--status-critical)", color: "#fff" }}
              >
                ✕
              </button>
            </div>
          ) : (
            <label
              className="flex cursor-pointer items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-medium"
              style={{ backgroundColor: "var(--surface-2)", border: "1px solid var(--border-hairline)", color: "var(--text-secondary)" }}
            >
              📷 Adjuntar foto o video
              <input ref={fileRef} type="file" accept="image/*,video/*" onChange={handleFile} className="hidden" />
            </label>
          )}
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {PLATFORMS.map((p) => {
            const on = selected.has(p.id);
            const configured = status?.[p.id];
            return (
              <button
                key={p.id}
                onClick={() => togglePlatform(p.id)}
                className="flex items-center gap-2 rounded-full py-1.5 pl-2 pr-3 text-xs font-medium"
                style={{
                  border: `1px solid ${on ? "var(--border-hairline)" : "var(--gridline)"}`,
                  backgroundColor: on ? "var(--surface-2)" : "transparent",
                  color: on ? "var(--text-primary)" : "var(--text-muted)",
                  opacity: on ? 1 : 0.65,
                }}
              >
                <PlatformGlyph id={p.id} color={p.color} />
                {p.label}
                {status && (
                  <span
                    className="rounded-full px-1.5 py-0.5 text-[10px] font-semibold"
                    style={configured ? { color: "var(--status-good)" } : { color: "var(--status-warning)" }}
                  >
                    {configured ? "Real" : "Demo"}
                  </span>
                )}
              </button>
            );
          })}
        </div>
        {error && (
          <p className="mt-2 text-xs" style={{ color: "var(--status-critical)" }}>
            {error}
          </p>
        )}
        <button
          onClick={handleSend}
          disabled={sending || (!message.trim() && !media) || selected.size === 0}
          className="mt-4 rounded-xl px-4 py-2.5 text-sm font-semibold disabled:opacity-50"
          style={{ backgroundColor: "var(--text-primary)", color: "var(--page-plane)" }}
        >
          {sending ? "Enviando..." : selected.size === 2 ? "Difundir a Telegram y WhatsApp" : "Difundir"}
        </button>
      </div>

      {history.length > 0 && (
        <div className="flex flex-col gap-2">
          <h3 className="text-sm font-semibold" style={{ color: "var(--text-secondary)" }}>
            Historial de esta sesion
          </h3>
          {history.map((h) => (
            <div key={h.id} className="rounded-2xl p-4" style={{ backgroundColor: "var(--surface-1)", border: "1px solid var(--border-hairline)" }}>
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm" style={{ color: "var(--text-primary)" }}>
                  {h.message}
                </p>
                <span className="flex-shrink-0 text-xs" style={{ color: "var(--text-muted)" }}>
                  {h.time}
                </span>
              </div>
              <div className="mt-2 flex flex-wrap gap-3">
                {h.results.map((r) => (
                  <span
                    key={r.platform}
                    className="flex items-center gap-1.5 text-xs font-medium"
                    style={{ color: r.ok ? (r.simulated ? "var(--status-warning)" : "var(--status-good)") : "var(--status-critical)" }}
                  >
                    {r.platform === "telegram" ? "Telegram" : "WhatsApp"}: {r.detail}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
