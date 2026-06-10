"use client";

import { useState } from "react";
import Link from "next/link";
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
    strategicWeight?: any;
    state?: string;
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
  winrateData?: any;
  heroMapping?: Record<string, string>;
}

export default function HeroList({ heroes }: HeroListProps) {
  const [filter, setFilter] = useState<"All" | "Buffed" | "Nerfed">("All");
  const [search, setSearch] = useState("");

  const filteredHeroes = heroes.filter((hero) => {
    const matchesSearch = hero.heroName.toLowerCase().includes(search.toLowerCase());
    if (!matchesSearch) return false;
    
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

  const getHeroSlug = (name: string) => {
    return name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  };

  return (
    <div className={styles.listContainer}>
      <h2>Hero Changes</h2>
      
      <div className={styles.controlsRow}>
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
            Buffed
          </button>
          <button 
            className={`${styles.filterBtn} ${filter === "Nerfed" ? styles.active : ""}`}
            onClick={() => setFilter("Nerfed")}
          >
            Nerfed
          </button>
        </div>

        <div className={styles.searchContainer}>
          <input 
            type="text" 
            placeholder="Search heroes..." 
            className={styles.searchInput}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className={styles.grid}>
        {filteredHeroes.map((hero) => {
          const vectors = getSignificantVectors(hero.vectorDelta);
          return (
            <Link 
              key={hero.heroName} 
              href={`/hero/${getHeroSlug(hero.heroName)}`}
              className={`${styles.card} ${styles.clickable}`}
              style={{ textDecoration: 'none', color: 'inherit' }}
            >
              <div className={styles.cardHeader}>
                <h3 className={styles.heroName}>{hero.heroName}</h3>
                <span className={`${styles.netScore} ${hero.netScore > 0 ? styles.positive : hero.netScore < 0 ? styles.negative : styles.neutral}`}>
                  Score: {hero.netScore > 0 ? `+${hero.netScore}` : hero.netScore}
                </span>
              </div>
              
              <div className={styles.changesList}>
                {hero.changes.slice(0, 3).map((change, idx) => (
                  <div key={idx} className={`${styles.changeItem} ${styles[change.classification.classificationType]}`}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div className={styles.noteTruncate}>
                        {change.subEntityName && (
                          <span className={styles.subEntity}>{change.subEntityName}</span>
                        )}
                        <span className={styles.note}>{change.rawNote}</span>
                      </div>
                    </div>
                  </div>
                ))}
                {hero.changes.length > 3 && (
                  <div className={styles.moreChanges}>
                    + {hero.changes.length - 3} more changes...
                  </div>
                )}
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
            </Link>
          );
        })}
      </div>
    </div>
  );
}
