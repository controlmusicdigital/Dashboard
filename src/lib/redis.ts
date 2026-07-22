import "server-only";
import { Redis } from "@upstash/redis";

let client: Redis | null = null;

// Shared Upstash Redis client (Vercel Marketplace integration) — used for OAuth token storage
// (YouTube/Instagram/TikTok) and the shared-files index.
export function getRedis(): Redis {
  if (!client) {
    const url = process.env.KV_REST_API_URL;
    const token = process.env.KV_REST_API_TOKEN;
    if (!url || !token) throw new Error("KV_REST_API_URL / KV_REST_API_TOKEN no estan configuradas");
    client = new Redis({ url, token });
  }
  return client;
}
