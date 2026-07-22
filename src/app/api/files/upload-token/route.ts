import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

// Mints a short-lived, single-upload token so the file goes straight from the browser to Vercel
// Blob storage — it never passes through this (or any) serverless function, which is what lets
// big files (well past the ~4.5MB request-body limit) upload at all.
export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => ({
        access: "public",
        addRandomSuffix: true,
      }),
      onUploadCompleted: async () => {
        // Metadata is registered explicitly by the client right after upload() resolves
        // (src/components/FileShare.tsx) instead of relying on this webhook, since it requires a
        // publicly reachable callback URL that isn't available during local development.
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400 });
  }
}
