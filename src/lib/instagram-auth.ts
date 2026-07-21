import "server-only";
import crypto from "crypto";
import { Redis } from "@upstash/redis";

const STATE_SECRET = process.env.AUTH_SECRET || "cmd-dev-insecure-secret-change-me";

// "instagram_business_basic" alone keeps the app on Standard Access (profile + media, no
// App Review needed) — enough for read-only stats. Publishing/DM/comment scopes would require
// Advanced Access + App Review, which isn't worth it for a stats-only connection.
const SCOPES = ["instagram_business_basic"];

export interface InstagramTokens {
  accessToken: string;
  expiresAt: number; // epoch ms
  userId: string;
}

export function isInstagramOAuthConfigured(): boolean {
  return Boolean(process.env.INSTAGRAM_APP_ID && process.env.INSTAGRAM_APP_SECRET);
}

// Same Redis (Upstash, via the Vercel Marketplace integration) already used for YouTube tokens,
// just a different key namespace — no new database needed.
let redisClient: Redis | null = null;
function getRedis(): Redis {
  if (!redisClient) {
    const url = process.env.KV_REST_API_URL;
    const token = process.env.KV_REST_API_TOKEN;
    if (!url || !token) throw new Error("KV_REST_API_URL / KV_REST_API_TOKEN no estan configuradas");
    redisClient = new Redis({ url, token });
  }
  return redisClient;
}

function redisKey(artistId: string): string {
  return `instagram-tokens:${artistId}`;
}

export async function getStoredTokens(artistId: string): Promise<InstagramTokens | null> {
  try {
    return (await getRedis().get<InstagramTokens>(redisKey(artistId))) ?? null;
  } catch {
    return null;
  }
}

export async function saveTokens(artistId: string, tokens: InstagramTokens): Promise<void> {
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
    client_id: process.env.INSTAGRAM_APP_ID!,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: SCOPES.join(","),
    state,
  });
  return `https://www.instagram.com/oauth/authorize?${params.toString()}`;
}

export async function exchangeCodeForTokens(code: string, redirectUri: string): Promise<InstagramTokens> {
  const res = await fetch("https://api.instagram.com/oauth/access_token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.INSTAGRAM_APP_ID!,
      client_secret: process.env.INSTAGRAM_APP_SECRET!,
      grant_type: "authorization_code",
      redirect_uri: redirectUri,
      code,
    }),
  });
  if (!res.ok) throw new Error(`Instagram respondio ${res.status} al canjear el codigo`);
  const shortLived = await res.json();

  // Short-lived tokens (from the step above) only last ~1 hour — immediately exchange for a
  // long-lived one (60 days, refreshable) so the artist doesn't have to reconnect constantly.
  const longLivedParams = new URLSearchParams({
    grant_type: "ig_exchange_token",
    client_secret: process.env.INSTAGRAM_APP_SECRET!,
    access_token: shortLived.access_token,
  });
  const longLivedRes = await fetch(`https://graph.instagram.com/access_token?${longLivedParams.toString()}`);
  if (!longLivedRes.ok) throw new Error(`Instagram respondio ${longLivedRes.status} al extender el token`);
  const longLived = await longLivedRes.json();

  return {
    accessToken: longLived.access_token,
    expiresAt: Date.now() + longLived.expires_in * 1000,
    userId: String(shortLived.user_id),
  };
}

async function refreshAccessToken(tokens: InstagramTokens): Promise<InstagramTokens> {
  const params = new URLSearchParams({ grant_type: "ig_refresh_token", access_token: tokens.accessToken });
  const res = await fetch(`https://graph.instagram.com/refresh_access_token?${params.toString()}`);
  if (!res.ok) throw new Error(`Instagram respondio ${res.status} al refrescar el token`);
  const data = await res.json();
  return { ...tokens, accessToken: data.access_token, expiresAt: Date.now() + data.expires_in * 1000 };
}

/**
 * Returns a valid access token for this artist, refreshing (and re-saving) it first if needed.
 * Instagram only allows refreshing tokens that are at least 24h old, so refresh proactively with
 * a 5-day buffer before the 60-day expiry rather than waiting until it's nearly expired.
 */
export async function getValidAccessToken(artistId: string): Promise<string | null> {
  const tokens = await getStoredTokens(artistId);
  if (!tokens) return null;
  const fiveDaysMs = 5 * 24 * 60 * 60 * 1000;
  if (Date.now() < tokens.expiresAt - fiveDaysMs) return tokens.accessToken;
  const refreshed = await refreshAccessToken(tokens);
  await saveTokens(artistId, refreshed);
  return refreshed.accessToken;
}
