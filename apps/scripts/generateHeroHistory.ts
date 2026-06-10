import { promises as fs } from "node:fs";
import path from "node:path";

const researchDir = path.resolve(process.cwd(), "research-output");
const patchesDir = path.join(researchDir, "classified-patches");
const outputDir = path.join(researchDir, "hero-history");
const vectorsDir = path.join(researchDir, "feature-vectors");
const calibrationDir = path.join(researchDir, "calibration-data");

async function generate() {
  console.log("Generating hero history index...");
  
  if (!(await fs.stat(outputDir).catch(() => null))) {
    await fs.mkdir(outputDir);
  }

  const files = await fs.readdir(patchesDir);
  const jsonFiles = files
    .filter(f => f.endsWith(".json"))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));

  const heroData: Record<string, any> = {};

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

    if (patch.changes) {
      for (const change of patch.changes) {
        if (change.category === "hero") {
          const name = change.entityName;
          if (!heroData[name]) {
            heroData[name] = {
              name: name,
              history: []
            };
          }

          // Add or update entry for this patch
          let patchEntry = heroData[name].history.find((h: any) => h.version === patchVersion);
          if (!patchEntry) {
            patchEntry = {
              version: patchVersion,
              date: patch.timestamp || new Date().toISOString(), // Fallback
              changes: [],
              vectorDelta: vectorDeltaMap[name] || null,
              winrates: {}
            };
            
            // Extract winrates for this hero across ranks
            if (winrateMap) {
              const mapping = JSON.parse(await fs.readFile(path.join(researchDir, "mappings", "heroes.json"), "utf-8"));
              const heroId = Object.keys(mapping).find(id => mapping[id] === name);
              if (heroId) {
                for (const rank in winrateMap) {
                  if (winrateMap[rank][heroId]) {
                    patchEntry.winrates[rank] = winrateMap[rank][heroId];
                  }
                }
              }
            }

            heroData[name].history.push(patchEntry);
          }
          patchEntry.changes.push(change);
        }
      }
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

  console.log(`Hero history generated for ${Object.keys(heroData).length} heroes.`);
}

generate().catch(console.error);
