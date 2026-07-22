import { NextRequest, NextResponse } from "next/server";
import { listFiles, registerFile } from "@/lib/file-store";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({ files: await listFiles() });
}

// Called by the client right after a direct browser-to-Blob upload finishes, to record the
// file's metadata (the bytes themselves already live in Vercel Blob at this point).
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const { blobUrl, blobPathname, filename, mimeType, size, uploadedBy } = body ?? {};

  if (!blobUrl || !blobPathname || !filename) {
    return NextResponse.json({ error: "Faltan datos del archivo subido" }, { status: 400 });
  }

  const meta = await registerFile({
    filename: String(filename),
    blobUrl: String(blobUrl),
    blobPathname: String(blobPathname),
    mimeType: typeof mimeType === "string" && mimeType ? mimeType : "application/octet-stream",
    size: Number(size) || 0,
    uploadedBy: typeof uploadedBy === "string" && uploadedBy.trim() ? uploadedBy.trim() : "Alguien del equipo",
  });
  return NextResponse.json({ file: meta });
}
