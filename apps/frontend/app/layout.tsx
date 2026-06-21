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
  title: {
    default: "Dota 2 Patch Intelligence",
    template: "%s | Dota 2 Patch Intelligence"
  },
  description: "Advanced contextual analytics for Dota 2 patch notes. Tracking meta shifts and hero trajectories since 7.33.",
  openGraph: {
    title: "Dota 2 Patch Intelligence",
    description: "Advanced contextual analytics for Dota 2 patch notes. Tracking meta shifts and hero trajectories since 7.33.",
    url: "https://bamsemats.github.io/dota-patch-intelligence",
    siteName: "Dota Patch Intelligence",
    images: [
      {
        url: "/og-cover.png", // Assuming this is in the public folder
        width: 1200,
        height: 630,
        alt: "Dota 2 Patch Intelligence Cover",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Dota 2 Patch Intelligence",
    description: "Advanced contextual analytics for Dota 2 patch notes. Tracking meta shifts and hero trajectories since 7.33.",
    images: ["/og-cover.png"],
  },
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
