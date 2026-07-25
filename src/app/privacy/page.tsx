import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Política de privacidad | Control Music Digital",
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-2xl flex-col gap-5 px-6 py-12" style={{ color: "var(--text-primary)" }}>
      <h1 className="text-2xl font-bold">Política de privacidad</h1>
      <p className="text-sm" style={{ color: "var(--text-muted)" }}>Última actualización: julio de 2026</p>

      <p>
        Este panel (&quot;Control Music Digital Dashboard&quot;) es una herramienta interna de gestión de artistas usada por
        Control Music Digital, un sello discográfico independiente con sede en Santo Domingo, República Dominicana,
        y por los artistas de su roster. No es una aplicación pública ni de consumo masivo.
      </p>

      <h2 className="text-lg font-semibold">Qué datos recolectamos</h2>
      <p>
        Cuando un artista conecta su cuenta de YouTube, Instagram o TikTok a este panel mediante inicio de sesión
        OAuth oficial de cada plataforma, recibimos y almacenamos:
      </p>
      <ul className="list-disc pl-5">
        <li>Un token de acceso (y, cuando aplica, un token de renovación) para consultar la API de esa plataforma en su nombre.</li>
        <li>Datos públicos de perfil: nombre de usuario, foto de perfil, número de seguidores/suscriptores.</li>
        <li>Estadísticas de su propio contenido: vistas, likes, comentarios y fecha de publicación de sus videos o publicaciones.</li>
      </ul>

      <h2 className="text-lg font-semibold">Cómo usamos estos datos</h2>
      <p>
        Estos datos se usan exclusivamente para mostrarle a cada artista sus propias estadísticas dentro de su
        panel privado. No vendemos, compartimos ni usamos estos datos con fines publicitarios, y no los compartimos
        con terceros fuera de Control Music Digital.
      </p>

      <h2 className="text-lg font-semibold">Dónde se guardan</h2>
      <p>
        Los tokens de acceso se guardan cifrados en tránsito en una base de datos Redis administrada (Upstash, vía
        Vercel), asociados únicamente al identificador interno del artista. Nunca se guardan en el navegador ni se
        exponen al cliente.
      </p>

      <h2 className="text-lg font-semibold">Cómo desconectar tu cuenta</h2>
      <p>
        Cualquier artista puede desconectar su cuenta de YouTube, Instagram o TikTok en cualquier momento desde su
        propio panel (&quot;Estudio de redes sociales&quot; → botón &quot;Desconectar&quot;), lo que elimina inmediatamente el token
        guardado. También puedes revocar el acceso directamente desde la configuración de la app en tu cuenta de
        Google, Instagram/Meta o TikTok.
      </p>

      <h2 className="text-lg font-semibold">Contacto</h2>
      <p>
        Preguntas sobre esta política o sobre tus datos: <a href="mailto:eunchindeto@gmail.com" className="underline">eunchindeto@gmail.com</a>.
      </p>
    </div>
  );
}
