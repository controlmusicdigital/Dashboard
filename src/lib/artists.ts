import { Artist } from "./types";

export const artists: Artist[] = [
  {
    id: "pacheman",
    name: "Pacheman",
    realName: "Pacheman",
    genre: "Musica Urbana",
    location: "Santo Domingo, RD",
    bio: "Referente de la musica urbana dominicana con proyección internacional.",
    initials: "PM",
    accent: "var(--series-1)",
    youtubeHandle: "pachemanrd",
  },
  {
    id: "max-aventura",
    name: "Max",
    realName: "Max (ex-Aventura)",
    genre: "Bachata Urbana",
    location: "Santo Domingo, RD",
    bio: "Ex-integrante de Aventura, hoy en carrera solista dentro de la bachata urbana.",
    initials: "MX",
    accent: "var(--series-2)",
    youtubeHandle: "maxsantosofi",
  },
  {
    id: "el-real-soprano",
    name: "El Real Soprano",
    realName: "El Real Soprano",
    genre: "Dembow",
    location: "Santo Domingo, RD",
    bio: "Voz emergente del dembow con fuerte tracción en redes.",
    initials: "RS",
    accent: "var(--series-3)",
    youtubeHandle: "Elrealsoprano",
  },
];

export function getArtist(id: string): Artist | undefined {
  return artists.find((a) => a.id === id);
}
