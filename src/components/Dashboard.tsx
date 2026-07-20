"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { getAllArtistData } from "@/lib/mock-data";
import { Overview } from "./Overview";
import { ArtistView } from "./ArtistView";
import { ThemeToggle } from "./ThemeToggle";

type View = "overview" | string;

export function Dashboard() {
  const [view, setView] = useState<View>("overview");
  const allData = useMemo(() => getAllArtistData(), []);
  const dataList = Object.values(allData);

  return (
    <div className="mx-auto flex min-h-screen max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Image src="/logo.svg" alt="Control Music Digital" width={40} height={40} className="rounded-full" />
          <div>
            <div className="text-sm font-bold leading-tight" style={{ color: "var(--text-primary)" }}>
              Control Music Digital
            </div>
            <div className="text-xs" style={{ color: "var(--text-muted)" }}>
              Panel de artistas · Republica Dominicana
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span
            className="rounded-full px-2.5 py-1 text-xs font-medium"
            style={{ color: "var(--status-warning)", border: "1px solid var(--status-warning)" }}
          >
            Datos de demostracion
          </span>
          <ThemeToggle />
        </div>
      </header>

      <nav className="flex flex-wrap gap-2">
        <TabButton active={view === "overview"} onClick={() => setView("overview")}>
          Resumen general
        </TabButton>
        {dataList.map((d) => (
          <TabButton key={d.artist.id} active={view === d.artist.id} onClick={() => setView(d.artist.id)}>
            {d.artist.name}
          </TabButton>
        ))}
      </nav>

      <main>
        {view === "overview" ? (
          <Overview dataList={dataList} onSelectArtist={setView} />
        ) : (
          <ArtistView data={allData[view]} />
        )}
      </main>

      <footer className="mt-6 border-t pt-4 text-xs" style={{ borderColor: "var(--border-hairline)", color: "var(--text-muted)" }}>
        Conecta Google Ads, YouTube, Spotify, DistroKid, Instagram, TikTok y Facebook con credenciales reales para
        reemplazar los datos de ejemplo por metricas en vivo.
      </footer>
    </div>
  );
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className="rounded-full px-4 py-2 text-sm font-medium transition-colors"
      style={
        active
          ? { backgroundColor: "var(--text-primary)", color: "var(--page-plane)" }
          : { backgroundColor: "var(--surface-1)", color: "var(--text-secondary)", border: "1px solid var(--border-hairline)" }
      }
    >
      {children}
    </button>
  );
}
