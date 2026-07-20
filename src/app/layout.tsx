import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Control Music Digital | Panel de artistas",
  description: "Panel de metricas para Pacheman, Max y El Real Soprano — Control Music Digital, Republica Dominicana.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
