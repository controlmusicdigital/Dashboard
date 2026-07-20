import { buildEntityData } from "./mock-data";
import { label } from "./label";
import { ArtistData } from "./types";

let cache: ArtistData | null = null;

export function getLabelData(): ArtistData {
  if (!cache) cache = buildEntityData(label, 1.6);
  return cache;
}
