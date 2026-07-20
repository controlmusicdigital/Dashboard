"use client";

import { useEffect, useRef, useState } from "react";
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
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
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
        const form = new FormData();
        form.append("file", file);
        form.append("uploadedBy", uploadedBy);
        const res = await fetch("/api/files", { method: "POST", body: form });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || `No se pudo subir ${file.name}`);
        logActivity(`subio un archivo`, "files", "Archivos", file.name.slice(0, 60));
      }
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo subir el archivo");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function handleDelete(id: string) {
    await fetch(`/api/files/${id}`, { method: "DELETE" });
    setFiles((prev) => prev.filter((f) => f.id !== id));
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>
          Archivos
        </h2>
        <p className="mt-1 max-w-2xl text-xs" style={{ color: "var(--text-muted)" }}>
          Sube videos, fotos o documentos para compartir con el equipo — se guardan tal cual, byte por byte, sin
          comprimir ni recodificar, asi que no pierden calidad. Se guardan en el disco de este servidor; si el panel
          se despliega en un hosting sin disco persistente (ej. serverless), va a hacer falta un servicio de
          almacenamiento real (S3, Vercel Blob) para que los archivos sobrevivan entre despliegues.
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
          {uploading ? "Subiendo..." : "Arrastra archivos aqui o haz clic para elegir"}
        </span>
        <span className="text-xs">Video, fotos, PDF, lo que sea</span>
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
