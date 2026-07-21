import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Términos de servicio | Control Music Digital",
};

export default function TermsPage() {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-2xl flex-col gap-5 px-6 py-12" style={{ color: "var(--text-primary)" }}>
      <h1 className="text-2xl font-bold">Términos de servicio</h1>
      <p className="text-sm" style={{ color: "var(--text-muted)" }}>Última actualización: julio de 2026</p>

      <p>
        Este panel ("Control Music Digital Dashboard") es una herramienta interna de gestión de artistas, propiedad
        de y operada por Control Music Digital, un sello discográfico independiente con sede en Santo Domingo,
        República Dominicana. Su uso está limitado al personal del sello y a los artistas de su roster.
      </p>

      <h2 className="text-lg font-semibold">Uso del panel</h2>
      <p>
        El panel permite consultar métricas de las cuentas de YouTube, Instagram y TikTok de cada artista (una vez
        conectadas), gestionar campañas, contenido y comunicación del sello. No está disponible para el público
        general ni ofrece registro abierto — el acceso se otorga individualmente por el sello.
      </p>

      <h2 className="text-lg font-semibold">Conexión de cuentas de terceros</h2>
      <p>
        Al conectar una cuenta de YouTube, Instagram o TikTok mediante el inicio de sesión oficial de cada
        plataforma, autorizas a este panel a consultar en tu nombre los datos descritos en nuestra{" "}
        <a href="/privacy" className="underline">política de privacidad</a>. Puedes revocar esa autorización en
        cualquier momento, tanto desde el propio panel como desde la configuración de tu cuenta en cada plataforma.
      </p>

      <h2 className="text-lg font-semibold">Datos de ejemplo</h2>
      <p>
        Hasta que una cuenta esté conectada, el panel muestra datos de ejemplo (no reales) para fines de
        demostración y diseño. Estas secciones lo indican claramente en la interfaz.
      </p>

      <h2 className="text-lg font-semibold">Disponibilidad</h2>
      <p>
        El panel se ofrece "tal cual", sin garantías de disponibilidad continua. Control Music Digital puede
        modificar, suspender o discontinuar funciones del panel en cualquier momento.
      </p>

      <h2 className="text-lg font-semibold">Contacto</h2>
      <p>
        Preguntas sobre estos términos: <a href="mailto:eunchindeto@gmail.com" className="underline">eunchindeto@gmail.com</a>.
      </p>
    </div>
  );
}
