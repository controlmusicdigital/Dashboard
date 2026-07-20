const OPENERS = ["Wepa familia", "Klk mi gente", "Atencion", "Buenas noticias"];

export function mockBroadcastMessage(topic: string): { message: string; note: string } {
  const opener = OPENERS[topic.length % OPENERS.length];
  return {
    message: `${opener} 🔥 ${topic}. Control Music Digital sigue representando la musica dominicana con to'.`,
    note: "Generado con datos de ejemplo porque no hay una API key configurada para este proveedor.",
  };
}
