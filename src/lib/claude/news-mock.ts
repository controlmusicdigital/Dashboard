import { NewsItem } from "../news-types";

// Example headlines only — deliberately built around our own roster and generic
// industry trends, never attributed to real third-party public figures, since
// this is placeholder content shown when no live search is configured.
const MOCK_ITEMS: NewsItem[] = [
  {
    title: "El dembow dominicano sigue rompiendo records de streaming",
    summary: "Plataformas digitales reportan crecimiento sostenido del genero urbano dominicano en la region y la diaspora.",
    source: "Ejemplo",
    url: "",
    publishedAt: "Vista previa",
  },
  {
    title: "Pacheman adelanta detalles de su proxima gira",
    summary: "El artista confirma nuevas fechas y promete sorpresas en la produccion visual de sus shows.",
    source: "Ejemplo",
    url: "",
    publishedAt: "Vista previa",
  },
  {
    title: "Sellos independientes dominicanos ganan terreno",
    summary: "Cada vez mas proyectos independientes compiten de tu a tu con las grandes disqueras en listas de streaming.",
    source: "Ejemplo",
    url: "",
    publishedAt: "Vista previa",
  },
  {
    title: "Max explora fusiones entre bachata urbana y sonidos globales",
    summary: "El artista habla de sus proximas colaboraciones y la evolucion del genero hacia nuevas audiencias.",
    source: "Ejemplo",
    url: "",
    publishedAt: "Vista previa",
  },
  {
    title: "El Real Soprano se consolida como voz emergente del ano",
    summary: "Su crecimiento en redes sociales y streams lo posiciona entre los nombres a seguir del dembow.",
    source: "Ejemplo",
    url: "",
    publishedAt: "Vista previa",
  },
  {
    title: "La industria musical de RD mira hacia mercados internacionales",
    summary: "Managers y sellos dominicanos reportan mas interes de audiencias fuera del pais de habla no hispana.",
    source: "Ejemplo",
    url: "",
    publishedAt: "Vista previa",
  },
];

export function mockNews(): NewsItem[] {
  return MOCK_ITEMS;
}
