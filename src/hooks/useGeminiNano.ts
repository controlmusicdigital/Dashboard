"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type GeminiNanoAvailability = "checking" | "unavailable" | "downloadable" | "ready";
export type GeminiNanoState = "idle" | "thinking" | "responding";

interface PromptSession {
  prompt?: (input: string) => Promise<string>;
  promptStreaming?: (input: string) => AsyncIterable<string> | ReadableStream<string>;
  destroy?: () => void;
}

type CreateOptions = { systemPrompt?: string };

interface LanguageModelSource {
  availability: () => Promise<string>;
  create: (opts?: CreateOptions) => Promise<PromptSession>;
}

// Chrome's on-device Prompt API is still an experimental, flag-gated feature (chrome://flags
// "Prompt API for Gemini Nano", Chrome Canary/Dev) and its JS shape has moved as it went
// through origin trials: window.ai.createTextSession() -> window.ai.languageModel.create() ->
// the current top-level `LanguageModel` global. We probe both shapes we know of, newest first,
// so this keeps working across the Chrome versions that actually expose *something*. If Google
// ships another shape later, this needs a matching branch added here.
function getLanguageModelSource(): LanguageModelSource | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as Record<string, unknown>;

  const topLevel = w.LanguageModel as
    | { availability?: () => Promise<string>; create?: (opts?: CreateOptions) => Promise<PromptSession> }
    | undefined;
  if (typeof topLevel?.availability === "function" && typeof topLevel?.create === "function") {
    return { availability: topLevel.availability, create: topLevel.create };
  }

  const ai = w.ai as Record<string, unknown> | undefined;
  const legacy = ai?.languageModel as
    | { capabilities?: () => Promise<{ available: string }>; create?: (opts?: CreateOptions) => Promise<PromptSession> }
    | undefined;
  if (typeof legacy?.capabilities === "function" && typeof legacy?.create === "function") {
    return {
      availability: async () => (await legacy.capabilities!()).available,
      create: legacy.create,
    };
  }

  return null;
}

function isReadyAvailability(value: string): boolean {
  return value === "available" || value === "readily";
}
function isDownloadableAvailability(value: string): boolean {
  return value === "downloadable" || value === "after-download" || value === "downloading";
}

interface UseGeminiNanoResult {
  availability: GeminiNanoAvailability;
  supported: boolean;
  state: GeminiNanoState;
  ask: (prompt: string, onToken?: (chunk: string) => void) => Promise<string>;
}

export function useGeminiNano(systemPrompt?: string): UseGeminiNanoResult {
  const [availability, setAvailability] = useState<GeminiNanoAvailability>("checking");
  const [state, setState] = useState<GeminiNanoState>("idle");
  const sessionRef = useRef<PromptSession | null>(null);
  const sourceRef = useRef<LanguageModelSource | null>(null);

  useEffect(() => {
    let cancelled = false;
    const source = getLanguageModelSource();
    sourceRef.current = source;
    if (!source) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time browser capability check, unavailable during SSR
      setAvailability("unavailable");
      return;
    }
    source
      .availability()
      .then((value) => {
        if (cancelled) return;
        if (isReadyAvailability(value)) setAvailability("ready");
        else if (isDownloadableAvailability(value)) setAvailability("downloadable");
        else setAvailability("unavailable");
      })
      .catch(() => !cancelled && setAvailability("unavailable"));

    return () => {
      cancelled = true;
      sessionRef.current?.destroy?.();
      sessionRef.current = null;
    };
  }, []);

  const ask = useCallback(
    async (prompt: string, onToken?: (chunk: string) => void): Promise<string> => {
      const source = sourceRef.current;
      if (!source) throw new Error("Gemini Nano no esta disponible en este navegador");

      setState("thinking");
      try {
        if (!sessionRef.current) {
          sessionRef.current = await source.create(systemPrompt ? { systemPrompt } : undefined);
        }
        const session = sessionRef.current;

        if (session.promptStreaming) {
          setState("responding");
          const stream = session.promptStreaming(prompt);
          let full = "";
          const iterable: AsyncIterable<string> =
            Symbol.asyncIterator in Object(stream)
              ? (stream as AsyncIterable<string>)
              : streamToAsyncIterable(stream as ReadableStream<string>);
          for await (const chunk of iterable) {
            full += chunk;
            onToken?.(chunk);
          }
          return full;
        }

        if (session.prompt) {
          setState("responding");
          const result = await session.prompt(prompt);
          onToken?.(result);
          return result;
        }

        throw new Error("La sesion de Gemini Nano no expone prompt() ni promptStreaming()");
      } finally {
        setState("idle");
      }
    },
    [systemPrompt]
  );

  return { availability, supported: availability === "ready" || availability === "downloadable", state, ask };
}

async function* streamToAsyncIterable(stream: ReadableStream<string>): AsyncGenerator<string> {
  const reader = stream.getReader();
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) return;
      if (value) yield value;
    }
  } finally {
    reader.releaseLock();
  }
}
