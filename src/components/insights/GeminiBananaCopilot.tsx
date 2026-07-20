"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Send, X, Cpu, Cloud } from "lucide-react";
import { useGeminiNano, GeminiNanoState } from "@/hooks/useGeminiNano";
import { STATIC_DEMO, STATIC_DEMO_NOTE } from "@/lib/static-demo";

const QUICK_PROMPTS = [
  "Resumen del ROI en los ultimos 30 dias",
  "Predecir el crecimiento de streams del proximo mes",
  "Como optimizar el gasto en Google Ads",
  "Exportar insights del mercado dominicano",
];

interface ChatTurn {
  role: "user" | "assistant";
  content: string;
}

export function GeminiBananaCopilot({
  metricsContext,
  onStateChange,
  externalPrompt,
}: {
  metricsContext: string;
  onStateChange?: (state: GeminiNanoState) => void;
  externalPrompt?: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [turns, setTurns] = useState<ChatTurn[]>([]);
  const [busy, setBusy] = useState(false);
  const [source, setSource] = useState<"nano" | "claude" | "mock" | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const nano = useGeminiNano(
    `Eres el copiloto de datos de Control Music Digital. Metricas actuales: ${metricsContext}. Responde en espanol dominicano, 2-4 frases, directo.`
  );

  useEffect(() => {
    onStateChange?.(nano.state);
  }, [nano.state, onStateChange]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [turns]);

  useEffect(() => {
    if (externalPrompt) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- opening the drawer is the direct effect of a parent-triggered quick-audit prompt
      setOpen(true);
      void send(externalPrompt);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [externalPrompt]);

  async function send(prompt: string) {
    const text = prompt.trim();
    if (!text || busy) return;
    setInput("");
    setTurns((prev) => [...prev, { role: "user", content: text }, { role: "assistant", content: "" }]);
    setBusy(true);

    const appendToken = (chunk: string) => {
      setTurns((prev) => {
        const copy = [...prev];
        copy[copy.length - 1] = { role: "assistant", content: copy[copy.length - 1].content + chunk };
        return copy;
      });
    };

    try {
      if (nano.supported) {
        setSource("nano");
        await nano.ask(text, appendToken);
      } else if (STATIC_DEMO) {
        setSource("mock");
        appendToken(STATIC_DEMO_NOTE);
      } else {
        const res = await fetch("/api/insights-copilot", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: text, context: metricsContext }),
        });
        setSource(res.headers.get("X-Copilot-Source") === "claude-opus-4-8" ? "claude" : "mock");
        if (!res.body) throw new Error("Sin respuesta del servidor");
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          appendToken(decoder.decode(value, { stream: true }));
        }
      }
    } catch (err) {
      const reason = err instanceof Error ? err.message : String(err);
      appendToken(`No se pudo responder (${reason}).`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <motion.button
        onClick={() => setOpen((v) => !v)}
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.94 }}
        className="fixed bottom-6 right-6 z-30 flex h-14 w-14 items-center justify-center rounded-full text-white shadow-[0_0_30px_rgba(34,211,238,0.45)]"
        style={{
          background: "linear-gradient(135deg, #22d3ee, #e879f9)",
        }}
        aria-label="Abrir copiloto Gemini Nano"
      >
        <Sparkles size={22} />
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
            className="fixed bottom-24 right-6 z-30 flex h-[520px] w-[92vw] max-w-sm flex-col overflow-hidden rounded-3xl border border-white/10 text-white shadow-2xl backdrop-blur-2xl"
            style={{ background: "rgba(13, 15, 23, 0.82)" }}
          >
            <div className="flex items-center justify-between gap-2 border-b border-white/10 px-4 py-3.5">
              <div className="flex items-center gap-2">
                <span
                  className="flex h-8 w-8 items-center justify-center rounded-full"
                  style={{ background: "linear-gradient(135deg, #22d3ee, #e879f9)" }}
                >
                  <Sparkles size={15} className="text-white" />
                </span>
                <div>
                  <div className="text-sm font-semibold">Gemini Nano Banana</div>
                  <div className="flex items-center gap-1 text-[11px] text-white/50">
                    {nano.availability === "checking" ? (
                      "Detectando IA local..."
                    ) : nano.supported ? (
                      <>
                        <Cpu size={11} /> En el dispositivo (sin servidor)
                      </>
                    ) : (
                      <>
                        <Cloud size={11} /> No detectado &mdash; usando Claude
                      </>
                    )}
                  </div>
                </div>
              </div>
              <button onClick={() => setOpen(false)} className="text-white/50 hover:text-white" aria-label="Cerrar">
                <X size={18} />
              </button>
            </div>

            <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3">
              {turns.length === 0 && (
                <div className="flex flex-col gap-2 py-4">
                  <p className="text-xs text-white/60">
                    {nano.availability === "unavailable"
                      ? "Gemini Nano requiere Chrome Canary/Dev con el flag \"Prompt API for Gemini Nano\" activado. Mientras tanto, respondo desde el servidor."
                      : "Preguntame sobre el rendimiento del sello, o elige un atajo:"}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {QUICK_PROMPTS.map((q) => (
                      <button
                        key={q}
                        onClick={() => send(q)}
                        className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-left text-[11px] text-white/80 transition-colors hover:bg-white/10"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex flex-col gap-2.5">
                {turns.map((t, i) => (
                  <div key={i} className={`flex ${t.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div
                      className="max-w-[85%] whitespace-pre-wrap rounded-2xl px-3.5 py-2 text-[13px] leading-relaxed"
                      style={
                        t.role === "user"
                          ? { background: "linear-gradient(135deg, #22d3ee, #0891b2)", color: "#04121a" }
                          : { background: "rgba(255,255,255,0.06)", color: "#f1f5f9" }
                      }
                    >
                      {t.content || (busy && i === turns.length - 1 ? "…" : "")}
                    </div>
                  </div>
                ))}
              </div>
              {source && turns.length > 0 && (
                <p className="mt-2 text-[10px] uppercase tracking-wide text-white/30">
                  {source === "nano" ? "Gemini Nano · on-device" : source === "claude" ? "Claude Opus 4.8 · servidor" : "Datos de ejemplo"}
                </p>
              )}
            </div>

            <div className="flex items-center gap-2 border-t border-white/10 p-3">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") send(input);
                }}
                placeholder="Preguntale al copiloto..."
                className="flex-1 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-[13px] text-white placeholder:text-white/30 outline-none focus:border-cyan-400/50"
              />
              <button
                onClick={() => send(input)}
                disabled={busy || !input.trim()}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white disabled:opacity-40"
                style={{ background: "linear-gradient(135deg, #22d3ee, #e879f9)" }}
                aria-label="Enviar"
              >
                <Send size={15} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
