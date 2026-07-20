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
  plataforma con graficas).
- `public/logo.svg` — logotipo del sello, fondo transparente.

## Proximos pasos para datos en vivo

Sustituir `getArtistData` / `getAllArtistData` en `src/lib/mock-data.ts` por llamadas reales:
Google Ads API, YouTube Data API, Spotify for Artists / Web API, Meta Graph API (Instagram y
Facebook), TikTok API, y una integracion con DistroKid (sin API publica; usualmente via
exportacion de reportes o un conector como Supermetrics/Windsor.ai).
