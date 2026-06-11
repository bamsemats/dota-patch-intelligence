import { promises as fs } from "node:fs";
import path from "node:path";
import Link from "next/link";
import PatchSelector from "../../../components/PatchSelector";
import FullNotesTabs from "./FullNotesTabs";

interface PageProps {
  params: Promise<{ version: string }>;
}

const researchDir = path.resolve(process.cwd(), "../../research-output");
const patchesDir = path.join(researchDir, "classified-patches");

export async function generateStaticParams() {
  const files = await fs.readdir(patchesDir);
  return files
    .filter(f => f.endsWith(".json"))
    .map(f => ({
      version: f.replace(".json", ""),
    }));
}

export default async function PatchNotesPage({ params }: PageProps) {
  const { version: patchVersion } = await params;
  
  const files = await fs.readdir(patchesDir);
  const availablePatches = files
    .filter(f => f.endsWith(".json"))
    .map(f => f.replace(".json", ""))
    .sort((a, b) => b.localeCompare(a, undefined, { numeric: true, sensitivity: 'base' }));

  const patchPath = path.join(researchDir, "classified-patches", `${patchVersion}.json`);
  let patchData = null;
  try {
    const rawPatch = await fs.readFile(patchPath, "utf-8");
    patchData = JSON.parse(rawPatch);
  } catch (e) {
    console.error("Could not load patch data:", e);
  }

  if (!patchData) return <div>Patch not found.</div>;

  // Load Feature Vectors
  const vectorPath = path.join(researchDir, "feature-vectors", `vectors-${patchVersion}.json`);
  let vectorData = null;
  try {
    const rawVectors = await fs.readFile(vectorPath, "utf-8");
    vectorData = JSON.parse(rawVectors);
  } catch (e) {
    // No vectors for this patch
  }

  // Load Winrate Data
  const winratePath = path.join(researchDir, "calibration-data", `winrates-${patchVersion}.json`);
  let winrateData = null;
  try {
    const rawWinrate = await fs.readFile(winratePath, "utf-8");
    winrateData = JSON.parse(rawWinrate);
  } catch (e) {
    // No winrate for this patch
  }

  // Load Hero Mapping
  const mappingPath = path.join(researchDir, "mappings", "heroes.json");
  let heroMapping = null;
  try {
    const rawMapping = await fs.readFile(mappingPath, "utf-8");
    heroMapping = JSON.parse(rawMapping);
  } catch (e) {
    // No mapping
  }

  // Process Data
  const heroMap = new Map<string, any>();
  const itemMap = new Map<string, any>();
  const neutralMap = new Map<string, any>();
  const generalMap = new Map<string, any>();

  if (patchData && patchData.changes) {
    for (const change of patchData.changes) {
      const type = change.classification?.classificationType;
      let netScoreDelta = 0;
      if (type === "Buff") netScoreDelta = 1;
      if (type === "Nerf") netScoreDelta = -1;

      if (change.category === "hero") {
        if (!heroMap.has(change.entityName)) {
          heroMap.set(change.entityName, { heroName: change.entityName, changes: [], netScore: 0, vectorDelta: null });
        }
        const hero = heroMap.get(change.entityName);
        hero.changes.push(change);
        const weightObj = change.classification?.strategicWeight;
        const weight = typeof weightObj === 'object' ? (weightObj['Divine'] || 5) : (weightObj || 5);
        hero.netScore += (weight * netScoreDelta);
      } 
      else if (change.category === "item") {
        if (!itemMap.has(change.entityName)) {
          itemMap.set(change.entityName, { itemName: change.entityName, itemType: "Shop Item", changes: [], netScore: 0 });
        }
        const item = itemMap.get(change.entityName);
        item.changes.push(change);
        const weightObj = change.classification?.strategicWeight;
        const weight = typeof weightObj === 'object' ? (weightObj['Divine'] || 5) : (weightObj || 5);
        item.netScore += (weight * netScoreDelta);
      }
      else if (change.category === "neutral") {
        if (!neutralMap.has(change.entityName)) {
          neutralMap.set(change.entityName, { itemName: change.entityName, itemType: "Neutral Item", changes: [], netScore: 0 });
        }
        const item = neutralMap.get(change.entityName);
        item.changes.push(change);
        const weightObj = change.classification?.strategicWeight;
        const weight = typeof weightObj === 'object' ? (weightObj['Divine'] || 5) : (weightObj || 5);
        item.netScore += (weight * netScoreDelta);
      }
      else if (change.category === "general") {
        if (!generalMap.has(change.entityName)) {
          generalMap.set(change.entityName, { sectionName: change.entityName, changes: [] });
        }
        generalMap.get(change.entityName).changes.push(change);
      }
    }
  }

  if (vectorData && vectorData.vectorDeltas) {
    for (const vector of vectorData.vectorDeltas) {
      if (heroMap.has(vector.heroName)) {
        heroMap.get(vector.heroName).vectorDelta = vector.vectorDelta;
      }
    }
  }

  const heroesArray = Array.from(heroMap.values()).sort((a, b) => a.heroName.localeCompare(b.heroName));
  const itemsArray = Array.from(itemMap.values()).sort((a, b) => a.itemName.localeCompare(b.itemName));
  const neutralsArray = Array.from(neutralMap.values()).sort((a, b) => a.itemName.localeCompare(b.itemName));
  const generalArray = Array.from(generalMap.values());

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '20px' }}>
        <h1 style={{ color: "var(--color-artifact)", margin: 0, fontSize: "2.5rem" }}>
          Patch {patchVersion} Notes
        </h1>
        
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
          <PatchSelector availablePatches={availablePatches} currentPatch={patchVersion} />
        </div>
      </div>

      <FullNotesTabs 
        heroes={heroesArray}
        items={itemsArray}
        neutrals={neutralsArray}
        general={generalArray}
        winrateData={winrateData}
        heroMapping={heroMapping}
      />
    </div>
  );
}
