"use client";

import { useEffect, useRef, useState } from "react";
import { Artist } from "@/lib/types";
import { speak, speechSupported, stopSpeaking, useSpeechInput } from "@/lib/useSpeech";
import { STATIC_DEMO } from "@/lib/static-demo";

const VOICE_LANG = "es-DO";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

type ChatProvider = "claude" | "chatgpt" | null;

export function ArtistChat({ artist }: { artist: Artist }) {
  const [provider, setProvider] = useState<ChatProvider>(null);
  const [checked, setChecked] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(false);
  const [ttsSupported, setTtsSupported] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { supported: micSupported, listening, toggle: toggleMic } = useSpeechInput(VOICE_LANG, (text) =>
    setInput((prev) => (prev ? `${prev} ${text}` : text))
  );

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time browser capability check, unavailable during SSR
    setTtsSupported(speechSupported());
    return () => stopSpeaking();
  }, []);

  useEffect(() => {
    if (STATIC_DEMO) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- static export has no API routes, so the status is known at build time
      setChecked(true);
      return;
    }
    fetch("/api/chat/status")
      .then((r) => r.json())
      .then((d) => {
        setProvider(d.claude ? "claude" : d.chatgpt ? "chatgpt" : null);
        setChecked(true);
      })
      .catch(() => setChecked(true));
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  async function send() {
    const text = input.trim();
    if (!text || sending) return;
    setInput("");
    const nextMessages: ChatMessage[] = [...messages, { role: "user", content: text }];
    setMessages([...nextMessages, { role: "assistant", content: "" }]);
    setSending(true);

    if (STATIC_DEMO) {
      const note = "Demo estatica — el chat con Claude necesita la app completa con servidor.";
      setMessages((prev) => {
        const copy = [...prev];
        copy[copy.length - 1] = { role: "assistant", content: note };
        return copy;
      });
      if (autoSpeak) speak(note, VOICE_LANG);
      setSending(false);
      return;
    }

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ artistId: artist.id, messages: nextMessages }),
      });
      if (!res.body) throw new Error("Sin respuesta del servidor");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        setMessages((prev) => {
          const copy = [...prev];
          copy[copy.length - 1] = { role: "assistant", content: acc };
          return copy;
        });
      }
      if (autoSpeak && acc.trim()) speak(acc, VOICE_LANG);
    } catch (err) {
      const reason = err instanceof Error ? err.message : String(err);
      setMessages((prev) => {
        const copy = [...prev];
        copy[copy.length - 1] = { role: "assistant", content: `No se pudo responder (${reason}).` };
        return copy;
      });
    } finally {
      setSending(false);
    }
  }

  return (
    <div
      className="flex h-[600px] flex-col overflow-hidden rounded-2xl"
      style={{ backgroundColor: "var(--surface-1)", border: "1px solid var(--border-hairline)" }}
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b px-5 py-3.5" style={{ borderColor: "var(--border-hairline)" }}>
        <div className="flex items-center gap-3">
          <span
            className="flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold"
            style={{ backgroundColor: artist.accent, color: "#0b0b0b" }}
          >
            {artist.initials}
          </span>
          <div>
            <div className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
              Chat con {artist.name}
            </div>
            <div className="text-xs" style={{ color: "var(--text-muted)" }}>
              {provider === "chatgpt" ? "Impulsado por ChatGPT" : "Impulsado por Claude Opus 4.8"}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {ttsSupported && (
            <button
              onClick={() => {
                const next = !autoSpeak;
                setAutoSpeak(next);
                if (!next) stopSpeaking();
              }}
              title={autoSpeak ? "Dejar de leer respuestas en voz alta" : "Leer respuestas en voz alta"}
              className="flex h-8 w-8 items-center justify-center rounded-full text-sm"
              style={{
                color: autoSpeak ? "var(--seq-500)" : "var(--text-muted)",
                border: `1px solid ${autoSpeak ? "var(--seq-500)" : "var(--border-hairline)"}`,
              }}
            >
              {autoSpeak ? "🔊" : "🔈"}
            </button>
          )}
          <span
            className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium"
            style={{
              color: provider ? "var(--status-good)" : "var(--text-muted)",
              border: `1px solid ${provider ? "var(--status-good)" : "var(--border-hairline)"}`,
            }}
          >
            <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: provider ? "var(--status-good)" : "var(--text-muted)" }} />
            {!checked ? "Verificando..." : provider ? "Conectado" : "Modo demostracion"}
          </span>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-4">
        {messages.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-center" style={{ color: "var(--text-muted)" }}>
            <p className="text-sm">Escribele a {artist.name} como si fueras un fan o el equipo del sello.</p>
            {checked && !provider && (
              <p className="max-w-xs text-xs">
                {STATIC_DEMO
                  ? "Demo estatica (GitHub Pages) — el chat en vivo necesita la app completa con servidor."
                  : "Sin ANTHROPIC_API_KEY ni OPENAI_API_KEY configuradas todavia — las respuestas son de ejemplo."}
              </p>
            )}
          </div>
        )}
        <div className="flex flex-col gap-3">
          {messages.map((m, i) => (
            <div key={i} className={`flex items-end gap-1.5 ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className="max-w-[75%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm"
                style={
                  m.role === "user"
                    ? { backgroundColor: "var(--seq-500)", color: "#fff" }
                    : { backgroundColor: "var(--surface-2)", color: "var(--text-primary)" }
                }
              >
                {m.content || (sending && i === messages.length - 1 ? "…" : "")}
              </div>
              {ttsSupported && m.role === "assistant" && m.content && (
                <button
                  onClick={() => speak(m.content, VOICE_LANG)}
                  title="Escuchar"
                  className="shrink-0 text-sm opacity-70 hover:opacity-100"
                  style={{ color: "var(--text-muted)" }}
                >
                  🔊
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2 border-t p-3" style={{ borderColor: "var(--border-hairline)" }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          placeholder={`Escribele a ${artist.name}...`}
          className="flex-1 rounded-xl px-3.5 py-2.5 text-sm outline-none"
          style={{ backgroundColor: "var(--surface-2)", border: "1px solid var(--border-hairline)", color: "var(--text-primary)" }}
        />
        {micSupported && (
          <button
            onClick={toggleMic}
            title={listening ? "Detener dictado" : "Hablar en vez de escribir"}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm"
            style={
              listening
                ? { backgroundColor: "var(--status-critical)", color: "#fff" }
                : { backgroundColor: "var(--surface-2)", border: "1px solid var(--border-hairline)", color: "var(--text-secondary)" }
            }
          >
            {listening ? "⏺" : "🎤"}
          </button>
        )}
        <button
          onClick={send}
          disabled={sending || !input.trim()}
          className="rounded-xl px-4 py-2.5 text-sm font-semibold disabled:opacity-50"
          style={{ backgroundColor: "var(--text-primary)", color: "var(--page-plane)" }}
        >
          Enviar
        </button>
      </div>
    </div>
  );
}
