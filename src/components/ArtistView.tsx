import { ArtistData } from "@/lib/types";
import { PLATFORM_ORDER } from "@/lib/platforms";
import { PlatformCard } from "./PlatformCard";

export function ArtistView({ data }: { data: ArtistData }) {
  const { artist } = data;
  return (
    <div className="flex flex-col gap-6">
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
      <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
        {artist.bio}
      </p>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
        {PLATFORM_ORDER.map((id) => (
          <PlatformCard key={id} snapshot={data.platforms[id]} />
        ))}
      </div>
    </div>
  );
}
