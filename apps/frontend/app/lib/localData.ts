import { promises as fs } from "node:fs";
import path from "node:path";

// Helpers to get data from local files when API is unavailable (e.g., in CI)
const researchDir = path.resolve(process.cwd(), "../../research-output");

export async function getLocalPatches() {
  const patchesDir = path.join(researchDir, "classified-patches");
  try {
    const files = await fs.readdir(patchesDir);
    return files
      .filter(f => f.endsWith(".json"))
      .map(f => f.replace(".json", ""))
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));
  } catch (e) {
    return [];
  }
}

export async function getLocalMeta(version: string) {
  const metaPath = path.join(researchDir, "meta-analysis", `meta-${version}.json`);
  try {
    const data = await fs.readFile(metaPath, "utf-8");
    return JSON.parse(data);
  } catch (e) {
    return null;
  }
}

export async function getLocalItemSlugs() {
  const slugPath = path.join(researchDir, "mappings", "item_slugs.json");
  try {
    const data = await fs.readFile(slugPath, "utf-8");
    return JSON.parse(data);
  } catch (e) {
    return {};
  }
}

export async function getLocalPatchData(version: string) {
  const patchPath = path.join(researchDir, "classified-patches", `${version}.json`);
  const vectorPath = path.join(researchDir, "feature-vectors", `vectors-${version}.json`);
  const winratePath = path.join(researchDir, "calibration-data", `winrates-${version}.json`);

  try {
    const patchData = JSON.parse(await fs.readFile(patchPath, "utf-8"));
    
    // Supplement with vectors
    try {
      const vectorData = JSON.parse(await fs.readFile(vectorPath, "utf-8"));
      patchData.featureVectors = (vectorData.vectorDeltas || []).map((v: any) => ({
        ...v.vectorDelta,
        entity: { name: v.heroName }
      }));
    } catch (e) {}

    // Supplement with winrates
    try {
      const winrateData = JSON.parse(await fs.readFile(winratePath, "utf-8"));
      const snapshots: any[] = [];
      for (const bracket in winrateData) {
        for (const heroId in winrateData[bracket]) {
           snapshots.push({
             bracket,
             winrate: winrateData[bracket][heroId].winrate,
             matchCount: winrateData[bracket][heroId].matchCount,
             entity: { id: parseInt(heroId), name: "Unknown" } 
           });
        }
      }
      patchData.winrateSnapshots = snapshots;
    } catch (e) {}

    // Deep structure fix and Score Calculation
    if (patchData.changes) {
      patchData.changes = patchData.changes.map((c: any) => {
        const typeStr = c.classification?.classificationType || "Unknown";
        let multiplier = 0;
        if (typeStr === "Buff") multiplier = 1;
        if (typeStr === "Nerf") multiplier = -1;

        const weightObj = c.classification?.strategicWeight;
        const weight = typeof weightObj === 'object' ? (weightObj['Divine'] || 5) : (weightObj || 5);
        
        // COMPUTE SCORE FOR STATIC SITE
        const netScoreDelta = multiplier * weight;

        return {
          ...c,
          classificationType: typeStr,
          reasoning: c.classification?.reasoning,
          strategicWeight: weightObj,
          netScoreDelta: netScoreDelta, // <--- Correctly calculated now
          entity: { name: c.entityName, type: c.category }
        };
      });
    }

    return patchData;
  } catch (e) {
    return null;
  }
}
