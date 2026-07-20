import { NextResponse } from "next/server";
import { fetchIndustryNews } from "@/lib/claude/news";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET() {
  const result = await fetchIndustryNews();
  return NextResponse.json(result);
}
