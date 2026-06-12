"use client";

import { useRouter, usePathname } from "next/navigation";
import styles from "./EntityList.module.css";

interface PatchSelectorProps {
  availablePatches: string[];
  currentPatch: string;
}

export default function PatchSelector({ availablePatches, currentPatch }: PatchSelectorProps) {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
      <label htmlFor="patch-select" style={{ fontWeight: 'bold', color: 'var(--color-rare)' }}>Select Patch:</label>
      <select 
        id="patch-select" 
        value={currentPatch}
        onChange={(e) => {
          const val = e.target.value;
          
          // Check if we are currently on the 'full-notes' view
          const isFullNotes = pathname.endsWith('/full-notes');
          const suffix = isFullNotes ? '/full-notes' : '';

          if (val === availablePatches[0]) {
            router.push(`/${suffix}`);
          } else {
            router.push(`/patch/${val}${suffix}`);
          }
        }}
        style={{ 
          background: 'var(--bg-panel)', 
          color: 'var(--text-color)', 
          border: '1px solid var(--border-color)',
          padding: '8px 12px',
          borderRadius: '6px',
          cursor: 'pointer',
          fontSize: '1rem'
        }}
      >
        {availablePatches.map(v => (
          <option key={v} value={v}>{v}</option>
        ))}
      </select>
    </div>
  );
}
