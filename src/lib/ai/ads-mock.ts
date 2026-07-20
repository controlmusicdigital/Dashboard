import { AdContent, CampaignObjective, OBJECTIVE_LABEL } from "../campaign-types";
import { AdBrief } from "./ads-prompt";

export function mockAdContent(brief: AdBrief): AdContent {
  const { artist, objective, topic } = brief;
  const headline = `${artist.name}: ${topic}`.slice(0, 40);
  const description = `Descubre lo nuevo de ${artist.name}. ${OBJECTIVE_LABEL[objective as CampaignObjective]} para fans de ${artist.genre} en ${artist.location}.`;
  const cta = objective === "streams" ? "Escuchar ahora" : objective === "conversiones" ? "Comprar entradas" : "Ver mas";

  return {
    headline,
    description,
    cta,
    variants: {
      googleAds: `${headline} — ${cta}. ${description}`,
      instagram: `${description} 🔥 ${cta} 👉`,
      tiktok: `${topic} 👀 ${cta}`,
      facebook: `${artist.name} presenta: ${topic}. ${description}`,
      youtube: `${topic} — ${cta}`,
    },
    source: "mock",
    note: "Generado con datos de ejemplo porque no hay una API key configurada para este proveedor.",
  };
}
