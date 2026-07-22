import "server-only";
import crypto from "crypto";
import { getRedis } from "./redis";

export interface FileMeta {
  id: string;
  filename: string;
  blobUrl: string;
  blobPathname: string;
  mimeType: string;
  size: number;
  uploadedBy: string;
  uploadedAt: string;
}

const INDEX_KEY = "shared-files:index";

function fileKey(id: string): string {
  return `shared-files:file:${id}`;
}

export async function listFiles(): Promise<FileMeta[]> {
  const redis = getRedis();
  const ids = (await redis.lrange<string>(INDEX_KEY, 0, -1)) ?? [];
  if (ids.length === 0) return [];
  const metas = await Promise.all(ids.map((id) => redis.get<FileMeta>(fileKey(id))));
  return metas.filter((m): m is FileMeta => m !== null).sort((a, b) => (a.uploadedAt < b.uploadedAt ? 1 : -1));
}

export async function registerFile(input: Omit<FileMeta, "id" | "uploadedAt">): Promise<FileMeta> {
  const redis = getRedis();
  const meta: FileMeta = { ...input, id: crypto.randomUUID(), uploadedAt: new Date().toISOString() };
  await redis.set(fileKey(meta.id), meta);
  await redis.lpush(INDEX_KEY, meta.id);
  return meta;
}

export async function getFileMeta(id: string): Promise<FileMeta | null> {
  return (await getRedis().get<FileMeta>(fileKey(id))) ?? null;
}

export async function deleteFileRecord(id: string): Promise<FileMeta | null> {
  const redis = getRedis();
  const meta = await getFileMeta(id);
  if (!meta) return null;
  await redis.del(fileKey(id));
  await redis.lrem(INDEX_KEY, 0, id);
  return meta;
}
