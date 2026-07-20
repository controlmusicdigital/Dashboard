import "server-only";
import fs from "fs";
import path from "path";
import crypto from "crypto";

const ROOT = '/tmp/youtube-tokens';
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

function ensureDir() {
  fs.mkdirSync(ROOT, { recursive: true });
}

function tokenPath(artistId: string): string {
  return path.join(ROOT, `${artistId}.json`);
}

export function getStoredTokens(artistId: string): YouTubeTokens | null {
  try {
    return JSON.parse(fs.readFileSync(tokenPath(artistId), "utf8")) as YouTubeTokens;
  } catch {
    return null;
  }
}

export function saveTokens(artistId: string, tokens: YouTubeTokens) {
  ensureDir();
  fs.writeFileSync(tokenPath(artistId), JSON.stringify(tokens, null, 2));
}

export function deleteTokens(artistId: string) {
  fs.rmSync(tokenPath(artistId), { force: true });
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

async function refreshAccessToken(artistId: string, tokens: YouTubeTokens): Promise<YouTubeTokens> {
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
  const next: YouTubeTokens = {
    ...tokens,
    accessToken: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  };
  saveTokens(artistId, next);
  return next;
}

/** Returns a valid access token for this artist, refreshing it first if needed. */
export async function getValidAccessToken(artistId: string): Promise<string | null> {
  const tokens = getStoredTokens(artistId);
  if (!tokens) return null;
  if (Date.now() < tokens.expiresAt - 60_000) return tokens.accessToken;
  const refreshed = await refreshAccessToken(artistId, tokens);
  return refreshed.accessToken;
}
