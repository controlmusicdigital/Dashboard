export type TeamRole = "admin" | "editor" | "viewer";

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: TeamRole;
  status: "invitado" | "activo";
  invitedAt: string;
}

export interface ActivityEntry {
  id: string;
  member: string;
  action: string;
  detail?: string;
  entityId: string;
  entityName: string;
  at: string;
}

const TEAM_KEY = "cmd-team";
const ACTIVITY_KEY = "cmd-activity";
const CURRENT_USER_KEY = "cmd-current-user";
const MAX_ACTIVITY = 200;

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

export function getTeam(): TeamMember[] {
  return read<TeamMember[]>(TEAM_KEY, []);
}

export function inviteMember(name: string, email: string, role: TeamRole): TeamMember {
  const member: TeamMember = {
    id: `${Date.now()}`,
    name,
    email,
    role,
    status: "invitado",
    invitedAt: new Date().toISOString(),
  };
  write(TEAM_KEY, [member, ...getTeam()]);
  return member;
}

export function markMemberActive(id: string) {
  write(
    TEAM_KEY,
    getTeam().map((m) => (m.id === id ? { ...m, status: "activo" as const } : m))
  );
}

export function removeMember(id: string) {
  write(
    TEAM_KEY,
    getTeam().filter((m) => m.id !== id)
  );
}

export function getCurrentUser(): string {
  return read<string>(CURRENT_USER_KEY, "Presidente");
}

export function setCurrentUser(name: string) {
  write(CURRENT_USER_KEY, name);
}

export function getActivity(): ActivityEntry[] {
  return read<ActivityEntry[]>(ACTIVITY_KEY, []);
}

export function logActivity(action: string, entityId: string, entityName: string, detail?: string): ActivityEntry {
  const entry: ActivityEntry = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    member: getCurrentUser(),
    action,
    detail,
    entityId,
    entityName,
    at: new Date().toISOString(),
  };
  write(ACTIVITY_KEY, [entry, ...getActivity()].slice(0, MAX_ACTIVITY));
  return entry;
}
