"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { GridBackground } from "./hud/GridBackground";

interface ArtistOption {
  id: string;
  name: string;
  configured: boolean;
}

interface StatusResponse {
  authConfigured: boolean;
  adminConfigured: boolean;
  artists: ArtistOption[];
}

export function LoginScreen({ onLoggedIn }: { onLoggedIn: () => void }) {
  const [status, setStatus] = useState<StatusResponse | null>(null);
  const [role, setRole] = useState<"artist" | "admin">("artist");
  const [artistId, setArtistId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/auth/status")
      .then((r) => r.json())
      .then((data: StatusResponse) => {
        setStatus(data);
        if (data.artists.length > 0) setArtistId(data.artists[0].id);
      })
      .catch(() => setStatus({ authConfigured: false, adminConfigured: false, artists: [] }));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (role === "artist" && !artistId) {
      setError("Selecciona tu artista.");
      return;
    }
    if (!password.trim()) {
      setError("Escribe tu contrasena.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role, artistId: role === "artist" ? artistId : undefined, password: password.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "No se pudo iniciar sesion");
      onLoggedIn();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo iniciar sesion");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center px-4" style={{ backgroundColor: "var(--page-plane)" }}>
      <GridBackground />
      <form
        onSubmit={handleSubmit}
        className="relative z-10 flex w-full max-w-sm flex-col gap-4 rounded-2xl p-6"
        style={{ backgroundColor: "var(--surface-1)", border: "1px solid var(--border-hairline)" }}
      >
        <div className="flex flex-col items-center gap-2 text-center">
          <Image src="/logo.svg" alt="Control Music Digital" width={44} height={44} className="rounded-full" style={{ filter: "drop-shadow(0 0 6px var(--accent-cyan))" }} />
          <h1 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>
            Control Music Digital
          </h1>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            Inicia sesion para ver tu panel
          </p>
        </div>

        <div className="flex gap-2 rounded-full p-1" style={{ backgroundColor: "var(--surface-2)" }}>
          <button
            type="button"
            onClick={() => setRole("artist")}
            className="flex-1 rounded-full py-1.5 text-sm font-medium"
            style={role === "artist" ? { backgroundColor: "var(--text-primary)", color: "var(--page-plane)" } : { color: "var(--text-secondary)" }}
          >
            Soy artista
          </button>
          <button
            type="button"
            onClick={() => setRole("admin")}
            className="flex-1 rounded-full py-1.5 text-sm font-medium"
            style={role === "admin" ? { backgroundColor: "var(--text-primary)", color: "var(--page-plane)" } : { color: "var(--text-secondary)" }}
          >
            Administrador
          </button>
        </div>

        {role === "artist" && (
          <div>
            <label className="mb-1 block text-xs font-medium" style={{ color: "var(--text-muted)" }}>
              Artista
            </label>
            <select
              value={artistId}
              onChange={(e) => setArtistId(e.target.value)}
              className="w-full rounded-xl px-3 py-2 text-sm outline-none"
              style={{ backgroundColor: "var(--surface-2)", border: "1px solid var(--border-hairline)", color: "var(--text-primary)" }}
            >
              {status?.artists.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                  {!a.configured ? " (sin configurar)" : ""}
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="mb-1 block text-xs font-medium" style={{ color: "var(--text-muted)" }}>
            Contrasena
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl px-3 py-2 text-sm outline-none"
            style={{ backgroundColor: "var(--surface-2)", border: "1px solid var(--border-hairline)", color: "var(--text-primary)" }}
          />
        </div>

        {error && (
          <p className="text-xs" style={{ color: "var(--status-critical)" }}>
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="rounded-xl py-2.5 text-sm font-semibold disabled:opacity-60"
          style={{ background: "linear-gradient(135deg, var(--accent-cyan), var(--accent-magenta))", color: "#04121a" }}
        >
          {loading ? "Entrando..." : "Entrar"}
        </button>
      </form>
    </div>
  );
}
