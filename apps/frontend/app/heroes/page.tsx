import { promises as fs } from "node:fs";
import path from "node:path";
import HeroGrid from "./HeroGrid";
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

  // Load hero attributes
  const heroAttributes: Record<string, number> = {};
  try {
    const rawHeroData = await fs.readFile(path.join(mappingsDir, "herodata.json"), "utf-8");
    const herodata = JSON.parse(rawHeroData);
    for (const [id, h] of Object.entries(herodata)) {
      const hero = h as any;
      if (hero.name_loc) {
        heroAttributes[hero.name_loc] = hero.primary_attr;
      }
    }
  } catch (e) {
    console.error("Could not load herodata attributes.");
  }

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

  return (
    <div className="container">
      <div className={styles.rosterHeader}>
        <h1 className={styles.rosterTitle}>
          Heroes Roster
        </h1>
        <p className={styles.rosterSub}>Browse all heroes and view their complete balance history.</p>
      </div>

      <HeroGrid 
        heroNames={heroNames} 
        heroTraj={heroTraj} 
        heroAttributes={heroAttributes} 
      />
    </div>
  );
}


