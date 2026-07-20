import { PlatformId } from "./types";

export interface Connection {
  token: string;
  connectedAt: string;
}

type ConnectionMap = Partial<Record<PlatformId, Connection>>;

function storageKey(entityId: string): string {
  return `cmd-connections:${entityId}`;
}

function readAll(entityId: string): ConnectionMap {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(storageKey(entityId));
    return raw ? (JSON.parse(raw) as ConnectionMap) : {};
  } catch {
    return {};
  }
}

function writeAll(entityId: string, map: ConnectionMap) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(storageKey(entityId), JSON.stringify(map));
}

export function getConnections(entityId: string): ConnectionMap {
  return readAll(entityId);
}

export function connect(entityId: string, platform: PlatformId, token: string) {
  const map = readAll(entityId);
  map[platform] = { token, connectedAt: new Date().toISOString() };
  writeAll(entityId, map);
}

export function disconnect(entityId: string, platform: PlatformId) {
  const map = readAll(entityId);
  delete map[platform];
  writeAll(entityId, map);
}

export function maskToken(token: string): string {
  if (token.length <= 4) return "••••";
  return `•••• ${token.slice(-4)}`;
}
