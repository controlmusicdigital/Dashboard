import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

export const runtime = "nodejs";

function buildSystemPrompt(context: string): string {
  return `Eres el copiloto de datos de "Control Music Digital", un sello discografico urbano dominicano con sede en
Santo Domingo. Tu trabajo es leer las metricas agregadas del sello (streams, seguidores, gasto en Google Ads,
ingresos de DistroKid) y responder preguntas de negocio con insights concretos y accionables.

Metricas actuales del sello:
${context}

Responde en espanol dominicano, en 2-4 frases, directo y con numeros cuando aporten valor. Estos son datos de
demostracion (no en vivo todavia), asi que si haces una proyeccion o estimado, dejalo claro con una palabra como
"estimado" o "proyectado" — nunca lo presentes como un hecho verificado.`;
}

function mockInsight(prompt: string): string {
  return `Con los datos actuales del sello, la senal mas fuerte esta en streaming — cualquier inversion adicional en Google Ads
tiende a rendir mejor cuando se dirige a los picks que ya estan creciendo organicamente. Sobre "${prompt.trim().slice(0, 90)}":
ese es un analisis que se puede afinar mas en cuanto conectemos las cuentas reales. (Nota: sin ANTHROPIC_API_KEY
configurada, esta es una respuesta de ejemplo.)`;
}

function textStream(text: string, delayMs: number): ReadableStream<Uint8Array> {
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

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return new Response(textStream(mockInsight(prompt), 35), {
      headers: { "Content-Type": "text/plain; charset=utf-8", "X-Copilot-Source": "mock" },
    });
  }

  const client = new Anthropic({ apiKey });
  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        const claudeStream = client.messages.stream({
          model: "claude-opus-4-8",
          max_tokens: 512,
          system: buildSystemPrompt(context ?? "No hay contexto de metricas disponible."),
          messages: [{ role: "user", content: prompt }],
        });
        claudeStream.on("text", (delta) => controller.enqueue(encoder.encode(delta)));
        await claudeStream.finalMessage();
        controller.close();
      } catch (err) {
        const reason = err instanceof Error ? err.message : String(err);
        controller.enqueue(encoder.encode(`${mockInsight(prompt)}\n\n[Nota: no se pudo contactar a Claude: ${reason}]`));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "text/plain; charset=utf-8", "X-Copilot-Source": "claude-opus-4-8" },
  });
}
