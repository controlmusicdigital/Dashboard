export function formatCompact(n: number): string {
  return new Intl.NumberFormat("es-DO", { notation: "compact", maximumFractionDigits: 1 }).format(n);
}

export function formatInt(n: number): string {
  return new Intl.NumberFormat("es-DO").format(Math.round(n));
}

export function formatUSD(n: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}

export function formatPct(n: number): string {
  return `${n.toFixed(1)}%`;
}

export function formatDelta(n: number): string {
  const sign = n > 0 ? "+" : "";
  return `${sign}${n.toFixed(1)}%`;
}
