import "server-only";

export function dataUrlToBlob(dataUrl: string, mimeType: string): Blob {
  const base64 = dataUrl.split(",")[1] ?? "";
  const buffer = Buffer.from(base64, "base64");
  return new Blob([buffer], { type: mimeType });
}
