"use client";

import { useEffect, useState } from "react";

export function ThemeToggle() {
  const [light, setLight] = useState(false);

  useEffect(() => {
    // Reads the persisted choice once on mount; defaulting to dark (the brand
    // theme) for the SSR/first-paint render avoids a hydration mismatch.
    const stored = window.localStorage.getItem("cmd-theme");
    const isLight = stored === "light";
    document.documentElement.dataset.theme = isLight ? "light" : "dark";
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time sync from localStorage, unreadable during SSR
    if (isLight) setLight(true);
  }, []);

  function toggle() {
    const next = !light;
    setLight(next);
    document.documentElement.dataset.theme = next ? "light" : "dark";
    window.localStorage.setItem("cmd-theme", next ? "light" : "dark");
  }

  return (
    <button
      onClick={toggle}
      className="rounded-full px-3 py-1.5 text-xs font-medium transition-colors"
      style={{ border: "1px solid var(--border-hairline)", color: "var(--text-secondary)" }}
    >
      {light ? "Modo oscuro" : "Modo claro"}
    </button>
  );
}
