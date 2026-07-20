import "server-only";
import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { artists, getArtist } from "./artists";

export type Session = { role: "admin" } | { role: "artist"; artistId: string };

export const SESSION_COOKIE = "cmd-session";

// Falls back to a fixed dev secret so local/demo use works out of the box; set a real
// AUTH_SECRET before relying on this for anything that matters.
const SECRET = process.env.AUTH_SECRET || "cmd-dev-insecure-secret-change-me";

function envKeyForArtist(artistId: string): string {
  return `ARTIST_PASSWORD_${artistId.toUpperCase().replace(/-/g, "_")}`;
}

export function getArtistPassword(artistId: string): string | undefined {
  return process.env[envKeyForArtist(artistId)] || undefined;
}

export function getAdminPassword(): string | undefined {
  return process.env.ADMIN_PASSWORD || undefined;
}

// Login is opt-in: until at least one password is configured, every route stays as
// open as it's always been - avoids locking everyone out the moment this code ships.
export function isAuthConfigured(): boolean {
  if (getAdminPassword()) return true;
  return artists.some((a) => getArtistPassword(a.id));
}

function sign(payload: string): string {
  return crypto.createHmac("sha256", SECRET).update(payload).digest("base64url");
}

export function createSessionToken(session: Session): string {
  const payload = Buffer.from(JSON.stringify(session)).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export function verifySessionToken(token: string | undefined | null): Session | null {
  if (!token) return null;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return null;
  if (sign(payload) !== sig) return null;
  try {
    const session = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as Session;
    if (session.role === "artist" && !getArtist(session.artistId)) return null;
    if (session.role !== "admin" && session.role !== "artist") return null;
    return session;
  } catch {
    return null;
  }
}

export function getSession(req: NextRequest): Session | null {
  return verifySessionToken(req.cookies.get(SESSION_COOKIE)?.value);
}

/** Returns a 403 response if this session isn't allowed to act as `artistId`, otherwise null. */
export function requireArtistAccess(req: NextRequest, artistId: string): NextResponse | null {
  if (!isAuthConfigured()) return null;
  const session = getSession(req);
  if (!session) return NextResponse.json({ error: "Inicia sesion para continuar" }, { status: 401 });
  if (session.role === "admin") return null;
  if (session.artistId === artistId) return null;
  return NextResponse.json({ error: "No tienes acceso a este artista" }, { status: 403 });
}
