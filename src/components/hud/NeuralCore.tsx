"use client";

import { useEffect, useRef, useState } from "react";
import { X, Send } from "lucide-react";
import { useGeminiNano } from "@/hooks/useGeminiNano";
import { useNeuralState } from "@/lib/neural-state";
import { STATIC_DEMO, STATIC_DEMO_NOTE } from "@/lib/static-demo";

const QUICK_PROMPTS = [
  "Proyectar pagos de regalias del Q3",
  "Analizar ROI: Spotify vs YouTube",
  "Identificar tracks con velocidad viral en RD",
  "Optimizar distribucion de gasto en Ads",
];

interface ChatTurn {
  role: "user" | "assistant";
  content: string;
}

const STATE_LABEL: Record<string, string> = { idle: "En linea", thinking: "Analizando…", generating: "Generando…" };
const STATE_ANIM: Record<string, string> = {
  idle: "core-pulse-idle 2.6s ease-in-out infinite",
  thinking: "core-pulse-thinking 1.1s ease-in-out infinite",
  generating: "core-pulse-generating 0.7s ease-in-out infinite",
};
const STATE_COLOR: Record<string, string> = {
  idle: "var(--accent-cyan)",
  thinking: "var(--accent-magenta)",
  generating: "var(--accent-amber)",
};

export function NeuralCore({ metricsContext }: { metricsContext: string }) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [turns, setTurns] = useState<ChatTurn[]>([]);
  const [busy, setBusy] = useState(false);
  const [source, setSource] = useState<"nano" | "gemini" | "mock" | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { state, setState, pendingPrompt, clearPendingPrompt } = useNeuralState();

  const nano = useGeminiNano(
    `Eres CMD-Neural AI, el copiloto de datos de Control Music Digital. Telemetria actual: ${metricsContext}. Responde en espanol dominicano, 2-4 frases, directo, estilo HUD tecnico.`
  );

  useEffect(() => {
    setState(nano.state === "idle" ? "idle" : nano.state === "thinking" ? "thinking" : "generating");
  }, [nano.state, setState]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [turns]);

  useEffect(() => {
    if (!pendingPrompt) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- opening the drawer is the direct effect of a cross-component quick-audit request
    setOpen(true);
    void send(pendingPrompt);
    clearPendingPrompt();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingPrompt]);

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
        setState("generating");
        appendToken(STATIC_DEMO_NOTE);
        setState("idle");
      } else {
        setState("thinking");
        const res = await fetch("/api/neural-copilot", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: text, context: metricsContext }),
        });
        setSource(res.headers.get("X-Copilot-Source") === "gemini" ? "gemini" : "mock");
        if (!res.body) throw new Error("Sin respuesta del servidor");
        setState("generating");
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          appendToken(decoder.decode(value, { stream: true }));
        }
        setState("idle");
      }
    } catch (err) {
      const reason = err instanceof Error ? err.message : String(err);
      appendToken(`No se pudo responder (${reason}).`);
      setState("idle");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center justify-center rounded-full transition-transform hover:scale-105"
        style={{
          position: "fixed",
          bottom: "1.5rem",
          right: "1.5rem",
          left: "auto",
          zIndex: 30,
          height: 56,
          width: 56,
          background: `radial-gradient(circle at 35% 30%, ${STATE_COLOR[state]}, #05070e 75%)`,
          border: `1px solid ${STATE_COLOR[state]}`,
          animation: STATE_ANIM[state],
        }}
        aria-label="Abrir CMD-Neural AI"
      >
        <span className="font-hud-mono text-[11px] font-bold tracking-wider text-white">AI</span>
      </button>

      {open && (
        <div
          className="flex flex-col overflow-hidden rounded-2xl border"
          style={{
            position: "fixed",
            bottom: "6rem",
            right: "1.5rem",
            left: "auto",
            zIndex: 30,
            height: 520,
            width: "min(92vw, 384px)",
            maxHeight: "calc(100vh - 8rem)",
            backgroundColor: "rgba(6, 10, 22, 0.97)",
            borderColor: "var(--border-hairline)",
            color: "var(--text-primary)",
          }}
        >
          <div className="scanline-sweep" />
          <div className="relative flex items-center justify-between gap-2 border-b px-4 py-3.5" style={{ borderColor: "var(--border-hairline)" }}>
            <div className="flex items-center gap-2">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: STATE_COLOR[state], animation: STATE_ANIM[state] }}
              />
              <div>
                <div className="text-sm font-semibold">CMD-Neural AI</div>
                <div className="font-hud-mono text-[12px]" style={{ color: STATE_COLOR[state] }}>
                  {STATE_LABEL[state]} {nano.supported ? "· on-device" : "· cloud"}
                </div>
              </div>
            </div>
            <button onClick={() => setOpen(false)} style={{ color: "var(--text-muted)" }} aria-label="Cerrar">
              <X size={18} />
            </button>
          </div>

          <div ref={scrollRef} className="relative flex-1 overflow-y-auto px-4 py-3">
            {turns.length === 0 && (
              <div className="flex flex-col gap-2 py-4">
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                  {nano.availability === "unavailable"
                    ? "Gemini Nano on-device requiere Chrome Canary/Dev con el flag activado. Conectando al nucleo en la nube."
                    : "Consulta el nucleo neural sobre el rendimiento del sello, o elige un atajo:"}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {QUICK_PROMPTS.map((q) => (
                    <button
                      key={q}
                      onClick={() => send(q)}
                      className="rounded-full border px-3 py-1.5 text-left text-[13px]"
                      style={{ borderColor: "var(--border-hairline)", backgroundColor: "rgba(21, 30, 53, 0.92)", color: "var(--text-secondary)" }}
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
                    className="max-w-[85%] whitespace-pre-wrap rounded-2xl px-3.5 py-2 text-[15px] leading-relaxed"
                    style={
                      t.role === "user"
                        ? { background: "linear-gradient(135deg, var(--accent-cyan), var(--accent-blue-dr))", color: "#04121a" }
                        : { backgroundColor: "rgba(21, 30, 53, 0.92)", color: "var(--text-primary)" }
                    }
                  >
                    {t.content || (busy && i === turns.length - 1 ? "…" : "")}
                  </div>
                </div>
              ))}
            </div>
            {source && turns.length > 0 && (
              <p className="font-hud-mono mt-2 text-[12px] uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
                {source === "nano" ? "Gemini Nano · on-device" : source === "gemini" ? "Google Gemini · cloud" : "Datos de ejemplo"}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 border-t p-3" style={{ borderColor: "var(--border-hairline)" }}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") send(input);
              }}
              placeholder="Consulta al nucleo neural..."
              className="flex-1 rounded-xl border px-3 py-2 text-[15px] outline-none"
              style={{ borderColor: "var(--border-hairline)", backgroundColor: "rgba(21, 30, 53, 0.92)", color: "var(--text-primary)" }}
            />
            <button
              onClick={() => send(input)}
              disabled={busy || !input.trim()}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl disabled:opacity-40"
              style={{ background: "linear-gradient(135deg, var(--accent-cyan), var(--accent-magenta))", color: "#04121a" }}
              aria-label="Enviar"
            >
              <Send size={15} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
