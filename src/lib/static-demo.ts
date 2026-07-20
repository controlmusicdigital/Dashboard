// Set at build time only for the GitHub Pages static export (see .github/workflows/deploy-pages.yml).
// GitHub Pages can't run the Next.js API routes this app uses for real AI generation, messaging,
// and file storage — this flag lets those sections show an honest "not available in this demo"
// state instead of silently failing against endpoints that don't exist in a static export.
export const STATIC_DEMO = process.env.NEXT_PUBLIC_STATIC_DEMO === "true";

export const STATIC_DEMO_NOTE =
  "No disponible en esta demo estatica (GitHub Pages) — funciona en la app completa con su propio servidor.";
