"use client";

import { useEffect, useRef, useState } from "react";
import { upload } from "@vercel/blob/client";
import { FileMeta } from "@/lib/file-store";
import { getCurrentUser } from "@/lib/team";
import { logActivity } from "@/lib/team";
import { STATIC_DEMO } from "@/lib/static-demo";

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

function timeAgo(iso: string): string {
  const min = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (min < 1) return "ahora mismo";
  if (min < 60) return `hace ${min} min`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `hace ${hr} h`;
  return `hace ${Math.round(hr / 24)} d`;
}

export function FileShare() {
  const [files, setFiles] = useState<FileMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ name: string; percentage: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function refresh() {
    if (STATIC_DEMO) {
      setLoading(false);
      return;
    }
    const res = await fetch("/api/files");
    const data = await res.json();
    setFiles(data.files ?? []);
    setLoading(false);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial fetch-on-mount, deliberately shows a loading state immediately
    refresh();
  }, []);

  async function uploadFiles(fileList: FileList | File[]) {
    setError(null);
    setUploading(true);
    const uploadedBy = getCurrentUser();
    try {
      for (const file of Array.from(fileList)) {
        setUploadProgress({ name: file.name, percentage: 0 });
        // Goes straight from this browser to Vercel Blob storage — never passes through our
        // server, so there's no request-size limit and big files (video, multi-GB archives) work.
        const blob = await upload(file.name, file, {
          access: "public",
          handleUploadUrl: "/api/files/upload-token",
          multipart: true,
          onUploadProgress: ({ percentage }) => setUploadProgress({ name: file.name, percentage }),
        });

        const res = await fetch("/api/files", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            blobUrl: blob.url,
            blobPathname: blob.pathname,
            filename: file.name,
            mimeType: file.type,
            size: file.size,
            uploadedBy,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || `No se pudo registrar ${file.name}`);
        logActivity(`subio un archivo`, "files", "Archivos", file.name.slice(0, 60));
      }
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo subir el archivo");
    } finally {
      setUploading(false);
      setUploadProgress(null);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function handleDelete(id: string) {
    await fetch(`/api/files/${id}`, { method: "DELETE" });
    setFiles((prev) => prev.filter((f) => f.id !== id));
  }

  async function handleCopyLink(id: string) {
    const link = `${window.location.origin}/api/files/${id}`;
    try {
      await navigator.clipboard.writeText(link);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2500);
    } catch {
      setError("No se pudo copiar el enlace.");
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>
          Archivos
        </h2>
        <p className="mt-1 max-w-2xl text-xs" style={{ color: "var(--text-muted)" }}>
          Sube videos, fotos o documentos para compartir con el equipo — se guardan tal cual, byte por byte, sin
          comprimir ni recodificar, asi que no pierden calidad. El archivo va directo del navegador a Vercel Blob
          (hasta 5 TB), asi que los archivos grandes tambien funcionan. Cada archivo tiene un boton &ldquo;Copiar
          enlace&rdquo; para mandarlo a tu equipo — cualquiera con el enlace puede descargarlo, sin necesitar cuenta.
        </p>
      </div>

      {STATIC_DEMO ? (
        <div
          className="flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed py-10 text-center"
          style={{ borderColor: "var(--border-hairline)", backgroundColor: "var(--surface-1)", color: "var(--text-muted)" }}
        >
          <span className="text-2xl">🔒</span>
          <span className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
            Subir y compartir archivos no esta disponible en esta demo estatica
          </span>
          <span className="max-w-md text-xs">
            GitHub Pages no puede correr el servidor que guarda los archivos — esto funciona en la app completa.
          </span>
        </div>
      ) : (
      <label
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          if (e.dataTransfer.files.length > 0) uploadFiles(e.dataTransfer.files);
        }}
        className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed py-10 text-center"
        style={{
          borderColor: dragOver ? "var(--seq-500)" : "var(--border-hairline)",
          backgroundColor: "var(--surface-1)",
          color: "var(--text-muted)",
        }}
      >
        <span className="text-2xl">⬆️</span>
        <span className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
          {uploadProgress ? `Subiendo ${uploadProgress.name}... ${uploadProgress.percentage}%` : "Arrastra archivos aqui o haz clic para elegir"}
        </span>
        <span className="text-xs">Video, fotos, PDF, lo que sea — sin limite de tamano practico</span>
        <input
          ref={inputRef}
          type="file"
          multiple
          className="hidden"
          disabled={uploading}
          onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) uploadFiles(e.target.files);
          }}
        />
      </label>
      )}

      {error && (
        <p className="text-xs" style={{ color: "var(--status-critical)" }}>
          {error}
        </p>
      )}

      {!STATIC_DEMO && (
      <div className="flex flex-col gap-2">
        {loading ? (
          <div className="rounded-2xl px-4 py-8 text-center text-sm" style={{ backgroundColor: "var(--surface-1)", border: "1px solid var(--border-hairline)", color: "var(--text-muted)" }}>
            Cargando...
          </div>
        ) : files.length === 0 ? (
          <div className="rounded-2xl px-4 py-8 text-center text-sm" style={{ backgroundColor: "var(--surface-1)", border: "1px solid var(--border-hairline)", color: "var(--text-muted)" }}>
            Todavia no se ha subido nada.
          </div>
        ) : (
          files.map((f) => (
            <div
              key={f.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-2xl px-4 py-3"
              style={{ backgroundColor: "var(--surface-1)", border: "1px solid var(--border-hairline)" }}
            >
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex-shrink-0 text-xl">{iconFor(f.mimeType)}</span>
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                    {f.filename}
                  </div>
                  <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                    {formatBytes(f.size)} · {f.uploadedBy} · {timeAgo(f.uploadedAt)}
                  </div>
                </div>
              </div>
              <div className="flex flex-shrink-0 gap-2">
                <button
                  onClick={() => handleCopyLink(f.id)}
                  className="rounded-full px-3 py-1.5 text-xs font-semibold"
                  style={{ backgroundColor: "var(--seq-500)", color: "#fff" }}
                >
                  {copiedId === f.id ? "Copiado" : "Copiar enlace"}
                </button>
                <a
                  href={`/api/files/${f.id}`}
                  className="rounded-full px-3 py-1.5 text-xs font-semibold"
                  style={{ backgroundColor: "var(--text-primary)", color: "var(--page-plane)" }}
                >
                  Descargar
                </a>
                <button
                  onClick={() => handleDelete(f.id)}
                  className="rounded-full px-3 py-1.5 text-xs font-medium"
                  style={{ border: "1px solid var(--status-critical)", color: "var(--status-critical)" }}
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))
        )}
      </div>
      )}
    </div>
  );
}
