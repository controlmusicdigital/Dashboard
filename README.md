# Control Music Digital — Panel de artistas

Panel en Next.js para el sello Control Music Digital (Republica Dominicana), con metricas
de Pacheman, Max y El Real Soprano en un solo lugar: Spotify, YouTube, Instagram, TikTok,
Facebook, X, Google Ads y DistroKid.

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
"Metricas") para redactar un post con ayuda de IA y enviarlo a Instagram, TikTok, Facebook,
YouTube y X.

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

### Importar desde un enlace (Claude)

En la misma pestana, "Importar desde un enlace" deja pegar un link (YouTube, TikTok, Instagram,
un articulo) y usa Claude (`claude-opus-4-8` con la herramienta de busqueda/lectura web) para
leerlo y armar un post inspirado en ese contenido, con el mismo formato que el resto del estudio.
Usa `ANTHROPIC_API_KEY`; sin ella, muestra contenido de ejemplo. Sirve en `src/lib/claude/link-import.ts`.

## YouTube Studio

Pestana "YouTube Studio" por artista: una mini version del YouTube Studio real — lista de videos
con miniatura, vistas/likes/comentarios, estado (Publico/No listado/Borrador) y fecha, mas un
formulario para "subir" un video nuevo (titulo + archivo). La subida es **simulada** — igual que
el resto del estudio, publicar de verdad requiere conectar la cuenta de YouTube por OAuth.

## Comentarios (bandeja unificada)

Pestana "Comentarios" (nivel general): todos los comentarios de Instagram, TikTok, Facebook, X y
YouTube de los tres artistas y de El sello, en un solo lugar, cada uno etiquetado con la red y el
artista de origen. Filtra por artista/sello, por red social, o busca por texto/usuario; el boton
"Responder" simula una respuesta (se guarda solo en esta sesion del navegador) y queda registrada
en la actividad de "Mi equipo".

## Archivos (compartir videos y archivos sin perder calidad)

Pestana "Archivos" (nivel general): arrastra o elige videos, fotos o documentos para compartirlos
con el equipo. Esto **si es real** — el archivo se guarda tal cual llega, byte por byte, sin
comprimir ni recodificar (verificado con hash SHA-256 antes/despues: identico), y "Descargar" trae
exactamente el mismo archivo. Se sirve desde `src/lib/file-store.ts` (servidor) y se guarda en
`.data/shared-files/` en el disco de esta maquina — por eso funciona mientras el panel corra como
proceso persistente (como ahora), pero **no sobrevive un redeploy en un hosting serverless** (ej.
Vercel) sin agregar un servicio de almacenamiento real (S3, Vercel Blob, etc.), que seria el
siguiente paso para que los archivos queden disponibles de forma permanente.

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

## Campanas publicitarias (Google Ads, Instagram, TikTok, Facebook, YouTube, X)

Pestana "Campanas" por artista: arma una campana (objetivo, plataformas, presupuesto, fechas,
audiencia), genera el copy publicitario con Gemini o ChatGPT, y la pasa a "borrador". El boton
"Activar" hoy la marca como activa de forma **simulada** — publicarla de verdad en cada
plataforma requiere las cuentas de Google Ads / Meta Ads / TikTok Ads conectadas por API,
igual que el resto de integraciones pendientes.

## Noticias y farandula (Claude + busqueda web)

Pestana "Noticias" (nivel sello, junto a "Resumen general"): busca titulares recientes de la
industria musical y farandula de Republica Dominicana usando Claude (`claude-opus-4-8`) con la
herramienta de busqueda web integrada de la API — sin necesitar una API key de noticias
aparte, solo `ANTHROPIC_API_KEY`.

- Se actualiza sola cada hora mientras el panel este abierto en el navegador, y tiene un
  boton "Actualizar ahora" para forzar una busqueda.
- Boton "Activar notificaciones" pide permiso de notificaciones del navegador; una vez
  concedido, cada actualizacion (automatica o manual) dispara una notificacion del sistema
  con el numero de titulares nuevos. Esto es una notificacion de navegador — solo funciona
  mientras el panel sigue abierto en una pestana, no es una notificacion push en segundo
  plano ni llega al celular sin el navegador abierto.
- Sin `ANTHROPIC_API_KEY`, muestra titulares de ejemplo (basados en nuestro propio roster,
  nunca noticias inventadas sobre terceros reales) con la etiqueta "Datos de ejemplo".
- La busqueda ocurre en `src/lib/claude/news.ts` (servidor); la llave nunca llega al
  navegador.
- Cada titular tiene una imagen ilustrativa generada (no es una foto real extraida del
  articulo — Claude no confirma que exista una imagen real asociada, asi que preferimos un
  thumbnail decorativo consistente antes que arriesgar una imagen rota o incorrecta).
- Boton "Compartir" por titular: para X y Facebook abre su enlace real de "compartir"
  (`intent/tweet` y `sharer.php`) en una pestana nueva — no hace falta conectar cuenta.
  Instagram y TikTok no tienen un enlace de compartir desde la web, asi que copiamos el
  titular + link al portapapeles para pegarlo en la app.

## Conexiones (por artista y para el sello)

Cada artista — y tambien "El sello" (ver mas abajo) — tiene una pestana "Conexiones" con la
misma tabla de conectores del panel de integraciones: Spotify, YouTube, Instagram, TikTok,
Facebook, X, Google Ads y DistroKid, cada uno con boton "Conectar".

