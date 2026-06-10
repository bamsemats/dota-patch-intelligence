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

interface ItemData {
  itemName: string;
  itemType?: string;
  changes: Change[];
  netScore: number;
}

interface ItemListProps {
  title: string;
  items: ItemData[];
}

export default function ItemList({ title, items }: ItemListProps) {
  const [filter, setFilter] = useState<"All" | "Buffed" | "Nerfed">("All");

  const filteredItems = items.filter((item) => {
    if (filter === "Buffed") return item.netScore > 0;
    if (filter === "Nerfed") return item.netScore < 0;
    return true;
  });

  return (
    <div className={styles.listContainer}>
      <h2>{title}</h2>
      
      <div className={styles.controls}>
        <button 
          className={`${styles.filterBtn} ${filter === "All" ? styles.active : ""}`}
          onClick={() => setFilter("All")}
        >
          All Items
        </button>
        <button 
          className={`${styles.filterBtn} ${filter === "Buffed" ? styles.active : ""}`}
          onClick={() => setFilter("Buffed")}
        >
          Buffed Items
        </button>
        <button 
          className={`${styles.filterBtn} ${filter === "Nerfed" ? styles.active : ""}`}
          onClick={() => setFilter("Nerfed")}
        >
          Nerfed Items
        </button>
      </div>

      <div className={styles.grid}>
        {filteredItems.map((item) => (
          <div key={item.itemName} className={styles.card}>
            <div className={styles.cardHeader}>
              <div>
                <h3 className={styles.itemName}>{item.itemName}</h3>
                {item.itemType && (
                  <span style={{ fontSize: "0.85rem", color: "#888", display: "block", marginTop: "4px" }}>
                    {item.itemType}
                  </span>
                )}
              </div>
              <span className={`${styles.netScore} ${item.netScore > 0 ? styles.positive : item.netScore < 0 ? styles.negative : styles.neutral}`}>
                Score: {item.netScore > 0 ? `+${item.netScore}` : item.netScore}
              </span>
            </div>
            
            <div className={styles.changesList}>
              {item.changes.map((change, idx) => (
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
          </div>
        ))}
      </div>
    </div>
  );
}
