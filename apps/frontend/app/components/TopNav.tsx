"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function TopNav() {
  const pathname = usePathname();
  
  // Extract patch version if we are on a patch page (e.g., /patch/7.41d or /patch/7.41d/full-notes)
  const patchMatch = pathname.match(/^\/patch\/([^\/]+)/);
  const patchVersion = patchMatch ? patchMatch[1] : null;

  // If we are viewing a specific patch, link to its tabs. Otherwise, default to the latest root.
  const summaryHref = patchVersion ? `/patch/${patchVersion}` : "/";
  const notesHref = patchVersion ? `/patch/${patchVersion}/full-notes` : "/full-notes";

  const isSummaryActive = pathname === summaryHref || pathname === '/';
  const isNotesActive = pathname.includes('/full-notes');
  const isSearchActive = pathname.includes('/search');

  return (
    <nav style={{ 
      background: 'var(--bg-panel)', 
      borderBottom: '1px solid var(--border-color)', 
      padding: '15px 0',
      marginBottom: '30px',
      position: 'sticky',
      top: 0,
      zIndex: 100
    }}>
      <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
        <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--color-artifact)' }}>Dota Patch Intelligence</span>
        </Link>
        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
          <Link href={summaryHref} style={{ 
            color: isSummaryActive ? 'var(--color-buff)' : 'var(--text-color)', 
            textDecoration: 'none', 
            fontWeight: 600,
            borderBottom: isSummaryActive ? '2px solid var(--color-buff)' : '2px solid transparent',
            paddingBottom: '4px'
          }}>
            Strategic Summary
          </Link>
          <Link href={notesHref} style={{ 
            color: isNotesActive ? 'var(--color-buff)' : 'var(--text-color)', 
            textDecoration: 'none', 
            fontWeight: 600,
            borderBottom: isNotesActive ? '2px solid var(--color-buff)' : '2px solid transparent',
            paddingBottom: '4px'
          }}>
            Full Patch Notes
          </Link>
          <Link href="/search" style={{ 
            color: isSearchActive ? 'var(--color-buff)' : 'var(--text-color)', 
            textDecoration: 'none', 
            fontWeight: 600,
            borderBottom: isSearchActive ? '2px solid var(--color-buff)' : '2px solid transparent',
            paddingBottom: '4px'
          }}>
            Global Search
          </Link>
        </div>
      </div>
    </nav>
  );
}
