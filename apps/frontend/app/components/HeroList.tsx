"use client";

import { useState } from "react";
import styles from "./EntityList.module.css";

type ChangeType = "Buff" | "Nerf" | "Rework" | "Adjustment";

interface Change {
  category: string;
  entityName: string;
  subEntityName?: string;
  rawNote: string;
  classification: {
    classificationType: ChangeType;
    confidenceScore: number;
    reasoning: string;
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

interface HeroData {
  heroName: string;
  changes: Change[];
  netScore: number;
  vectorDelta: FeatureVector | null;
}

interface HeroListProps {
  heroes: HeroData[];
}

export default function HeroList({ heroes }: HeroListProps) {
  const [filter, setFilter] = useState<"All" | "Buffed" | "Nerfed">("All");

  const filteredHeroes = heroes.filter((hero) => {
    if (filter === "Buffed") return hero.netScore > 0;
    if (filter === "Nerfed") return hero.netScore < 0;
    return true;
  });

  const getSignificantVectors = (vector: FeatureVector | null) => {
    if (!vector) return [];
    return Object.entries(vector)
      .filter(([_, val]) => val !== 0)
      .map(([dim, val]) => ({ dim: dim.charAt(0).toUpperCase() + dim.slice(1), val }));
  };

  return (
    <div className={styles.listContainer}>
      <h2>Hero Changes</h2>
      
      <div className={styles.controls}>
        <button 
          className={`${styles.filterBtn} ${filter === "All" ? styles.active : ""}`}
          onClick={() => setFilter("All")}
        >
          All Heroes
        </button>
        <button 
          className={`${styles.filterBtn} ${filter === "Buffed" ? styles.active : ""}`}
          onClick={() => setFilter("Buffed")}
        >
          Buffed Heroes
        </button>
        <button 
          className={`${styles.filterBtn} ${filter === "Nerfed" ? styles.active : ""}`}
          onClick={() => setFilter("Nerfed")}
        >
          Nerfed Heroes
        </button>
      </div>

      <div className={styles.grid}>
        {filteredHeroes.map((hero) => {
          const vectors = getSignificantVectors(hero.vectorDelta);
          return (
            <div key={hero.heroName} className={styles.card}>
              <div className={styles.cardHeader}>
                <h3 className={styles.heroName}>{hero.heroName}</h3>
                <span className={`${styles.netScore} ${hero.netScore > 0 ? styles.positive : hero.netScore < 0 ? styles.negative : styles.neutral}`}>
                  Score: {hero.netScore > 0 ? `+${hero.netScore}` : hero.netScore}
                </span>
              </div>
              
              <div className={styles.changesList}>
                {hero.changes.map((change, idx) => (
                  <div key={idx} className={`${styles.changeItem} ${styles[change.classification.classificationType]}`}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        {change.subEntityName && (
                          <span className={styles.subEntity}>{change.subEntityName}</span>
                        )}
                        <span className={styles.note}>{change.rawNote}</span>
                      </div>
                      {change.classification.strategicWeight && (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px' }}>
                          <span style={{ 
                            fontSize: '0.75rem', 
                            color: 'var(--color-rare)', 
                            background: 'rgba(26, 135, 249, 0.1)',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            marginLeft: '8px',
                            whiteSpace: 'nowrap',
                            fontWeight: 'bold'
                          }}>
                            Impact: {typeof change.classification.strategicWeight === 'object' 
                              ? change.classification.strategicWeight['Divine'] 
                              : change.classification.strategicWeight}
                          </span>
                          <span style={{ 
                            fontSize: '0.6rem', 
                            color: change.classification.state === 'UNKNOWN' ? '#888' : 'var(--color-common)',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px'
                          }}>
                            {change.classification.state}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {vectors.length > 0 && (
                <div className={styles.vectorContainer}>
                  {vectors.map((v, idx) => (
                    <span key={idx} className={`${styles.vectorBadge} ${v.val > 0 ? styles.pos : styles.neg}`}>
                      {v.dim} {v.val > 0 ? `+${v.val}` : v.val}
                    </span>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