Al conectar, el token de acceso se guarda **solo en ese navegador** (`localStorage`), nunca se
envia a ningun servidor. Esto deja la conexion lista y marcada como "Conectada" — el siguiente
paso, cuando quieran, es que las tarjetas de metricas usen ese token para llamar a la API real
de cada plataforma en lugar de mostrar datos de ejemplo (ver "Proximos pasos" abajo).

## El sello (vista de Control Music Digital)

Pestana "El sello" (nivel general, junto a "Resumen general" y "Noticias"): la misma vista
completa que tiene cada artista — Metricas, Estudio de contenido, Campanas, Conexiones y Chat —
pero para las cuentas oficiales del sello en conjunto, no de un artista individual. Los datos
de ejemplo se generan en `src/lib/label-data.ts` reutilizando el mismo generador que los
artistas (`src/lib/mock-data.ts`).

## Mi equipo (invitaciones y actividad)

Pestana "Mi equipo" (nivel general): boton "Enviar invitacion" para agregar gente de tu equipo (nombre, correo,
rol: administrador / editor / solo lectura), y un feed "Lo que hace mi equipo" que registra las acciones que se
hacen en el panel — conectar una red, publicar un post, activar una campana — con quien las hizo y cuando.

- Es un identificador simple por navegador ("Quien eres en este navegador"), no una cuenta con contrasena.
- Las invitaciones y la actividad se guardan **solo en este navegador** (localStorage); todavia no se envia
  correo real ni hay una cuenta compartida entre dispositivos.
- Para invitaciones por email de verdad y para que cada quien vea la actividad del equipo desde su propio
  celular o computadora, hace falta un backend con autenticacion (cuentas de usuario) y una base de datos
  compartida, mas un servicio de envio de correo (ej. Resend, SendGrid) — ese es el siguiente paso natural.

## Difusion (Telegram y WhatsApp)

Pestana "Difusion" (nivel general): escribe un mensaje y mandalo por Telegram, WhatsApp, o los
dos a la vez con un solo boton.

1. Copia `.env.local.example` a `.env.local` si no lo has hecho.
2. Para Telegram: crea un bot con [@BotFather](https://t.me/BotFather) (te da `TELEGRAM_BOT_TOKEN`),
   agregalo a tu canal o grupo, y saca el `TELEGRAM_CHAT_ID` (ej. abriendo
   `https://api.telegram.org/bot<token>/getUpdates` despues de mandarle un mensaje al bot).
3. Para WhatsApp: crea una app de Meta con el
   [WhatsApp Cloud API](https://developers.facebook.com/docs/whatsapp/cloud-api/get-started) y llena
   `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID` y `WHATSAPP_TO` (el numero que va a recibir).
4. Reinicia `npm run dev`.

Cada boton de plataforma muestra "Real" o "Demo" segun si esa integracion esta configurada. Sin
llaves, el envio se simula (queda marcado como tal, nunca se disfraza de envio real). Con las
llaves puestas, el mensaje sale de verdad — Telegram vía su Bot API (`sendMessage` / `sendPhoto` /
`sendVideo`) y WhatsApp vía la Cloud API de Meta. Nota sobre WhatsApp: la Cloud API solo entrega
mensajes a un numero que te haya escrito en las ultimas 24 horas; fuera de esa ventana hace falta
una plantilla (template) pre-aprobada por Meta — eso no esta implementado todavia. Los envios
ocurren en `src/lib/broadcast/` (servidor); las llaves nunca llegan al navegador.

- **Generar con IA**: escribe un tema y Gemini o ChatGPT redactan el mensaje (reutiliza
  `src/lib/ai/providers.ts`, el mismo backend que el Estudio de contenido y las Campanas). Sin
  llave configurada para ese proveedor, cae en contenido de ejemplo con una nota clara.
- **Foto o video**: adjunta una imagen o video al mensaje. Telegram lo manda como
  `sendPhoto`/`sendVideo`; WhatsApp primero lo sube a su endpoint de medios (`/media`) para
  conseguir un `media_id` y despues lo referencia en el mensaje — ninguno de los dos necesita que
  nosotros hospedemos el archivo en algun servidor propio.

## Memoria (el panel aprende tus preferencias)

Cada vez que generas contenido con IA (Estudio, Campanas, Difusion) o mandas una difusion, el panel
recuerda que proveedor y que plataformas usaste — y las deja preseleccionadas la proxima vez que
abres esa seccion. Es conteo simple guardado en este navegador (`src/lib/memory.ts`, localStorage),
no un modelo entrenado ni nada que se comparta entre dispositivos. La pestana "Mi equipo" tiene una
seccion "Lo que ha aprendido el panel" que muestra esos patrones de forma transparente, con un
boton "Olvidar todo" para resetear cuando quieras.

## Proximos pasos para datos en vivo

Sustituir `getArtistData` / `getAllArtistData` en `src/lib/mock-data.ts` por llamadas reales:
Google Ads API, YouTube Data API, Spotify for Artists / Web API, Meta Graph API (Instagram y
Facebook), TikTok API, y una integracion con DistroKid (sin API publica; usualmente via
exportacion de reportes o un conector como Supermetrics/Windsor.ai).
