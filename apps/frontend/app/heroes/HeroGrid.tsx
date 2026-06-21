"use client";

import { useState } from "react";
import Link from "next/link";
import styles from "../components/EntityList.module.css";

interface FeatureVector {
  farming: number;
  mobility: number;
  survivability: number;
  teamfight: number;
  laning: number;
  siege: number;
  utility: number;
}

interface HeroGridProps {
  heroNames: string[];
  heroTraj: Record<string, FeatureVector>;
  heroAttributes: Record<string, number>;
}

const ATTRIBUTES: Record<number, { label: string; class: string }> = {
  0: { label: "Strength", class: "str" },
  1: { label: "Agility", class: "agi" },
  2: { label: "Intelligence", class: "int" },
  3: { label: "Universal", class: "uni" },
};

export default function HeroGrid({ heroNames, heroTraj, heroAttributes }: HeroGridProps) {
  const [search, setSearch] = useState("");
  const [selectedAttr, setSelectedAttr] = useState<string>("All");
  const [selectedTrend, setSelectedTrend] = useState<string>("All");

  const getHeroSlug = (name: string) => {
    return name.toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');
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
    if (slug === "windranger") slug = "windrunner";
    if (slug === "timbersaw") slug = "shredder";
    return `https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/heroes/${slug}.png`;
  };

  const getSignificantVectors = (vector: FeatureVector | null) => {
    if (!vector) return [];
    return Object.entries(vector)
      .filter(([_, val]) => val !== 0)
      .map(([dim, val]) => ({ dim: dim.charAt(0).toUpperCase() + dim.slice(1), val }));
  };

  const getNetScore = (vector: FeatureVector | null) => {
    if (!vector) return 0;
    return Object.values(vector).reduce((sum, val) => sum + val, 0);
  };

  const filteredHeroes = heroNames.filter((name) => {
    // 1. Search Filter
    const matchesSearch = name.toLowerCase().includes(search.toLowerCase());
    if (!matchesSearch) return false;

    // 2. Attribute Filter
    const attrId = heroAttributes[name];
    const attrLabel = attrId !== undefined && ATTRIBUTES[attrId] ? ATTRIBUTES[attrId].label : "Unknown";
    if (selectedAttr !== "All" && attrLabel !== selectedAttr) return false;

    // 3. Trend Filter
    const vector = heroTraj[name] || null;
    const netScore = getNetScore(vector);
    if (selectedTrend === "Buffed" && netScore <= 0) return false;
    if (selectedTrend === "Nerfed" && netScore >= 0) return false;
    if (selectedTrend === "Neutral" && netScore !== 0) return false;

    return true;
  });

  return (
    <div>
      {/* Filters Area */}
      <div className={styles.filtersArea}>
        {/* Search & Trend Row */}
        <div className={styles.searchTrendRow}>
          <div className={styles.searchWrapper}>
            <input 
              type="text" 
              placeholder="Search hero by name..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={styles.searchInput}
            />
          </div>
          
          <div className={styles.trendBtnGroup}>
            {["All", "Buffed", "Nerfed", "Neutral"].map(trend => (
              <button
                key={trend}
                onClick={() => setSelectedTrend(trend)}
                className={`${styles.filterBtn} ${selectedTrend === trend ? styles.active : ""}`}
              >
                {trend === "All" ? "All Trends" : trend}
              </button>
            ))}
          </div>
        </div>

        {/* Attributes Filter Row */}
        <div className={styles.attributesRow}>
          <span className={styles.attributesLabel}>Primary Attribute:</span>
          {["All", "Strength", "Agility", "Intelligence", "Universal"].map(attr => (
            <button
              key={attr}
              onClick={() => setSelectedAttr(attr)}
              className={`${styles.filterBtn} ${selectedAttr === attr ? styles.active : ""}`}
            >
              {attr}
            </button>
          ))}
        </div>
      </div>

      {/* Roster Grid */}
      <div className={styles.grid}>
        {filteredHeroes.map((name) => {
          const vectors = getSignificantVectors(heroTraj[name]);
          const attrId = heroAttributes[name];
          const attrLabel = attrId !== undefined && ATTRIBUTES[attrId] ? ATTRIBUTES[attrId].label : null;

          return (
            <Link 
              key={name} 
              href={`/hero/${getHeroSlug(name)}`}
              className={`${styles.card} ${styles.clickable}`}
              style={{ textDecoration: 'none', color: 'inherit', minHeight: '150px' }}
            >
              <div className={styles.heroImageWrapper}>
                <img 
                  src={getImageUrl(name)} 
                  alt="" 
                  className={styles.heroImage} 
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
              </div>

              <div className={styles.cardHeader} style={{ borderBottom: 'none', paddingBottom: 0 }}>
                <div>
                  <h3 className={styles.heroName} style={{ fontSize: '1.4rem', margin: 0 }}>{name}</h3>
                  {attrLabel && (
                    <span className={`${styles.attrLabelText} ${
                      attrLabel === "Strength" ? styles.attrStrength : 
                      attrLabel === "Agility" ? styles.attrAgility : 
                      attrLabel === "Intelligence" ? styles.attrIntelligence : 
                      styles.attrUniversal
                    }`}>
                      {attrLabel}
                    </span>
                  )}
                </div>
              </div>


              {vectors.length > 0 && (
                <div className={styles.vectorContainer} style={{ borderTop: 'none', marginTop: 'auto' }}>
                  {vectors.map((v, idx) => (
                    <span key={idx} className={`${styles.vectorBadge} ${v.val > 0 ? styles.pos : styles.neg}`}>
                      {v.dim} {v.val > 0 ? `+${parseFloat(v.val.toString()).toFixed(1)}` : parseFloat(v.val.toString()).toFixed(1)}
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
