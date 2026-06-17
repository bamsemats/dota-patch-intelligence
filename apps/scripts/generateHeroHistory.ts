import { promises as fs } from "node:fs";
import path from "node:path";

const researchDir = path.resolve(process.cwd(), "research-output");
const patchesDir = path.join(researchDir, "classified-patches");
const outputDir = path.join(researchDir, "hero-history");
const vectorsDir = path.join(researchDir, "feature-vectors");
const calibrationDir = path.join(researchDir, "calibration-data");
const metaDir = path.join(researchDir, "meta-analysis");
const mappingPath = path.join(researchDir, "mappings", "heroes.json");

async function generate() {
  console.log("Generating smart hero history index with temporal assessments...");
  
  if (!(await fs.stat(outputDir).catch(() => null))) {
    await fs.mkdir(outputDir);
  }

  const heroMapping = JSON.parse(await fs.readFile(mappingPath, "utf-8"));
  const heroNames = Object.values(heroMapping) as string[];
  
  const files = await fs.readdir(patchesDir);
  const jsonFiles = files
    .filter(f => f.endsWith(".json"))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));

  const heroData: Record<string, any> = {};
  for (const name of heroNames) {
    heroData[name] = {
      name: name,
      history: []
    };
  }

  // Persistent states for forward-filling
  const currentWinrates: Record<string, Record<string, any>> = {};
  const currentVectors: Record<string, any> = {};

  for (const name of heroNames) {
    currentWinrates[name] = {};
    currentVectors[name] = {
      farming: 0, mobility: 0, survivability: 0, teamfight: 0, laning: 0, siege: 0, utility: 0
    };
  }

  for (const file of jsonFiles) {
    const patchVersion = file.replace(".json", "");
    const rawPatch = await fs.readFile(path.join(patchesDir, file), "utf-8");
    const patch = JSON.parse(rawPatch);

    // Load vectors for this patch
    let vectorDeltaMap: Record<string, any> = {};
    try {
      const rawVectors = await fs.readFile(path.join(vectorsDir, `vectors-${patchVersion}.json`), "utf-8");
      const vectors = JSON.parse(rawVectors);
      for (const v of vectors.vectorDeltas || []) {
        vectorDeltaMap[v.heroName] = v.vectorDelta;

        // Accumulate vectors
        if (currentVectors[v.heroName]) {
          for (const dim in v.vectorDelta) {
            currentVectors[v.heroName][dim] += v.vectorDelta[dim];
          }
        }
      }
    } catch (e) {}

    // Load winrates for this patch
    let winrateMap: Record<string, any> = {};
    try {
      const rawWinrates = await fs.readFile(path.join(calibrationDir, `winrates-${patchVersion}.json`), "utf-8");
      winrateMap = JSON.parse(rawWinrates);
    } catch (e) {}

    // Load meta-analysis for temporal assessments
    const temporalMap: Record<string, string> = {};
    try {
      const rawMeta = await fs.readFile(path.join(metaDir, `meta-${patchVersion}.json`), "utf-8");
      const meta = JSON.parse(rawMeta);
      
      // Extract from overall synergistic winners
      (meta.synergisticWinners || []).forEach((w: any) => {
        if (w.temporalAssessment) temporalMap[w.entity] = w.temporalAssessment;
      });

      // Extract from role-specific winners
      if (meta.roleSpecificWinners) {
        Object.values(meta.roleSpecificWinners).forEach((roleGroup: any) => {
           roleGroup.forEach((w: any) => {
             if (w.temporalAssessment) temporalMap[w.hero] = w.temporalAssessment;
           });
        });
      }
    } catch (e) {}

    // Track which heroes have changes in this patch
    const patchChanges: Record<string, any[]> = {};
    if (patch.changes) {
      for (const change of patch.changes) {
        if (change.category === "hero") {
          const name = change.entityName;
          if (!patchChanges[name]) patchChanges[name] = [];
          patchChanges[name].push(change);
        }
      }
    }

    // For EVERY hero, update their state and create history entry
    for (const name of heroNames) {
      const heroId = Object.keys(heroMapping).find(id => heroMapping[id] === name);
      
      const currentPatchWinrates: Record<string, any> = {};
      
      if (winrateMap && heroId) {
        for (const rank in winrateMap) {
          if (winrateMap[rank][heroId]) {
            currentPatchWinrates[rank] = winrateMap[rank][heroId];
          }
        }
      }

      heroData[name].history.push({
        version: patchVersion,
        date: patch.timestamp || new Date().toISOString(),
        changes: patchChanges[name] || [],
        vectorDelta: vectorDeltaMap[name] || null,
        totalVector: { ...currentVectors[name] }, // Cumulative state
        winrates: currentPatchWinrates, // Explicitly only for THIS patch
        temporalAssessment: temporalMap[name] || null
      });
    }
  }

  // Write individual hero files
  for (const heroName in heroData) {
    const safeName = heroName.toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');
      
    await fs.writeFile(
      path.join(outputDir, `${safeName}.json`),
      JSON.stringify(heroData[heroName], null, 2)
    );
  }

  console.log(`Forward-filled hero history generated for ${Object.keys(heroData).length} heroes.`);
}

generate().catch(console.error);
