import { promises as fs } from "node:fs";
import path from "node:path";

const researchDir = path.resolve(process.cwd(), "research-output");
const patchesDir = path.join(researchDir, "classified-patches");
const outputDir = path.join(researchDir, "item-history");
const metaDir = path.join(researchDir, "meta-analysis");
const mappingsDir = path.join(researchDir, "mappings");
const mappingPath = path.join(mappingsDir, "items.json");
const richItemDataPath = path.join(researchDir, "mappings", "itemdata.json");
const categoryPath = path.join(researchDir, "mappings", "item_categories.json");

async function generate() {
  console.log("Generating smart item history index using curated list...");
  
  if (!(await fs.stat(outputDir).catch(() => null))) {
    await fs.mkdir(outputDir);
  }

  // 1. Load Curated List
  const rawCategories = await fs.readFile(categoryPath, "utf-8");
  const categories = JSON.parse(rawCategories);
  const curatedItemNames: string[] = [];
  
  for (const mainGroup in categories) {
    for (const subGroup in categories[mainGroup]) {
      curatedItemNames.push(...categories[mainGroup][subGroup]);
    }
  }

  // 2. Load Rich Meta
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
          richDataLookup[(data as any).dname] = { ...data, internalName: key };
      }
  }

  // 3. Initialize Item Data for Curated Names
  const itemData: Record<string, any> = {};
  const valveToCuratedMap: Record<string, string> = {};

  for (const name of curatedItemNames) {
    // Determine the likely "Valve Name" (e.g. "Vital Enhancement" -> "Vital")
    let valveName = name;
    if (name.endsWith(" Enhancement")) {
      valveName = name.replace(" Enhancement", "");
    }
    valveToCuratedMap[valveName] = name;

    const richMeta = richDataLookup[valveName] || richDataLookup[name];
    
    // Extract Image Slug from OpenDota's "img" field: /apps/.../items/SLUG.png?t=...
    let imageSlug = null;
    if (richMeta?.img) {
        const parts = richMeta.img.split('/');
        const filename = parts[parts.length - 1].split('?')[0];
        imageSlug = filename.replace('.png', '');
    }

    itemData[name] = {
      name: name,
      valveName: valveName,
      imageSlug: imageSlug, // Preservation (Corrects Travel Boots, Gauntlets, etc.)
      cost: richMeta?.cost || null,
      lore: richMeta?.lore || null,
      description: richMeta?.hint?.[0] || richMeta?.notes || null,
      attributes: richMeta?.attrib || [],
      history: []
    };
  }

  const files = await fs.readdir(patchesDir);
  const jsonFiles = files
    .filter(f => f.endsWith(".json"))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));

  for (const file of jsonFiles) {
    const patchVersion = file.replace(".json", "");
    const rawPatch = await fs.readFile(path.join(patchesDir, file), "utf-8");
    const patch = JSON.parse(rawPatch);

    const temporalMap: Record<string, string> = {};
    try {
      const rawMeta = await fs.readFile(path.join(metaDir, `meta-${patchVersion}.json`), "utf-8");
      const meta = JSON.parse(rawMeta);
      (meta.synergisticWinners || []).forEach((w: any) => {
        if (w.temporalAssessment) temporalMap[w.entity] = w.temporalAssessment;
      });
    } catch (e) {}

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

    // Match patch changes to curated items
    for (const curatedName in itemData) {
      const vName = itemData[curatedName].valveName;
      // Check for changes under either name
      const changes = [...(patchChanges[vName] || []), ...(patchChanges[curatedName] || [])];
      
      // Deduplicate by originalSource
      const uniqueChanges = Array.from(new Map(changes.map(c => [c.originalSource || c.rawNote, c])).values());

      itemData[curatedName].history.push({
        version: patchVersion,
        date: patch.timestamp || new Date().toISOString(),
        changes: uniqueChanges,
        temporalAssessment: temporalMap[vName] || temporalMap[curatedName] || null
      });
    }
  }

  // Write individual item files
  let count = 0;
  for (const curatedName in itemData) {
    const safeName = curatedName.toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');
      
    await fs.writeFile(
      path.join(outputDir, `${safeName}.json`),
      JSON.stringify(itemData[curatedName], null, 2)
    );
    count++;
  }

  console.log(`Generated curated item history for ${count} items.`);

  // 4. Output a global slug mapping for the Frontend (ISSUE-20)
  const slugMapping: Record<string, string> = {};
  for (const name in itemData) {
      if (itemData[name].imageSlug) {
          slugMapping[name] = itemData[name].imageSlug;
      }
  }
  await fs.writeFile(
      path.join(mappingsDir, "item_slugs.json"),
      JSON.stringify(slugMapping, null, 2)
  );
  console.log(`Generated item_slugs.json mapping for ${Object.keys(slugMapping).length} items.`);
}

generate().catch(console.error);
