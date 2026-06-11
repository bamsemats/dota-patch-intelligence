import { promises as fs } from "node:fs";
import path from "node:path";

const researchDir = path.resolve(process.cwd(), "research-output");
const patchesDir = path.join(researchDir, "classified-patches");
const outputDir = path.join(researchDir, "hero-history");
const vectorsDir = path.join(researchDir, "feature-vectors");
const calibrationDir = path.join(researchDir, "calibration-data");
const mappingPath = path.join(researchDir, "mappings", "heroes.json");

async function generate() {
  console.log("Generating smart hero history index with winrate forward-filling...");
  
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

  // Persistent winrate state for forward-filling
  const currentWinrates: Record<string, Record<string, any>> = {};
  for (const name of heroNames) {
    currentWinrates[name] = {};
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
      }
    } catch (e) {}

    // Load winrates for this patch
    let winrateMap: Record<string, any> = {};
    try {
      const rawWinrates = await fs.readFile(path.join(calibrationDir, `winrates-${patchVersion}.json`), "utf-8");
      winrateMap = JSON.parse(rawWinrates);
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
      
      // Update persistent winrate if new data is available and not empty
      if (winrateMap && heroId) {
        let hasData = false;
        const newWinrates: Record<string, any> = {};
        for (const rank in winrateMap) {
          if (winrateMap[rank][heroId]) {
            newWinrates[rank] = winrateMap[rank][heroId];
            hasData = true;
          }
        }
        
        if (hasData) {
          currentWinrates[name] = newWinrates;
        }
      }

      heroData[name].history.push({
        version: patchVersion,
        date: patch.timestamp || new Date().toISOString(),
        changes: patchChanges[name] || [],
        vectorDelta: vectorDeltaMap[name] || null,
        winrates: { ...currentWinrates[name] } // Use the filled state
      });
    }
  }

  // Write individual hero files
  for (const heroName in heroData) {
    const safeName = heroName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    await fs.writeFile(
      path.join(outputDir, `${safeName}.json`),
      JSON.stringify(heroData[heroName], null, 2)
    );
  }

  console.log(`Forward-filled hero history generated for ${Object.keys(heroData).length} heroes.`);
}

generate().catch(console.error);
