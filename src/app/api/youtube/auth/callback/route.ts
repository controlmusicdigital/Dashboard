import { NextRequest, NextResponse } from "next/server";
import { exchangeCodeForTokens, setTokensCookie, verifyOAuthState } from "@/lib/youtube-auth";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  const error = req.nextUrl.searchParams.get("error");
  const origin = req.nextUrl.origin;

  if (error) {
    return NextResponse.redirect(`${origin}/?youtube_error=${encodeURIComponent(error)}`);
  }

  const verified = verifyOAuthState(state);
  if (!verified || !code) {
    return NextResponse.redirect(`${origin}/?youtube_error=estado_invalido`);
  }

  try {
    const redirectUri = `${origin}/api/youtube/auth/callback`;
    const tokens = await exchangeCodeForTokens(code, redirectUri);
    const res = NextResponse.redirect(`${origin}/?youtube_connected=${verified.artistId}`);
    setTokensCookie(res, verified.artistId, tokens);
    return res;
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err);
    return NextResponse.redirect(`${origin}/?youtube_error=${encodeURIComponent(reason)}`);
  }
}
