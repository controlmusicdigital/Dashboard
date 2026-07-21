import { NextRequest, NextResponse } from "next/server";
import { exchangeCodeForTokens, saveTokens, verifyOAuthState } from "@/lib/instagram-auth";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  const error = req.nextUrl.searchParams.get("error_reason") || req.nextUrl.searchParams.get("error");
  const origin = req.nextUrl.origin;

  if (error) {
    return NextResponse.redirect(`${origin}/?instagram_error=${encodeURIComponent(error)}`);
  }

  const verified = verifyOAuthState(state);
  if (!verified || !code) {
    return NextResponse.redirect(`${origin}/?instagram_error=estado_invalido`);
  }

  try {
    const redirectUri = `${origin}/api/instagram/auth/callback`;
    const tokens = await exchangeCodeForTokens(code, redirectUri);
    await saveTokens(verified.artistId, tokens);
    return NextResponse.redirect(`${origin}/?instagram_connected=${verified.artistId}`);
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err);
    return NextResponse.redirect(`${origin}/?instagram_error=${encodeURIComponent(reason)}`);
  }
}
