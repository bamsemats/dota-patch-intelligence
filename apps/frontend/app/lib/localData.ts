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
             entity: { id: parseInt(heroId), name: "Unknown" } // name is usually resolved from mappings in actual app but this is a fallback
           });
        }
      }
      patchData.winrateSnapshots = snapshots;
    } catch (e) {}

    // Deep structure fix for full-notes page expectation
    // The full-notes page expects change.entity.name and change.entity.type
    if (patchData.changes) {
      patchData.changes = patchData.changes.map((c: any) => ({
        ...c,
        classificationType: c.classification?.classificationType,
        reasoning: c.classification?.reasoning,
        strategicWeight: c.classification?.strategicWeight,
        netScoreDelta: c.impact?.netScoreDelta || 0,
        entity: { name: c.entityName, type: c.category }
      }));
    }

    return patchData;
  } catch (e) {
    return null;
  }
}
