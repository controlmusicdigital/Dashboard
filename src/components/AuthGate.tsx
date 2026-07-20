"use client";

import { useEffect, useState } from "react";
import { Dashboard } from "./Dashboard";
import { LoginScreen } from "./LoginScreen";
import { STATIC_DEMO } from "@/lib/static-demo";

export type ClientSession = { role: "admin" } | { role: "artist"; artistId: string; artistName?: string };

export function AuthGate() {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<ClientSession | null>(null);
  const [authConfigured, setAuthConfigured] = useState(false);

  async function refresh() {
    if (STATIC_DEMO) {
      setLoading(false);
      return;
    }
    try {
      const res = await fetch("/api/auth/me");
      const data = await res.json();
      setSession(data.session);
      setAuthConfigured(Boolean(data.authConfigured));
    } catch {
      setAuthConfigured(false);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial session fetch-on-mount
    refresh();
  }, []);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setSession(null);
  }

  if (loading) return null;

  if (authConfigured && !session) {
    return <LoginScreen onLoggedIn={refresh} />;
  }

  return <Dashboard session={session} onLogout={authConfigured ? handleLogout : undefined} />;
}
