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

interface HeroData {
  heroName: string;
  changes: Change[];
  netScore: number;
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
        {filteredHeroes.map((hero) => (
          <div key={hero.heroName} className={styles.card}>
            <div className={styles.cardHeader}>
              <h3 className={styles.heroName}>{hero.heroName}</h3>
              <span className={`${styles.netScore} ${hero.netScore > 0 ? styles.positive : hero.netScore < 0 ? styles.negative : styles.neutral}`}>
                {hero.netScore > 0 ? `+${hero.netScore}` : hero.netScore}
              </span>
            </div>
            
            <div className={styles.changesList}>
              {hero.changes.map((change, idx) => (
                <div key={idx} className={`${styles.changeItem} ${styles[change.classification.classificationType]}`}>
                  {change.subEntityName && (
                    <span className={styles.subEntity}>{change.subEntityName}</span>
                  )}
                  <span className={styles.note}>{change.rawNote}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
