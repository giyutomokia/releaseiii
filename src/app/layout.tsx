import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Release Brief Assistant",
  description: "AI-assisted release readiness and communication workspace"
};

export default function RootLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}