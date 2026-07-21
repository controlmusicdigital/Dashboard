import { NextResponse } from "next/server";
import { fetchAllNews } from "@/lib/news-fetch";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET() {
  const result = await fetchAllNews();
  return NextResponse.json(result);
}
