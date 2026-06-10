import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
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
        <nav style={{ 
          background: 'var(--bg-panel)', 
          borderBottom: '1px solid var(--border-color)', 
          padding: '15px 0',
          marginBottom: '30px',
          position: 'sticky',
          top: 0,
          zIndex: 100
        }}>
          <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--color-artifact)' }}>Dota Patch Intelligence</span>
            </Link>
            <div style={{ display: 'flex', gap: '20px' }}>
              <Link href="/" style={{ color: 'var(--text-color)', textDecoration: 'none', fontWeight: 600 }}>Home</Link>
              <Link href="/search" style={{ color: 'var(--text-color)', textDecoration: 'none', fontWeight: 600 }}>Global Search</Link>
            </div>
          </div>
        </nav>
        {children}
      </body>
    </html>
  );
}
