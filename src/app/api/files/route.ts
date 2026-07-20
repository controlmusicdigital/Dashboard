import { NextRequest, NextResponse } from "next/server";
import { listFiles, saveFile } from "@/lib/file-store";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function GET() {
  return NextResponse.json({ files: listFiles() });
}

export async function POST(req: NextRequest) {
  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  const uploadedBy = (form?.get("uploadedBy") as string | null)?.trim() || "Alguien del equipo";

  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "No se recibio ningun archivo" }, { status: 400 });
  }

  const meta = await saveFile(file, uploadedBy);
  return NextResponse.json({ file: meta });
}
