import "server-only";
import crypto from "crypto";
import { getRedis } from "./redis";

const STATE_SECRET = process.env.AUTH_SECRET || "cmd-dev-insecure-secret-change-me";

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

// Tokens live in Redis (Upstash, via the Vercel Marketplace integration) keyed by artist ID —
// shared across every device/browser that logs into that artist's or the admin's session,
// unlike a cookie (tied to one browser) or a server-side file (Vercel's serverless filesystem
// is read-only in production, so per-invocation file writes aren't reliably visible later).

function redisKey(artistId: string): string {
  return `youtube-tokens:${artistId}`;
}

export async function getStoredTokens(artistId: string): Promise<YouTubeTokens | null> {
  try {
    return (await getRedis().get<YouTubeTokens>(redisKey(artistId))) ?? null;
  } catch {
    return null;
  }
}

export async function saveTokens(artistId: string, tokens: YouTubeTokens): Promise<void> {
  await getRedis().set(redisKey(artistId), tokens);
}

export async function deleteTokens(artistId: string): Promise<void> {
  await getRedis().del(redisKey(artistId));
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

/** Returns a valid access token for this artist, refreshing (and re-saving) it first if needed. */
export async function getValidAccessToken(artistId: string): Promise<string | null> {
  const tokens = await getStoredTokens(artistId);
  if (!tokens) return null;
  if (Date.now() < tokens.expiresAt - 60_000) return tokens.accessToken;
  const refreshed = await refreshAccessToken(tokens);
  await saveTokens(artistId, refreshed);
  return refreshed.accessToken;
}
