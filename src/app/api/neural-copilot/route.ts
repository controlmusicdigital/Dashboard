import { NextRequest } from "next/server";

export const runtime = "nodejs";

const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-flash-lite-latest";

function buildSystemInstruction(context: string): string {
  return `Eres "CMD-Neural AI", el copiloto de inteligencia de datos del centro de comando de Control Music Digital,
un sello discografico urbano dominicano con sede en Santo Domingo. Lees telemetria en tiempo real del sello
(streams, seguidores, gasto en Google Ads, ingresos de DistroKid) y respondes con insights concretos y accionables,
al estilo de un HUD de nave: directo, tecnico, sin relleno.

Telemetria actual del sello:
${context}

Responde en espanol dominicano, en 2-4 frases, con numeros cuando aporten valor. Estos son datos de demostracion
(no en vivo todavia), asi que cualquier proyeccion debe marcarse claramente como "estimado" o "proyectado" — nunca
la presentes como un hecho verificado.`;
}

function mockInsight(prompt: string): string {
  return `Telemetria del sello indica que el ROI mas alto viene de streaming organico — cualquier gasto adicional en Ads
rinde mejor si se dirige a los picks que ya muestran velocidad de crecimiento. Sobre "${prompt.trim().slice(0, 90)}":
ese analisis se afina en cuanto conectemos las cuentas reales. (Nota: sin GEMINI_API_KEY configurada, esta es una
respuesta de ejemplo.)`;
}

function mockStream(text: string, delayMs: number): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  const words = text.split(" ").map((w, i) => (i === 0 ? w : ` ${w}`));
  return new ReadableStream({
    async start(controller) {
      for (const chunk of words) {
        controller.enqueue(encoder.encode(chunk));
        await new Promise((r) => setTimeout(r, delayMs));
      }
      controller.close();
    },
  });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const prompt = body?.prompt as string | undefined;
  const context = body?.context as string | undefined;

  if (!prompt || !prompt.trim()) {
    return new Response("Solicitud invalida", { status: 400 });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return new Response(mockStream(mockInsight(prompt), 35), {
      headers: { "Content-Type": "text/plain; charset=utf-8", "X-Copilot-Source": "mock" },
    });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:streamGenerateContent?alt=sse`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
            body: JSON.stringify({
              systemInstruction: { parts: [{ text: buildSystemInstruction(context ?? "Sin telemetria disponible.") }] },
              contents: [{ role: "user", parts: [{ text: prompt }] }],
              generationConfig: { temperature: 0.8, maxOutputTokens: 400 },
            }),
          }
        );

        if (!res.ok || !res.body) {
          const errBody = await res.text().catch(() => "");
          throw new Error(`Gemini respondio ${res.status}: ${errBody.slice(0, 200)}`);
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";
          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const jsonStr = line.slice(6).trim();
            if (!jsonStr) continue;
            try {
              const parsed = JSON.parse(jsonStr);
              const text = parsed?.candidates?.[0]?.content?.parts?.[0]?.text;
              if (typeof text === "string") controller.enqueue(encoder.encode(text));
            } catch {
              // partial/non-JSON SSE line, skip
            }
          }
        }
        controller.close();
      } catch (err) {
        const reason = err instanceof Error ? err.message : String(err);
        controller.enqueue(encoder.encode(`${mockInsight(prompt)}\n\n[Nota: no se pudo contactar a Gemini: ${reason}]`));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "text/plain; charset=utf-8", "X-Copilot-Source": "gemini" },
  });
}
