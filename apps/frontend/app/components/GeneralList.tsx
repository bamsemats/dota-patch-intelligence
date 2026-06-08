"use client";

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

interface GeneralSection {
  sectionName: string;
  changes: Change[];
}

interface GeneralListProps {
  sections: GeneralSection[];
}

export default function GeneralList({ sections }: GeneralListProps) {
  if (sections.length === 0) return null;

  return (
    <div className={styles.listContainer}>
      <h2>General Updates</h2>
      
      <div className={styles.grid}>
        {sections.map((section) => (
          <div key={section.sectionName} className={styles.card} style={{ gridColumn: "1 / -1" }}>
            <div className={styles.cardHeader}>
              <h3 style={{ margin: 0, color: "var(--color-secret-shop)", fontSize: "1.25rem" }}>
                {section.sectionName}
              </h3>
            </div>
            
            <div className={styles.changesList}>
              {section.changes.map((change, idx) => (
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
