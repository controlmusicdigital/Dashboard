import { Artist } from "./types";
import { label } from "./label";

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
  },
];

export function getArtist(id: string): Artist | undefined {
  // ArtistView/ArtistStudio/ArtistCampaigns are reused for "El sello" too, so
  // requests from that view carry the label's id, not one of the three real artists.
  if (id === label.id) return label;
  return artists.find((a) => a.id === id);
}
