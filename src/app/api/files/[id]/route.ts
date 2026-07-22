import { NextRequest, NextResponse } from "next/server";
import { del } from "@vercel/blob";
import { deleteFileRecord, getFileMeta } from "@/lib/file-store";

export const runtime = "nodejs";

// A stable link under our own domain (the one meant to be shared with the team) that redirects
// to the real Blob URL — the file itself is never proxied through this function, so downloading
// a big file doesn't hit any serverless size/timeout limits either.
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const meta = await getFileMeta(id);
  if (!meta) {
    return NextResponse.json({ error: "Archivo no encontrado" }, { status: 404 });
  }
  return NextResponse.redirect(meta.blobUrl);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const meta = await deleteFileRecord(id);
  if (!meta) return NextResponse.json({ error: "Archivo no encontrado" }, { status: 404 });
  await del(meta.blobUrl);
  return NextResponse.json({ ok: true });
}
