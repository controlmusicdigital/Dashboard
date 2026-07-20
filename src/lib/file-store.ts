import "server-only";
import fs from "fs";
import path from "path";
import crypto from "crypto";

export interface FileMeta {
  id: string;
  filename: string;
  mimeType: string;
  size: number;
  uploadedBy: string;
  uploadedAt: string;
}

const ROOT = path.join(process.cwd(), ".data", "shared-files");
const INDEX_PATH = path.join(ROOT, "_index.json");

function ensureDir() {
  fs.mkdirSync(ROOT, { recursive: true });
}

function readIndex(): FileMeta[] {
  ensureDir();
  try {
    return JSON.parse(fs.readFileSync(INDEX_PATH, "utf8")) as FileMeta[];
  } catch {
    return [];
  }
}

function writeIndex(list: FileMeta[]) {
  ensureDir();
  fs.writeFileSync(INDEX_PATH, JSON.stringify(list, null, 2));
}

function blobPath(id: string): string {
  return path.join(ROOT, id);
}

export function listFiles(): FileMeta[] {
  return readIndex().sort((a, b) => (a.uploadedAt < b.uploadedAt ? 1 : -1));
}

export async function saveFile(file: File, uploadedBy: string): Promise<FileMeta> {
  ensureDir();
  const id = crypto.randomUUID();
  const filename = path.basename(file.name || "archivo");
  const buffer = Buffer.from(await file.arrayBuffer());
  fs.writeFileSync(blobPath(id), buffer);

  const meta: FileMeta = {
    id,
    filename,
    mimeType: file.type || "application/octet-stream",
    size: buffer.byteLength,
    uploadedBy,
    uploadedAt: new Date().toISOString(),
  };
  const list = readIndex();
  list.push(meta);
  writeIndex(list);
  return meta;
}

export function getFile(id: string): { meta: FileMeta; filePath: string } | null {
  const meta = readIndex().find((f) => f.id === id);
  if (!meta) return null;
  const filePath = blobPath(id);
  if (!fs.existsSync(filePath)) return null;
  return { meta, filePath };
}

export function deleteFile(id: string): boolean {
  const list = readIndex();
  const idx = list.findIndex((f) => f.id === id);
  if (idx === -1) return false;
  const filePath = blobPath(list[idx].id);
  fs.rmSync(filePath, { force: true });
  list.splice(idx, 1);
  writeIndex(list);
  return true;
}
