import { Artist } from "../types";

const OPENERS = ["Ey, ¿que lo que!", "Klk fam", "¡Wepa!", "Dime a ver"];
const CLOSERS = [
  "eso todavia lo estamos cocinando, pero pronto lo sueltan.",
  "sigan pendientes a las redes que viene cosa buena.",
  "gracias por el apoyo, eso vale mas que to.",
  "estamos dandole con to' desde Santo Domingo.",
];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function mockReply(artist: Artist, userMessage: string): string {
  const topic = userMessage.trim().slice(0, 140);
  return `${pick(OPENERS)} Soy ${artist.name}. Sobre "${topic}" te digo: ${pick(CLOSERS)}`;
}
