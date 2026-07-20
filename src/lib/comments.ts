import { mulberry32, randInt } from "./rng";
import { PlatformId } from "./types";
import { artists } from "./artists";
import { label } from "./label";

export const COMMENT_PLATFORMS: PlatformId[] = ["instagram", "tiktok", "facebook", "x", "youtube"];

export interface Comment {
  id: string;
  entityId: string;
  entityName: string;
  platform: PlatformId;
  author: string;
  text: string;
  publishedAt: string;
  replied: boolean;
}

const AUTHORS = [
  "yailin_rd", "carlos.dominicano", "musicaurbana809", "la_reina_rd", "elpanaboricua",
  "santo.domingo.fan", "bachatera_forever", "urbano.rd.official", "mai_fanpage", "rdlover23",
  "dembow.diario", "punto_g_music", "caribefire", "pistaviral", "no_context_rd",
  "quisqueya_music", "fan_del_barrio", "trapresidente", "cibaeña_pura", "malecon_beats",
];

const TEMPLATES = [
  "Este tema esta durisimo 🔥🔥",
  "Cuando sale el video oficial??",
  "Escuchando esto desde RD 🇩🇴",
  "El mejor del genero, sin discusion",
  "Necesito el nombre de esta cancion en mi boda",
  "Esto va pa mi playlist ya mismo",
  "Alguien mas lo tiene en loop?",
  "Vengan a tocar a mi pais porfavor 🙏",
  "La produccion esta increible",
  "Esto suena a hit del verano",
  "Primera vez que escucho y ya soy fan",
  "El flow no tiene competencia",
  "Subete a hacer un live pronto",
  "Esto es lo que necesitaba hoy",
  "Colabora con mas artistas del sello porfa",
];

function dateHoursAgo(hours: number): string {
  const d = new Date("2026-07-20T09:00:00Z");
  d.setUTCHours(d.getUTCHours() - hours);
  return d.toISOString();
}

function generateForEntity(entityId: string, entityName: string): Comment[] {
  const comments: Comment[] = [];
  for (const platform of COMMENT_PLATFORMS) {
    const rng = mulberry32(`${entityId}:${platform}:comments:v1`);
    const count = randInt(rng, 3, 6);
    for (let i = 0; i < count; i++) {
      comments.push({
        id: `${entityId}-${platform}-${i}`,
        entityId,
        entityName,
        platform,
        author: AUTHORS[randInt(rng, 0, AUTHORS.length - 1)],
        text: TEMPLATES[randInt(rng, 0, TEMPLATES.length - 1)],
        publishedAt: dateHoursAgo(randInt(rng, 1, 240)),
        replied: rng() < 0.35,
      });
    }
  }
  return comments;
}

export function getAllComments(): Comment[] {
  const all: Comment[] = [];
  for (const a of artists) all.push(...generateForEntity(a.id, a.name));
  all.push(...generateForEntity(label.id, label.name));
  return all.sort((a, b) => (a.publishedAt < b.publishedAt ? 1 : -1));
}
