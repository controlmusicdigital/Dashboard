import type { Metadata } from "next";
import Image from "next/image";
import { getFileMeta } from "@/lib/file-store";

function formatBytes(bytes: number): string {
  if (bytes >= 1_073_741_824) return `${(bytes / 1_073_741_824).toFixed(1)} GB`;
  if (bytes >= 1_048_576) return `${(bytes / 1_048_576).toFixed(1)} MB`;
  if (bytes >= 1_024) return `${(bytes / 1_024).toFixed(1)} KB`;
  return `${bytes} B`;
}

function iconFor(mimeType: string): string {
  if (mimeType.startsWith("video/")) return "🎬";
  if (mimeType.startsWith("image/")) return "🖼️";
  if (mimeType.startsWith("audio/")) return "🎵";
  if (mimeType === "application/pdf") return "📄";
  return "📁";
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const meta = await getFileMeta(id).catch(() => null);
  const title = meta ? `CONTROL MUSIC DIGITAL — ${meta.filename}` : "CONTROL MUSIC DIGITAL — Archivo no encontrado";
  const description = meta ? `Archivo compartido por Control Music Digital (${formatBytes(meta.size)}).` : "Este archivo ya no esta disponible.";
  return {
    title,
    description,
    openGraph: { title, description, images: ["/og-image.png"] },
  };
}

export default async function SharedFilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const meta = await getFileMeta(id).catch(() => null);

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col items-center justify-center gap-5 px-6 py-12 text-center">
      <Image
        src="/logo.svg"
        alt="Control Music Digital"
        width={56}
        height={56}
        className="rounded-full"
        style={{ filter: "drop-shadow(0 0 8px var(--accent-cyan))" }}
      />
      <div className="-mt-3 text-xs font-semibold tracking-wide" style={{ color: "var(--text-muted)" }}>
        CONTROL MUSIC DIGITAL
      </div>
      {meta ? (
        <>
          <span className="text-4xl">{iconFor(meta.mimeType)}</span>
          <h1 className="break-words text-lg font-bold" style={{ color: "var(--text-primary)" }}>
            {meta.filename}
          </h1>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            {formatBytes(meta.size)} · Subido por {meta.uploadedBy}
          </p>
          <a
            href={`/api/files/${id}`}
            className="rounded-full px-6 py-3 text-sm font-semibold"
            style={{ backgroundColor: "var(--text-primary)", color: "var(--page-plane)" }}
          >
            Descargar archivo
          </a>
        </>
      ) : (
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          Este archivo ya no esta disponible o fue eliminado.
        </p>
      )}
    </div>
  );
}
