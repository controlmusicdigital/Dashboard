# Control Music Digital — Panel de artistas

Panel en Next.js para el sello Control Music Digital (Republica Dominicana), con metricas
de Pacheman, Max y El Real Soprano en un solo lugar: Spotify, YouTube, Instagram, TikTok,
Facebook, Google Ads y DistroKid.

## Estado actual

Los datos que se muestran son **de ejemplo** (deterministas, no aleatorios en cada carga),
para poder disenar y validar el panel completo antes de conectar cuentas reales. Cada
tarjeta de plataforma esta lista para reemplazar `src/lib/mock-data.ts` por llamadas a las
APIs/exportaciones reales de cada servicio.

## Desarrollo

```bash
npm install
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

```bash
npm run build   # build de produccion
npm run lint    # eslint
```

## Estructura

- `src/lib/types.ts` — tipos compartidos (artista, snapshot de plataforma, series de tiempo).
- `src/lib/mock-data.ts` — generador determinista de datos de ejemplo por artista/plataforma.
- `src/lib/artists.ts`, `src/lib/platforms.tsx` — catalogo de artistas y metadata/iconos de plataformas.
- `src/components/` — UI del panel (selector de artista, resumen comparativo, tarjetas por
  plataforma con graficas, Estudio de contenido).
- `src/lib/ai/`, `src/app/api/generate-post`, `src/app/api/ai-status` — integracion con
  Gemini y ChatGPT para el Estudio de contenido (ver mas abajo).
- `public/logo.svg` — logotipo del sello, fondo transparente.

## Estudio de contenido (Gemini / ChatGPT)

Cada artista tiene una pestana "Estudio de contenido" (dentro de su pagina, pestana junto a
"Metricas") para redactar un post con ayuda de IA y enviarlo a Instagram, TikTok, Facebook y
YouTube.

Para activar la generacion real con tu propia cuenta:

1. Copia `.env.local.example` a `.env.local`.
2. Pon tu llave en `GEMINI_API_KEY` y/o `OPENAI_API_KEY` (puedes tener una, otra, o ambas —
   el estudio deja elegir el proveedor por publicacion). **Nunca pegues una API key en el
   chat ni la subas al repo** — `.env.local` ya esta en `.gitignore`.
3. Reinicia `npm run dev`.

Sin llave configurada, ese proveedor sigue funcionando pero con contenido de ejemplo (se
avisa en la interfaz). Las llamadas a Gemini/OpenAI ocurren solo en el servidor
(`src/lib/ai/providers.ts`, marcado `server-only`); la llave nunca llega al navegador.

El boton "Publicar en todas" hoy **simula** el envio (con estados por red y reintentos) —
para publicar de verdad hace falta autorizar cada cuenta por OAuth (Meta Graph API para
Instagram/Facebook, TikTok Content Posting API, YouTube Data API) y guardar esos tokens por
artista; ese es el siguiente paso cuando quieran conectar cuentas reales.

## Chatbot por artista (Claude Opus 4.8)

Cada artista tiene una pestana "Chat con &lt;artista&gt;" — un chatbot que responde en el
personaje del artista (nombre, genero, bio), pensado para el equipo o para probar la voz del
artista antes de usarla en redes. Corre sobre la API de Claude (modelo `claude-opus-4-8`) con
streaming en tiempo real.

1. Copia `.env.local.example` a `.env.local` si no lo has hecho.
2. Pon tu llave en `ANTHROPIC_API_KEY` (consola de Anthropic, nunca en el chat ni en el repo).
3. Reinicia `npm run dev`.

Sin la llave, el chat sigue funcionando con respuestas de ejemplo (se avisa con el estado
"Modo demostracion" en la cabecera del chat). La llamada a Claude ocurre solo en
`src/app/api/chat/route.ts` (servidor); la llave nunca llega al navegador.

El chat tambien soporta voz en el navegador (sin API extra): microfono para dictar el mensaje
y boton de bocina para escuchar cada respuesta, usando el Web Speech API nativo del navegador
(Chromium). Si el navegador no lo soporta, esos botones simplemente no aparecen.

## Campanas publicitarias (Google Ads, Instagram, TikTok, Facebook, YouTube)

Pestana "Campanas" por artista: arma una campana (objetivo, plataformas, presupuesto, fechas,
audiencia), genera el copy publicitario con Gemini o ChatGPT, y la pasa a "borrador". El boton
"Activar" hoy la marca como activa de forma **simulada** — publicarla de verdad en cada
plataforma requiere las cuentas de Google Ads / Meta Ads / TikTok Ads conectadas por API,
igual que el resto de integraciones pendientes.

## Proximos pasos para datos en vivo

Sustituir `getArtistData` / `getAllArtistData` en `src/lib/mock-data.ts` por llamadas reales:
Google Ads API, YouTube Data API, Spotify for Artists / Web API, Meta Graph API (Instagram y
Facebook), TikTok API, y una integracion con DistroKid (sin API publica; usualmente via
exportacion de reportes o un conector como Supermetrics/Windsor.ai).
