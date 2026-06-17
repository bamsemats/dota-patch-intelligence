"use client";

import styles from "./HeroDetailModal.module.css";

interface Change {
  category: string;
  entityName: string;
  subEntityName?: string;
  rawNote: string;
  classification: {
    classificationType: string;
    confidenceScore: number;
    reasoning: string;
    strategicWeight?: any;
  };
}

interface FeatureVector {
  farming: number;
  mobility: number;
  survivability: number;
  teamfight: number;
  laning: number;
  siege: number;
  utility: number;
}

interface WinrateData {
  [rank: string]: {
    [heroId: string]: {
      winrate: number;
      matchCount: number;
    };
  };
}

interface HeroDetailModalProps {
  heroName: string;
  heroId: string | null;
  changes: Change[];
  netScore: number;
  vectorDelta: FeatureVector | null;
  winrateData: WinrateData | null;
  onClose: () => void;
}

const RANKS = ["HERALD", "GUARDIAN", "CRUSADER", "ARCHON", "LEGEND", "ANCIENT", "DIVINE", "IMMORTAL"];

export default function HeroDetailModal({ 
  heroName, 
  heroId, 
  changes, 
  netScore, 
  vectorDelta, 
  winrateData, 
  onClose 
}: HeroDetailModalProps) {
  
  const getWinrateForRank = (rank: string) => {
    if (!winrateData || !winrateData[rank] || !heroId || !winrateData[rank][heroId]) return null;
    return winrateData[rank][heroId].winrate;
  };

  const getVectorColor = (val: number) => {
    if (val > 0) return "var(--color-buff)";
    if (val < 0) return "var(--color-nerf)";
    return "var(--color-common)";
  };

  const getImageUrl = (name: string) => {
    let slug = name.replace(/ /g, '_').replace(/[^a-zA-Z0-9_]/g, '').toLowerCase();
    
    if (slug === "natures_prophet") slug = "furion";
    if (slug === "outworld_destroyer") slug = "obsidian_destroyer";
    if (slug === "vengeful_spirit") slug = "vengefulspirit";
    if (slug === "anti_mage" || slug === "antimage") slug = "antimage";
    if (slug === "centaur_warrunner") slug = "centaur";
    if (slug === "clockwerk") slug = "rattletrap";
    if (slug === "doom") slug = "doom_bringer";
    if (slug === "io") slug = "wisp";
    if (slug === "lifestealer") slug = "life_stealer";
    if (slug === "magnus") slug = "magnataur";
    if (slug === "necrophos") slug = "necrolyte";
    if (slug === "queen_of_pain") slug = "queenofpain";
    if (slug === "shadow_fiend") slug = "nevermore";
    if (slug === "treant_protector") slug = "treant";
    if (slug === "underlord") slug = "abyssal_underlord";
    if (slug === "wraith_king") slug = "skeleton_king";
    if (slug === "zeus") slug = "zuus";

    return `https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/heroes/${slug}.png`;
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.heroImageWrapper}>
          <img 
            src={getImageUrl(heroName)} 
            alt="" 
            className={styles.heroImage} 
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
          />
        </div>
        <button className={styles.closeBtn} onClick={onClose}>&times;</button>
        
        <div className={styles.header} style={{ position: 'relative', zIndex: 1 }}>
          <h2 className={styles.title}>{heroName}</h2>
          <div className={`${styles.netScore} ${netScore > 0 ? styles.positive : netScore < 0 ? styles.negative : styles.neutral}`}>
            Strategic Impact Score: {netScore > 0 ? `+${netScore}` : netScore}
          </div>
        </div>

        <div className={styles.content} style={{ position: 'relative', zIndex: 1 }}>
          <div className={styles.section}>
            <h3>Patch Changes</h3>
            <div className={styles.changesList}>
              {changes.map((change, idx) => (
                <div key={idx} className={`${styles.changeItem} ${styles[change.classification.classificationType]}`}>
                  {change.subEntityName && <div className={styles.subEntity}>{change.subEntityName}</div>}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div className={styles.note}>{change.rawNote}</div>
                    {/* @ts-ignore - Assuming state exists in data even if missing from interface */}
                    {change.classification.state === "PARTIALLY_CLASSIFIED" && (
                      <span style={{
                        fontSize: '0.6rem',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        background: 'rgba(255, 255, 255, 0.1)',
                        color: '#ddd',
                        border: '1px solid #666',
                        fontWeight: 'bold',
                        whiteSpace: 'nowrap'
                      }}>
                        SYSTEM ESTIMATE
                      </span>
                    )}
                  </div>
                  <div className={styles.reasoning}>
                    <strong>Reasoning:</strong> {change.classification.reasoning}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className={styles.sidebar}>
            <div className={styles.section}>
              <h3>Feature Vector Shifts</h3>
              <div className={styles.vectorGrid}>
                {vectorDelta && Object.entries(vectorDelta).map(([dim, val]) => (
                  <div key={dim} className={styles.vectorRow}>
                    <span className={styles.dimName}>{dim.charAt(0).toUpperCase() + dim.slice(1)}</span>
                    <div className={styles.barContainer}>
                      <div 
                        className={styles.bar} 
                        style={{ 
                          width: `${Math.min(Math.abs(val) * 5, 100)}%`, 
                          backgroundColor: getVectorColor(val),
                          marginLeft: val < 0 ? 'auto' : '0',
                          marginRight: val > 0 ? 'auto' : '0'
                        }}
                      />
                    </div>
                    <span className={styles.dimVal} style={{ color: getVectorColor(val) }}>
                      {val > 0 ? `+${val}` : val}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className={styles.section}>
              <h3>Winrate by Rank</h3>
              <div className={styles.histogram}>
                {RANKS.map(rank => {
                  const wr = getWinrateForRank(rank);
                  const percent = wr ? (wr * 100).toFixed(1) : "N/A";
                  const height = wr ? (wr - 0.4) * 500 : 0; // Normalize around 50%
                  
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
                  <span key={rank} style={{ fontSize: '0.7rem', color: '#888' }}>{rank.charAt(0)}={rank} </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
