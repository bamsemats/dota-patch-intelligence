"use client";

import { useState } from "react";
import styles from "../../../components/Tabs.module.css";
import HeroList from "../../../components/HeroList";
import ItemList from "../../../components/ItemList";
import GeneralList from "../../../components/GeneralList";

interface FullNotesTabsProps {
  heroes: any[];
  items: any[];
  neutrals: any[];
  general: any[];
  winrateData?: any;
  heroMapping?: Record<string, string>;
  itemSlugs?: Record<string, string>;
}

export default function FullNotesTabs({ heroes, items, neutrals, general, winrateData, heroMapping, itemSlugs }: FullNotesTabsProps) {
  const [activeTab, setActiveTab] = useState<"general" | "item" | "neutral" | "hero">("hero");

  return (
    <div className={styles.tabContainer}>
      <div className={styles.tabHeader}>
        <button 
          className={`${styles.tabButton} ${activeTab === "hero" ? styles.active : ""}`}
          onClick={() => setActiveTab("hero")}
        >
          Hero Changes
        </button>
        <button 
          className={`${styles.tabButton} ${activeTab === "item" ? styles.active : ""}`}
          onClick={() => setActiveTab("item")}
        >
          Item Changes
        </button>
        <button 
          className={`${styles.tabButton} ${activeTab === "neutral" ? styles.active : ""}`}
          onClick={() => setActiveTab("neutral")}
        >
          Neutral Items
        </button>
        <button 
          className={`${styles.tabButton} ${activeTab === "general" ? styles.active : ""}`}
          onClick={() => setActiveTab("general")}
        >
          General Updates
        </button>
      </div>

      <div className={styles.tabContent}>
        {activeTab === "hero" && (
          heroes.length > 0 ? (
            <HeroList heroes={heroes} winrateData={winrateData} heroMapping={heroMapping} />
          ) : (
            <p style={{ color: '#888' }}>No hero changes in this patch.</p>
          )
        )}
        
        {activeTab === "item" && (
          items.length > 0 ? (
            <ItemList title="Item Changes" items={items} itemSlugs={itemSlugs} />
          ) : (
            <p style={{ color: '#888' }}>No item changes in this patch.</p>
          )
        )}

        {activeTab === "neutral" && (
          neutrals.length > 0 ? (
            <ItemList title="Neutral Item Changes" items={neutrals} itemSlugs={itemSlugs} />
          ) : (
            <p style={{ color: '#888' }}>No neutral item changes in this patch.</p>
          )
        )}

        {activeTab === "general" && (
          general.length > 0 ? (
            <GeneralList sections={general} />
          ) : (
            <p style={{ color: '#888' }}>No general updates in this patch.</p>
          )
        )}
      </div>
    </div>
  );
}
