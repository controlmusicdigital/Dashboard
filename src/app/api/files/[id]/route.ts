import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import { Readable } from "stream";
import { deleteFile, getFile } from "@/lib/file-store";

export const runtime = "nodejs";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const found = getFile(id);
  if (!found) {
    return NextResponse.json({ error: "Archivo no encontrado" }, { status: 404 });
  }
  const { meta, filePath } = found;
  const nodeStream = fs.createReadStream(filePath);
  const webStream = Readable.toWeb(nodeStream) as ReadableStream;

  return new NextResponse(webStream, {
    headers: {
      "Content-Type": meta.mimeType,
      "Content-Length": String(meta.size),
      "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(meta.filename)}`,
    },
  });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ok = deleteFile(id);
  if (!ok) return NextResponse.json({ error: "Archivo no encontrado" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
