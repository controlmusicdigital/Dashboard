import { NextResponse } from "next/server";
import { broadcastStatus } from "@/lib/broadcast";

export async function GET() {
  return NextResponse.json(broadcastStatus());
}
