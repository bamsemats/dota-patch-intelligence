import { promises as fs } from "node:fs";
import path from "node:path";

const researchDir = path.resolve(process.cwd(), "research-output");
const patchesDir = path.join(researchDir, "classified-patches");
const outputDir = path.join(researchDir, "item-history");
const metaDir = path.join(researchDir, "meta-analysis");
const mappingPath = path.join(researchDir, "mappings", "items.json");
const richItemDataPath = path.join(researchDir, "mappings", "itemdata.json");

async function generate() {
  console.log("Generating smart item history index...");
  
  if (!(await fs.stat(outputDir).catch(() => null))) {
    await fs.mkdir(outputDir);
  }

  const itemMapping = JSON.parse(await fs.readFile(mappingPath, "utf-8"));
  // Deduplicate names
  const itemNames = Array.from(new Set(Object.values(itemMapping))) as string[];
  
  // Load OpenDota rich data to map names to rich descriptions
  let richItemData: any = {};
  try {
     richItemData = JSON.parse(await fs.readFile(richItemDataPath, "utf-8"));
  } catch(e) {
     console.warn("Could not load rich item data.");
  }

  // Build a fast lookup from item name -> rich data
  const richDataLookup: Record<string, any> = {};
  for (const [key, data] of Object.entries(richItemData)) {
      if ((data as any).dname) {
          richDataLookup[(data as any).dname] = data;
      }
  }

  const files = await fs.readdir(patchesDir);
  const jsonFiles = files
    .filter(f => f.endsWith(".json"))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));

  const itemData: Record<string, any> = {};
  for (const name of itemNames) {
    if (!name || name.toLowerCase().endsWith(" recipe") || name.toLowerCase().startsWith("recipe_") || name.length < 3) continue;

    const richMeta = richDataLookup[name];

    itemData[name] = {
      name: name,
      cost: richMeta?.cost || null,
      lore: richMeta?.lore || null,
      description: richMeta?.hint?.[0] || richMeta?.notes || null,
      attributes: richMeta?.attrib || [],
      history: []
    };
  }

  for (const file of jsonFiles) {
    const patchVersion = file.replace(".json", "");
    const rawPatch = await fs.readFile(path.join(patchesDir, file), "utf-8");
    const patch = JSON.parse(rawPatch);

    // Load meta-analysis for temporal assessments
    const temporalMap: Record<string, string> = {};
    try {
      const rawMeta = await fs.readFile(path.join(metaDir, `meta-${patchVersion}.json`), "utf-8");
      const meta = JSON.parse(rawMeta);
      
      // Extract from overall synergistic winners
      (meta.synergisticWinners || []).forEach((w: any) => {
        if (w.temporalAssessment) temporalMap[w.entity] = w.temporalAssessment;
      });
    } catch (e) {}

    // Track which items have changes in this patch
    const patchChanges: Record<string, any[]> = {};
    if (patch.changes) {
      for (const change of patch.changes) {
        if (change.category === "item" || change.category === "neutral") {
          const name = change.entityName;
          if (!patchChanges[name]) patchChanges[name] = [];
          patchChanges[name].push(change);
        }
      }
    }

    // For EVERY tracked item, create history entry
    for (const name in itemData) {
      itemData[name].history.push({
        version: patchVersion,
        date: patch.timestamp || new Date().toISOString(),
        changes: patchChanges[name] || [],
        temporalAssessment: temporalMap[name] || null
      });
    }
  }

  // Write individual item files
  let count = 0;
  for (const itemName in itemData) {
    const safeName = itemName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    await fs.writeFile(
      path.join(outputDir, `${safeName}.json`),
      JSON.stringify(itemData[itemName], null, 2)
    );
    count++;
  }

  console.log(`Generated item history for ${count} items.`);
}

generate().catch(console.error);
