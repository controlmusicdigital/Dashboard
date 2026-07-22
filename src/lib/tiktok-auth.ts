import "server-only";
import crypto from "crypto";
import { getRedis } from "./redis";

const STATE_SECRET = process.env.AUTH_SECRET || "cmd-dev-insecure-secret-change-me";

// Read-only scopes: profile + stats + list of the artist's own public videos. All three work in
// TikTok's sandbox mode with added "Target users" — no app audit needed, unlike video.publish.
const SCOPES = ["user.info.basic", "user.info.stats", "video.list"];

export interface TikTokTokens {
  accessToken: string;
  expiresAt: number; // epoch ms
  refreshToken: string;
  refreshExpiresAt: number; // epoch ms
  openId: string;
}

export function isTikTokOAuthConfigured(): boolean {
  return Boolean(process.env.TIKTOK_CLIENT_KEY && process.env.TIKTOK_CLIENT_SECRET);
}

// Same Redis (Upstash, via the Vercel Marketplace integration) already used for YouTube and
// Instagram tokens, just a different key namespace — no new database needed.

function redisKey(artistId: string): string {
  return `tiktok-tokens:${artistId}`;
}

export async function getStoredTokens(artistId: string): Promise<TikTokTokens | null> {
  try {
    return (await getRedis().get<TikTokTokens>(redisKey(artistId))) ?? null;
  } catch {
    return null;
  }
}

export async function saveTokens(artistId: string, tokens: TikTokTokens): Promise<void> {
  await getRedis().set(redisKey(artistId), tokens);
}

export async function deleteTokens(artistId: string): Promise<void> {
  await getRedis().del(redisKey(artistId));
}

// Signed, tamper-proof "state" param so the callback can trust which artist initiated the
// OAuth flow (and that it wasn't forged) without needing server-side session storage.
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
    client_key: process.env.TIKTOK_CLIENT_KEY!,
    scope: SCOPES.join(","),
    response_type: "code",
    redirect_uri: redirectUri,
    state,
  });
  return `https://www.tiktok.com/v2/auth/authorize/?${params.toString()}`;
}

interface TikTokTokenResponse {
  access_token: string;
  expires_in: number;
  refresh_token: string;
  refresh_expires_in: number;
  open_id: string;
  error?: string;
  error_description?: string;
}

export async function exchangeCodeForTokens(code: string, redirectUri: string): Promise<TikTokTokens> {
  const res = await fetch("https://open.tiktokapis.com/v2/oauth/token/", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", "Cache-Control": "no-cache" },
    body: new URLSearchParams({
      client_key: process.env.TIKTOK_CLIENT_KEY!,
      client_secret: process.env.TIKTOK_CLIENT_SECRET!,
      code,
      grant_type: "authorization_code",
      redirect_uri: redirectUri,
    }),
  });
  const data: TikTokTokenResponse = await res.json();
  if (!res.ok || data.error) throw new Error(`TikTok respondio ${res.status}: ${data.error_description || data.error || "error desconocido"}`);

  return {
    accessToken: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
    refreshToken: data.refresh_token,
    refreshExpiresAt: Date.now() + data.refresh_expires_in * 1000,
    openId: data.open_id,
  };
}

async function refreshAccessToken(tokens: TikTokTokens): Promise<TikTokTokens> {
  const res = await fetch("https://open.tiktokapis.com/v2/oauth/token/", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", "Cache-Control": "no-cache" },
    body: new URLSearchParams({
      client_key: process.env.TIKTOK_CLIENT_KEY!,
      client_secret: process.env.TIKTOK_CLIENT_SECRET!,
      grant_type: "refresh_token",
      refresh_token: tokens.refreshToken,
    }),
  });
  const data: TikTokTokenResponse = await res.json();
  if (!res.ok || data.error) throw new Error(`TikTok respondio ${res.status} al refrescar: ${data.error_description || data.error || "error desconocido"}`);

  return {
    accessToken: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
    // TikTok rotates the refresh token on every refresh — always keep the newest one.
    refreshToken: data.refresh_token,
    refreshExpiresAt: Date.now() + data.refresh_expires_in * 1000,
    openId: data.open_id,
  };
}

/**
 * Returns a valid access token for this artist, refreshing (and re-saving) it first if needed.
 * TikTok access tokens only last 24h (much shorter than YouTube/Instagram's), so this refreshes
 * proactively with a 10-minute buffer rather than waiting for an expired-token error.
 */
export async function getValidAccessToken(artistId: string): Promise<string | null> {
  const tokens = await getStoredTokens(artistId);
  if (!tokens) return null;
  const tenMinutesMs = 10 * 60 * 1000;
  if (Date.now() < tokens.expiresAt - tenMinutesMs) return tokens.accessToken;
  const refreshed = await refreshAccessToken(tokens);
  await saveTokens(artistId, refreshed);
  return refreshed.accessToken;
}
