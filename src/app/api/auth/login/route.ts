import { NextRequest, NextResponse } from "next/server";
import { createSessionToken, getAdminPassword, getArtistPassword, SESSION_COOKIE } from "@/lib/auth";
import { getArtist } from "@/lib/artists";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const role = body?.role as string | undefined;
  const password = body?.password as string | undefined;
  const artistId = body?.artistId as string | undefined;

  if (!password) {
    return NextResponse.json({ error: "Falta la contrasena" }, { status: 400 });
  }

  if (role === "admin") {
    const adminPassword = getAdminPassword();
    if (!adminPassword) {
      return NextResponse.json({ error: "El acceso de administrador no esta configurado todavia" }, { status: 503 });
    }
    if (password !== adminPassword) {
      return NextResponse.json({ error: "Contrasena incorrecta" }, { status: 401 });
    }
    const res = NextResponse.json({ ok: true, session: { role: "admin" } });
    res.cookies.set(SESSION_COOKIE, createSessionToken({ role: "admin" }), {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
    return res;
  }

  if (role === "artist") {
    const artist = artistId ? getArtist(artistId) : undefined;
    if (!artist) return NextResponse.json({ error: "Selecciona un artista valido" }, { status: 400 });
    const artistPassword = getArtistPassword(artist.id);
    if (!artistPassword) {
      return NextResponse.json({ error: `El acceso de ${artist.name} no esta configurado todavia` }, { status: 503 });
    }
    if (password !== artistPassword) {
      return NextResponse.json({ error: "Contrasena incorrecta" }, { status: 401 });
    }
    const res = NextResponse.json({ ok: true, session: { role: "artist", artistId: artist.id, artistName: artist.name } });
    res.cookies.set(SESSION_COOKIE, createSessionToken({ role: "artist", artistId: artist.id }), {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
    return res;
  }

  return NextResponse.json({ error: "Rol invalido" }, { status: 400 });
}
