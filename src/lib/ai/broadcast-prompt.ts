export function buildBroadcastPrompt(topic: string): string {
  return `Eres el equipo de redes de "Control Music Digital", un sello discografico dominicano con artistas de
musica urbana, bachata urbana y dembow (Pacheman, Max, El Real Soprano).

Vas a redactar un mensaje corto de difusion para mandar por Telegram y WhatsApp a un canal/grupo de fans y
equipo. Tema: "${topic}"

Responde UNICAMENTE con un objeto JSON valido (sin markdown, sin backticks) con esta forma exacta:
{
  "message": "mensaje corto (2-4 frases), en espanol dominicano, tono cercano y con energia, con como maximo 2 emojis"
}`;
}

export interface ParsedBroadcast {
  message: string;
}

export function parseBroadcastJSON(raw: string): ParsedBroadcast {
  const cleaned = raw
    .trim()
    .replace(/^```(json)?/i, "")
    .replace(/```$/, "")
    .trim();
  const parsed = JSON.parse(cleaned);
  if (typeof parsed.message !== "string" || !parsed.message.trim()) {
    throw new Error("Forma de JSON inesperada");
  }
  return { message: parsed.message };
}
