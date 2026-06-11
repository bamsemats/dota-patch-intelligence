import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import TopNav from "./components/TopNav";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://bamsemats.github.io/dota-patch-intelligence'),
  title: "Dota 2 Patch Intelligence",
  description: "Advanced contextual analytics for Dota 2 patch notes.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body>
        <TopNav />
        {children}
      </body>
    </html>
  );
}
