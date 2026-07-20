"use client";

import { useEffect, useState } from "react";
import { Artist } from "@/lib/types";
import { PLATFORM_META, PLATFORM_ORDER, PlatformIcon } from "@/lib/platforms";
import { connect, disconnect, getConnections, maskToken } from "@/lib/connections";

export function ConnectionsPanel({ entity }: { entity: Artist }) {
  const [connections, setConnections] = useState<ReturnType<typeof getConnections>>({});
  const [openPlatform, setOpenPlatform] = useState<string | null>(null);
  const [tokenInput, setTokenInput] = useState("");

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- localStorage is only readable client-side, unavailable during SSR
    setConnections(getConnections(entity.id));
  }, [entity.id]);

  function handleSave(platform: (typeof PLATFORM_ORDER)[number]) {
    if (!tokenInput.trim()) return;
    connect(entity.id, platform, tokenInput.trim());
    setConnections(getConnections(entity.id));
    setOpenPlatform(null);
    setTokenInput("");
  }

  function handleDisconnect(platform: (typeof PLATFORM_ORDER)[number]) {
    disconnect(entity.id, platform);
    setConnections(getConnections(entity.id));
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h3 className="text-sm font-semibold" style={{ color: "var(--text-secondary)" }}>
          Conexiones de {entity.name}
        </h3>
        <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
          Guarda el token de acceso de cada red para {entity.name}. Se guarda solo en este navegador — no se envia a
          ningun servidor. Este es el primer paso para conectar datos en vivo; las tarjetas de metricas seguiran
          mostrando datos de ejemplo hasta que conectemos cada llamada real a su API.
        </p>
      </div>

      <div className="overflow-hidden rounded-2xl" style={{ border: "1px solid var(--border-hairline)" }}>
        <div
          className="grid grid-cols-[1fr_auto_auto] gap-3 px-4 py-2.5 text-xs font-medium"
          style={{ backgroundColor: "var(--surface-2)", color: "var(--text-muted)" }}
        >
          <span>Conector</span>
          <span>Tipo</span>
          <span>Estado</span>
        </div>
        <div style={{ backgroundColor: "var(--surface-1)" }}>
          {PLATFORM_ORDER.map((platform) => {
            const meta = PLATFORM_META[platform];
            const conn = connections[platform];
            const isOpen = openPlatform === platform;
            return (
              <div key={platform} className="border-t" style={{ borderColor: "var(--border-hairline)" }}>
                <div className="grid grid-cols-[1fr_auto_auto] items-center gap-3 px-4 py-3">
                  <span className="flex items-center gap-2.5 text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                    <PlatformIcon platform={platform} />
                    {meta.label}
                  </span>
                  <span className="text-xs capitalize" style={{ color: "var(--text-muted)" }}>
                    {meta.category}
                  </span>
                  {conn ? (
                    <div className="flex items-center gap-3">
                      <span
                        className="flex items-center gap-1.5 text-xs font-medium"
                        style={{ color: "var(--status-good)" }}
                        title={`Conectado ${new Date(conn.connectedAt).toLocaleDateString("es-DO")}`}
                      >
                        ✓ {maskToken(conn.token)}
                      </span>
                      <button
                        onClick={() => handleDisconnect(platform)}
                        className="text-xs font-medium underline"
                        style={{ color: "var(--text-muted)" }}
                      >
                        Desconectar
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setOpenPlatform(isOpen ? null : platform);
                        setTokenInput("");
                      }}
                      className="rounded-full px-3 py-1.5 text-xs font-semibold"
                      style={{ backgroundColor: "var(--text-primary)", color: "var(--page-plane)" }}
                    >
                      Conectar
                    </button>
                  )}
                </div>
                {isOpen && (
                  <div className="flex flex-col gap-2 px-4 pb-4 sm:flex-row sm:items-center">
                    <input
                      type="password"
                      value={tokenInput}
                      onChange={(e) => setTokenInput(e.target.value)}
                      placeholder={`Token de acceso de ${meta.label}`}
                      className="flex-1 rounded-xl px-3 py-2 text-sm outline-none"
                      style={{ backgroundColor: "var(--surface-2)", border: "1px solid var(--border-hairline)", color: "var(--text-primary)" }}
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleSave(platform)}
                        disabled={!tokenInput.trim()}
                        className="rounded-xl px-3 py-2 text-xs font-semibold disabled:opacity-50"
                        style={{ backgroundColor: "var(--seq-500)", color: "#fff" }}
                      >
                        Guardar
                      </button>
                      <button
                        onClick={() => setOpenPlatform(null)}
                        className="rounded-xl px-3 py-2 text-xs font-medium"
                        style={{ backgroundColor: "var(--surface-2)", border: "1px solid var(--border-hairline)", color: "var(--text-secondary)" }}
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
