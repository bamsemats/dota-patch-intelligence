"use client";

import { useState } from "react";
import styles from "../../components/HeroDetailModal.module.css";

interface WinrateData {
  winrate: number;
  matchCount: number;
  isHistorical?: boolean;
}

interface PatchHistory {
  version: string;
  winrates: Record<string, WinrateData>;
}

interface WinrateHistorySelectorProps {
  history: PatchHistory[];
}

const RANKS = ["HERALD", "GUARDIAN", "CRUSADER", "ARCHON", "LEGEND", "ANCIENT", "DIVINE"];

export default function WinrateHistorySelector({ history }: WinrateHistorySelectorProps) {
  const [selectedVersion, setSelectedVersion] = useState(history[history.length - 1]?.version);

  const selectedPatch = history.find(h => h.version === selectedVersion) || history[history.length - 1];

  // Check if this patch uses the PROFESSIONAL historical baseline
  const isProfessional = selectedPatch?.winrates["PROFESSIONAL"] !== undefined;

  return (
    <div className={styles.section}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
        <h3 style={{ color: 'var(--color-rare)', margin: 0 }}>
          {isProfessional ? "Pro Winrate Baseline" : "Winrate by Rank"}
        </h3>
        <select 
          value={selectedVersion} 
          onChange={(e) => setSelectedVersion(e.target.value)}
          style={{
            background: 'var(--bg-panel)',
            color: 'var(--text-color)',
            border: '1px solid var(--border-color)',
            borderRadius: '4px',
            padding: '4px 8px',
            fontSize: '0.85rem'
          }}
        >
          {history.slice().reverse().map(patch => (
            <option key={patch.version} value={patch.version}>
              Patch {patch.version}
            </option>
          ))}
        </select>
      </div>

      <div style={{ background: 'var(--bg-panel)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
        {isProfessional ? (
          <div style={{ textAlign: 'center', padding: '10px 0' }}>
            <div style={{ fontSize: '3rem', fontWeight: 'bold', color: (selectedPatch.winrates["PROFESSIONAL"].winrate > 0.5 ? 'var(--color-buff)' : 'var(--color-nerf)') }}>
              {(selectedPatch.winrates["PROFESSIONAL"].winrate * 100).toFixed(1)}%
            </div>
            <div style={{ color: '#888', fontSize: '0.9rem', marginTop: '5px' }}>
              Aggregate Professional Baseline
            </div>
            <div style={{ color: '#666', fontSize: '0.75rem', marginTop: '10px', fontStyle: 'italic' }}>
              Tiered data unavailable for this historical patch.
            </div>
          </div>
        ) : (
          <>
            <div className={styles.histogram}>
              {RANKS.map(rank => {
                const wrData = selectedPatch?.winrates[rank];
                const wr = wrData ? wrData.winrate : null;
                const percent = wr ? (wr * 100).toFixed(1) : "N/A";
                const height = wr ? (wr - 0.4) * 500 : 0;
                
                return (
                  <div key={rank} className={styles.histCol}>
                    <div className={styles.histBarContainer}>
                      {wr && (
                        <div 
                          className={styles.histBar} 
                          style={{ height: `${Math.max(height, 5)}%`, backgroundColor: wr > 0.5 ? 'var(--color-buff)' : 'var(--color-nerf)' }}
                        >
                          <span className={styles.histVal}>{percent}%</span>
                        </div>
                      )}
                    </div>
                    <span className={styles.rankLabel}>{rank.charAt(0)}</span>
                  </div>
                );
              })}
            </div>
            <div className={styles.rankLegend}>
              {RANKS.map(rank => (
                <span key={rank} style={{ fontSize: '0.65rem', color: '#666' }}>{rank.charAt(0)}={rank} </span>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
