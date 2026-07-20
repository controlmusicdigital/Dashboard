import "server-only";
import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";

const STATE_SECRET = process.env.AUTH_SECRET || "cmd-dev-insecure-secret-change-me";
const COOKIE_PREFIX = "cmd-yt-";

const SCOPES = ["https://www.googleapis.com/auth/youtube.readonly", "https://www.googleapis.com/auth/yt-analytics.readonly"];

export interface YouTubeTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number; // epoch ms
  scope: string;
}

export function isYouTubeOAuthConfigured(): boolean {
  return Boolean(process.env.GOOGLE_OAUTH_CLIENT_ID && process.env.GOOGLE_OAUTH_CLIENT_SECRET);
}

function sign(payload: string): string {
  return crypto.createHmac("sha256", STATE_SECRET).update(payload).digest("base64url");
}

function cookieName(artistId: string): string {
  return `${COOKIE_PREFIX}${artistId}`;
}

// Tokens are stored in a signed, httpOnly cookie rather than a server-side file:
// Vercel's serverless functions have a read-only filesystem in production, so a
// file written by one invocation isn't reliably visible to the next one.
function encodeTokens(tokens: YouTubeTokens): string {
  const payload = Buffer.from(JSON.stringify(tokens)).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

function decodeTokens(value: string | undefined): YouTubeTokens | null {
  if (!value) return null;
  const [payload, sig] = value.split(".");
  if (!payload || !sig || sign(payload) !== sig) return null;
  try {
    return JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as YouTubeTokens;
  } catch {
    return null;
  }
}

export function getStoredTokens(req: NextRequest, artistId: string): YouTubeTokens | null {
  return decodeTokens(req.cookies.get(cookieName(artistId))?.value);
}

export function setTokensCookie(res: NextResponse, artistId: string, tokens: YouTubeTokens) {
  res.cookies.set(cookieName(artistId), encodeTokens(tokens), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 180,
  });
}

export function clearTokensCookie(res: NextResponse, artistId: string) {
  res.cookies.delete(cookieName(artistId));
}

// Signed, tamper-proof "state" param so the callback can trust which artist initiated
// the OAuth flow (and that it wasn't forged) without needing server-side session storage.
export function createOAuthState(artistId: string): string {
  const payload = Buffer.from(JSON.stringify({ artistId, nonce: crypto.randomUUID() })).toString("base64url");
  const sig = crypto.createHmac("sha256", STATE_SECRET).update(payload).digest("base64url");
  return `${payload}.${sig}`;
}

export function verifyOAuthState(state: string | null): { artistId: string } | null {
  if (!state) return null;
  const [payload, sig] = state.split(".");
  if (!payload || !sig) return null;
  const expected = crypto.createHmac("sha256", STATE_SECRET).update(payload).digest("base64url");
  if (expected !== sig) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    return typeof data.artistId === "string" ? { artistId: data.artistId } : null;
  } catch {
    return null;
  }
}

export function buildAuthUrl(redirectUri: string, state: string): string {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_OAUTH_CLIENT_ID!,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: SCOPES.join(" "),
    access_type: "offline",
    prompt: "consent",
    state,
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

export async function exchangeCodeForTokens(code: string, redirectUri: string): Promise<YouTubeTokens> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_OAUTH_CLIENT_ID!,
      client_secret: process.env.GOOGLE_OAUTH_CLIENT_SECRET!,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });
  if (!res.ok) throw new Error(`Google respondio ${res.status} al canjear el codigo`);
  const data = await res.json();
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: Date.now() + data.expires_in * 1000,
    scope: data.scope,
  };
}

async function refreshAccessToken(tokens: YouTubeTokens): Promise<YouTubeTokens> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      refresh_token: tokens.refreshToken,
      client_id: process.env.GOOGLE_OAUTH_CLIENT_ID!,
      client_secret: process.env.GOOGLE_OAUTH_CLIENT_SECRET!,
      grant_type: "refresh_token",
    }),
  });
  if (!res.ok) throw new Error(`Google respondio ${res.status} al refrescar el token`);
  const data = await res.json();
  return { ...tokens, accessToken: data.access_token, expiresAt: Date.now() + data.expires_in * 1000 };
}

/**
 * Returns a valid access token for this artist, refreshing it first if needed. When a
 * refresh happens, the caller must persist `refreshed` back onto its response via
 * `setTokensCookie` (this function has no response to attach a Set-Cookie to itself).
 */
export async function getValidAccessToken(
  req: NextRequest,
  artistId: string
): Promise<{ accessToken: string; refreshed?: YouTubeTokens } | null> {
  const tokens = getStoredTokens(req, artistId);
  if (!tokens) return null;
  if (Date.now() < tokens.expiresAt - 60_000) return { accessToken: tokens.accessToken };
  const refreshed = await refreshAccessToken(tokens);
  return { accessToken: refreshed.accessToken, refreshed };
}
