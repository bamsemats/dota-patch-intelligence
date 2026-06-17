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
  const [search, setSearch] = useState("");

  const filteredItems = items.filter((item) => {
    const matchesSearch = item.itemName.toLowerCase().includes(search.toLowerCase());
    if (!matchesSearch) return false;

    if (filter === "Buffed") return item.netScore > 0;
    if (filter === "Nerfed") return item.netScore < 0;
    return true;
  });

  const getItemImageUrl = (name: string) => {
    let slug = name.replace(/ /g, '_').replace(/[^a-zA-Z0-9_]/g, '').toLowerCase();
    
    if (slug === "aghanims_scepter") slug = "ultimate_scepter";
    if (slug === "aghanims_shard") slug = "aghanims_shard";
    if (slug === "town_portal_scroll") slug = "tpscroll";
    if (slug === "boots_of_speed") slug = "boots";
    if (slug === "gem_of_true_sight") slug = "gem";
    if (slug === "observer_ward") slug = "ward_observer";
    if (slug === "sentry_ward") slug = "ward_sentry";
    if (slug === "tango") slug = "tango";
    if (slug === "clarity") slug = "clarity";
    if (slug === "healing_salve") slug = "flask";
    if (slug === "smoke_of_deceit") slug = "smoke_of_deceit";
    if (slug === "dust_of_appearance") slug = "dust";
    if (slug === "bottle") slug = "bottle";
    if (slug === "animal_courier") slug = "courier";
    if (slug === "flying_courier") slug = "flying_courier";
    if (slug === "shadow_amulet") slug = "shadow_amulet";
    if (slug === "magic_stick") slug = "magic_stick";
    if (slug === "magic_wand") slug = "magic_wand";
    if (slug === "gunpowder_gauntlet") slug = "gunpowder_gauntlets";

    // Neutral Enhancements (Phase 20 Fix)
    const enhancements = ["crude", "brawny", "quickened", "tough", "greedy", "mystical", "keen", "toxic", "stalwart", "swift", "alert", "timeless", "titanic", "vital", "audacious", "evolved", "feverish", "fleetfooted", "hulking", "manic", "vampiric", "keen_eyed", "boundless", "nimble", "vast", "wise"];
    if (enhancements.includes(slug)) {
      slug = `enhancement_${slug}`;
    }

    return `https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/items/${slug}.png`;
  };

  return (
    <div className={styles.listContainer}>
      <div className={styles.controlsRow}>
        <h2>{title}</h2>
        
        <div className={styles.controls}>
          <button 
            className={`${styles.filterBtn} ${filter === "All" ? styles.active : ""}`}
            onClick={() => setFilter("All")}
          >
            All
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
            placeholder={`Search ${title.toLowerCase()}...`} 
            className={styles.searchInput}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className={styles.grid}>
        {filteredItems.map((item) => {
          const safeName = item.itemName.toLowerCase()
            .replace(/[^a-z0-9]+/g, '_')
            .replace(/^_+|_+$/g, '');
          return (
          <Link 
            key={item.itemName} 
            href={`/item/${safeName}`}
            className={`${styles.card} ${styles.clickable}`}
            style={{ textDecoration: 'none', color: 'inherit' }}
          >
            <div className={styles.heroImageWrapper}>
              <img 
                src={getItemImageUrl(item.itemName)} 
                alt="" 
                className={styles.itemImage} 
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
              />
            </div>
            
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
                        <span className={styles.subEntity} style={{ display: 'inline', marginRight: '4px' }}>
                          {change.subEntityName}:
                        </span>
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
          </Link>
        )})}
      </div>
    </div>
  );
}
