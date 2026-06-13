import { PrismaClient } from '@prisma/client';
import { promises as fs } from "node:fs";
import path from "node:path";

const prisma = new PrismaClient();
const researchDir = path.resolve(__dirname, "../../research-output");

async function seed() {
  console.log("🌱 Starting Database Seed...");

  // 1. Ensure Entity types enum matches our data logic
  const getEntityType = (category: string) => {
    switch (category) {
      case "hero": return "HERO";
      case "item": return "ITEM";
      case "neutral": return "NEUTRAL";
      case "general": return "GENERAL";
      default: return "GENERAL";
    }
  };

  const getClassificationType = (type: string) => {
    switch (type) {
      case "Buff": return "Buff";
      case "Nerf": return "Nerf";
      case "Adjustment": return "Adjustment";
      case "Rework": return "Rework";
      default: return "Unknown";
    }
  };

  // 2. Read Patches
  const patchesDir = path.join(researchDir, "classified-patches");
  const files = await fs.readdir(patchesDir);
  const jsonFiles = files
    .filter(f => f.endsWith(".json"))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));

  for (const file of jsonFiles) {
    const patchVersion = file.replace(".json", "");
    console.log(`Processing Patch ${patchVersion}...`);
    
    const rawPatch = await fs.readFile(path.join(patchesDir, file), "utf-8");
    const patchData = JSON.parse(rawPatch);

    // Create Patch
    const patch = await prisma.patch.upsert({
      where: { version: patchVersion },
      update: patchData.timestamp ? { releaseDate: new Date(patchData.timestamp) } : {},
      create: {
        version: patchVersion,
        releaseDate: patchData.timestamp ? new Date(patchData.timestamp) : null,
      }
    });

    // CRITICAL: Delete existing changes for this patch before re-seeding to prevent duplicates
    await prisma.patchChange.deleteMany({ where: { patchId: patch.id } });

    // 3. Process Changes and Entities
    if (patchData.changes) {
      for (const change of patchData.changes) {
        // Upsert Entity
        const entityName = change.entityName || "Unknown Entity";
        const entity = await prisma.entity.upsert({
          where: { name: entityName },
          update: {},
          create: {
            name: entityName,
            type: getEntityType(change.category)
          }
        });

        // Insert Change
        const typeStr = change.classification?.classificationType || "Unknown";
        let netScoreDelta = 0;
        if (typeStr === "Buff") netScoreDelta = 1;
        if (typeStr === "Nerf") netScoreDelta = -1;

        const weightObj = change.classification?.strategicWeight;
        const weight = typeof weightObj === 'object' ? (weightObj['Divine'] || 5) : (weightObj || 5);

        await prisma.patchChange.create({
          data: {
            patchId: patch.id,
            entityId: entity.id,
            subEntityName: change.subEntityName || null,
            rawNote: change.rawNote,
            classificationType: getClassificationType(typeStr),
            netScoreDelta: weight * netScoreDelta,
            reasoning: change.classification?.reasoning || null,
            strategicWeight: weightObj || null
          }
        });
      }
    }

    // 4. Load Vectors
    try {
      const rawVectors = await fs.readFile(path.join(researchDir, "feature-vectors", `vectors-${patchVersion}.json`), "utf-8");
      const vectors = JSON.parse(rawVectors);
      
      for (const v of vectors.vectorDeltas || []) {
        const entity = await prisma.entity.findUnique({ where: { name: v.heroName } });
        if (entity) {
          await prisma.featureVector.upsert({
            where: {
              patchId_entityId: {
                patchId: patch.id,
                entityId: entity.id
              }
            },
            update: {
              farming: v.vectorDelta.farming || 0,
              mobility: v.vectorDelta.mobility || 0,
              survivability: v.vectorDelta.survivability || 0,
              teamfight: v.vectorDelta.teamfight || 0,
              laning: v.vectorDelta.laning || 0,
              siege: v.vectorDelta.siege || 0,
              utility: v.vectorDelta.utility || 0,
            },
            create: {
              patchId: patch.id,
              entityId: entity.id,
              farming: v.vectorDelta.farming || 0,
              mobility: v.vectorDelta.mobility || 0,
              survivability: v.vectorDelta.survivability || 0,
              teamfight: v.vectorDelta.teamfight || 0,
              laning: v.vectorDelta.laning || 0,
              siege: v.vectorDelta.siege || 0,
              utility: v.vectorDelta.utility || 0,
            }
          });
        }
      }
    } catch (e) {
      // No vectors
    }

    // 5. Load Meta Analysis
    try {
      const rawMeta = await fs.readFile(path.join(researchDir, "meta-analysis", `meta-${patchVersion}.json`), "utf-8");
      const meta = JSON.parse(rawMeta);
      
      await prisma.metaAnalysis.upsert({
        where: { patchId: patch.id },
        update: {
          metaShifts: meta.metaShifts || [],
          synergisticWinners: meta.synergisticWinners || [],
          synergisticLosers: meta.synergisticLosers || [],
          roleSpecificWinners: meta.roleSpecificWinners || null,
          roleSpecificLosers: meta.roleSpecificLosers || null
        },
        create: {
          patchId: patch.id,
          metaShifts: meta.metaShifts || [],
          synergisticWinners: meta.synergisticWinners || [],
          synergisticLosers: meta.synergisticLosers || [],
          roleSpecificWinners: meta.roleSpecificWinners || null,
          roleSpecificLosers: meta.roleSpecificLosers || null
        }
      });
    } catch (e) {
      // No meta
    }
    
    // 6. Load Winrates
    try {
      const rawWinrates = await fs.readFile(path.join(researchDir, "calibration-data", `winrates-${patchVersion}.json`), "utf-8");
      const winrates = JSON.parse(rawWinrates);
      
      const mappingPath = path.join(researchDir, "mappings", "heroes.json");
      const rawMapping = await fs.readFile(mappingPath, "utf-8");
      const heroMapping = JSON.parse(rawMapping);
      
      for (const bracket in winrates) {
        for (const entityId in winrates[bracket]) {
          const heroName = heroMapping[entityId];
          if (!heroName) continue;
          
          const entity = await prisma.entity.findUnique({ where: { name: heroName } });
          if (!entity) continue;
          
          const wrData = winrates[bracket][entityId];
          await prisma.winrateSnapshot.upsert({
            where: {
              patchId_entityId_bracket: {
                patchId: patch.id,
                entityId: entity.id,
                bracket: bracket
              }
            },
            update: {
              winrate: wrData.winrate,
              matchCount: wrData.matchCount,
              isHistorical: wrData.isHistorical || false
            },
            create: {
              patchId: patch.id,
              entityId: entity.id,
              bracket: bracket,
              winrate: wrData.winrate,
              matchCount: wrData.matchCount,
              isHistorical: wrData.isHistorical || false
            }
          });
        }
      }
    } catch (e) {
       // No winrates
    }
  }

  console.log("✅ Seed Complete!");
}

seed()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
