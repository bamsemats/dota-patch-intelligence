import { promises as fs } from "node:fs";
import path from "node:path";
import Link from "next/link";
import styles from "../components/EntityList.module.css";

const researchDir = path.resolve(process.cwd(), "../../research-output");
const mappingsDir = path.join(researchDir, "mappings");
const historyDir = path.join(researchDir, "hero-history");

export async function generateMetadata() {
  return {
    title: "All Heroes - Dota Patch Intelligence",
    description: "Browse the full roster of Dota 2 heroes and track their balance history.",
  };
}

export default async function HeroesPage() {
  // Load hero mapping
  let heroMapping: Record<string, string> = {};
  try {
    const rawMappings = await fs.readFile(path.join(mappingsDir, "heroes.json"), "utf-8");
    heroMapping = JSON.parse(rawMappings);
  } catch (e) {
    console.error("Could not load hero mappings.");
  }

  const heroNames = Object.values(heroMapping).sort();

  // Load latest vector data to show cumulative trajectory
  const heroTraj: Record<string, any> = {};
  try {
      const files = await fs.readdir(historyDir);
      for (const file of files) {
          if (file.endsWith(".json")) {
              const rawData = await fs.readFile(path.join(historyDir, file), "utf-8");
              const heroData = JSON.parse(rawData);
              const latestHistory = heroData.history[heroData.history.length - 1];
              if (latestHistory && latestHistory.totalVector) {
                  heroTraj[heroData.name] = latestHistory.totalVector;
              }
          }
      }
  } catch(e) {}

  const getSignificantVectors = (vector: any) => {
    if (!vector) return [];
    return Object.entries(vector)
      .filter(([_, val]: any) => val !== 0)
      .map(([dim, val]: any) => ({ dim: dim.charAt(0).toUpperCase() + dim.slice(1), val }));
  };

  const getHeroSlug = (name: string) => {
    return name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
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
    <div className="container">
      <div style={{ marginBottom: '40px' }}>
        <h1 style={{ color: "var(--color-artifact)", margin: 0, fontSize: "clamp(2rem, 5vw, 3rem)" }}>
          Heroes Roster
        </h1>
        <p style={{ color: '#888', fontSize: '1.2rem' }}>Browse all heroes and view their complete balance history.</p>
      </div>

      <div className={styles.grid}>
        {heroNames.map((name) => {
          const vectors = getSignificantVectors(heroTraj[name]);
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
                />
              </div>

              <div className={styles.cardHeader} style={{ borderBottom: 'none' }}>
                <h3 className={styles.heroName} style={{ fontSize: '1.5rem' }}>{name}</h3>
              </div>

              {vectors.length > 0 && (
                <div className={styles.vectorContainer} style={{ borderTop: 'none', marginTop: 'auto' }}>
                  {vectors.map((v, idx) => (
                    <span key={idx} className={`${styles.vectorBadge} ${v.val > 0 ? styles.pos : styles.neg}`}>
                      {v.dim} {v.val > 0 ? `+${parseFloat(v.val).toFixed(1)}` : parseFloat(v.val).toFixed(1)}
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
