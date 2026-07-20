"use client";

import { useState } from "react";
import { ArtistData } from "@/lib/types";
import { PLATFORM_ORDER } from "@/lib/platforms";
import { PlatformCard } from "./PlatformCard";
import { ArtistStudio } from "./ArtistStudio";

type SubView = "metrics" | "studio";

export function ArtistView({ data }: { data: ArtistData }) {
  const { artist } = data;
  const [subView, setSubView] = useState<SubView>("metrics");

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <span
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-lg font-bold"
            style={{ backgroundColor: artist.accent, color: "#0b0b0b" }}
          >
            {artist.initials}
          </span>
          <div>
            <h2 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>
              {artist.name}
            </h2>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              {artist.genre} · {artist.location}
            </p>
          </div>
        </div>

        <div className="flex gap-2 rounded-full p-1" style={{ backgroundColor: "var(--surface-2)", border: "1px solid var(--border-hairline)" }}>
          <SubTabButton active={subView === "metrics"} onClick={() => setSubView("metrics")}>
            Metricas
          </SubTabButton>
          <SubTabButton active={subView === "studio"} onClick={() => setSubView("studio")}>
            Estudio de contenido
          </SubTabButton>
        </div>
      </div>

      {subView === "metrics" ? (
        <>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            {artist.bio}
          </p>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
            {PLATFORM_ORDER.map((id) => (
              <PlatformCard key={id} snapshot={data.platforms[id]} />
            ))}
          </div>
        </>
      ) : (
        <ArtistStudio artist={artist} />
      )}
    </div>
  );
}

function SubTabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className="rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors"
      style={
        active
          ? { backgroundColor: "var(--text-primary)", color: "var(--page-plane)" }
          : { color: "var(--text-secondary)" }
      }
    >
      {children}
    </button>
  );
}
