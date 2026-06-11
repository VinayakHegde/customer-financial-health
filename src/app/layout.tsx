import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Customer Financial Health",
  description:
    "A calm view of your monthly income, outgoings, and what's left over — not financial advice.",
};

/**
 * App-root layout. Provides the `<html>` / `<body>` shell, fonts, and global
 * metadata for both route groups — `(main)` (persona-aware app surfaces) and
 * `(share)` (recipient-facing share surfaces).
 *
 * `<AppHeader />` lives in `(main)/layout.tsx`, NOT here, so the `(share)`
 * group renders without persona-aware navigation by construction (per
 * tech-spec §S11 F1.8 — route-group / layout separation is the only
 * acceptable enforcement shape; conditional-render-inside-`<AppHeader />`
 * was rejected because it leaves a behavioural seam).
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-canvas text-foreground font-sans">
        {children}
      </body>
    </html>
  );
}
