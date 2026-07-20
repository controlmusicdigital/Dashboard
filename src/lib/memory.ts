// Lightweight "learning" layer: remembers which choices (AI provider, platforms, etc.)
// get used the most per context, so the app can default to them next time. It's counting,
// not machine learning — but it does genuinely adapt to usage over days, stored locally.

interface MemoryEntry {
  count: number;
  lastUsedAt: string;
}

type MemoryStore = Record<string, Record<string, Record<string, MemoryEntry>>>; // scope -> key -> value -> entry

const STORAGE_KEY = "cmd-memory";

function read(): MemoryStore {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as MemoryStore) : {};
  } catch {
    return {};
  }
}

function write(store: MemoryStore) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

export function recordChoice(scope: string, key: string, value: string) {
  const store = read();
  store[scope] ??= {};
  store[scope][key] ??= {};
  const prev = store[scope][key][value];
  store[scope][key][value] = { count: (prev?.count ?? 0) + 1, lastUsedAt: new Date().toISOString() };
  write(store);
}

export function getSuggested(scope: string, key: string): string | undefined {
  const values = read()[scope]?.[key];
  if (!values) return undefined;
  let best: string | undefined;
  let bestCount = 0;
  for (const [value, entry] of Object.entries(values)) {
    if (entry.count > bestCount) {
      best = value;
      bestCount = entry.count;
    }
  }
  return best;
}

export interface MemorySummaryRow {
  scope: string;
  key: string;
  value: string;
  count: number;
  lastUsedAt: string;
}

const SCOPE_LABEL: Record<string, string> = {
  broadcast: "Difusion",
};
const KEY_LABEL: Record<string, string> = {
  provider: "proveedor de IA",
  platforms: "plataformas",
  objective: "objetivo de campana",
};

export function scopeLabel(scope: string): string {
  if (SCOPE_LABEL[scope]) return SCOPE_LABEL[scope];
  const [kind, id] = scope.split(":");
  if (kind === "studio") return `Estudio de ${id}`;
  if (kind === "campaigns") return `Campanas de ${id}`;
  return scope;
}

export function keyLabel(key: string): string {
  return KEY_LABEL[key] ?? key;
}

export function getMemorySummary(): MemorySummaryRow[] {
  const store = read();
  const rows: MemorySummaryRow[] = [];
  for (const [scope, keys] of Object.entries(store)) {
    for (const [key, values] of Object.entries(keys)) {
      for (const [value, entry] of Object.entries(values)) {
        rows.push({ scope, key, value, count: entry.count, lastUsedAt: entry.lastUsedAt });
      }
    }
  }
  return rows.sort((a, b) => b.count - a.count);
}

export function forgetAll() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
}
