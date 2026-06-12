// apps/scripts/backfillWinrates.ts

import { mkdir, writeFile, readFile, readdir } from "node:fs/promises";
import * as path from "node:path";
import { PrismaClient } from "@prisma/client";

require('dotenv').config();

const OUTPUT_DIR = path.resolve("research-output", "calibration-data");
const MAPPINGS_DIR = path.resolve("research-output", "mappings");
const STRATZ_ENDPOINT = "https://api.stratz.com/graphql";
const API_KEY = process.env.STRATZ_API_KEY;

const prisma = new PrismaClient();
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const BRACKETS = {
    HERALD: 1,
    GUARDIAN: 2,
    CRUSADER: 3,
    ARCHON: 4,
    LEGEND: 5,
    ANCIENT: 6,
    DIVINE: 7
};

async function fetchStratzGraphQL(query: string, variables: any = {}) {
    const response = await fetch(STRATZ_ENDPOINT, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${API_KEY}`,
            "User-Agent": "STRATZ_API"
        },
        body: JSON.stringify({ query, variables })
    });
    const data = await response.json();
    if (data.errors) throw new Error(`GraphQL Errors: ${JSON.stringify(data.errors)}`);
    return data;
}

const WINRATE_QUERY = `
query GetHeroWinrates($bracketId: RankBracket!) {
  heroStats {
    winGameVersion(bracketIds: [$bracketId], take: 20000) {
      gameVersionId
      heroId
      matchCount
      winCount
    }
  }
}
`;

async function updateDatabase(patchId: number, winrates: any, heroMapping: any) {
    for (const bracketName in winrates) {
        for (const stratzId in winrates[bracketName]) {
            const heroName = heroMapping[stratzId];
            if (!heroName) continue;
            
            const entity = await prisma.entity.findUnique({ where: { name: heroName } });
            if (!entity) continue;
            
            const wrData = winrates[bracketName][stratzId];
            await prisma.winrateSnapshot.upsert({
                where: {
                    patchId_entityId_bracket: {
                        patchId,
                        entityId: entity.id,
                        bracket: bracketName
                    }
                },
                update: {
                    winrate: wrData.winrate,
                    matchCount: wrData.matchCount
                },
                create: {
                    patchId,
                    entityId: entity.id,
                    bracket: bracketName,
                    winrate: wrData.winrate,
                    matchCount: wrData.matchCount
                }
            });
        }
    }
}

async function main() {
    if (!API_KEY) {
        console.error("❌ STRATZ_API_KEY is missing.");
        process.exit(1);
    }

    await mkdir(OUTPUT_DIR, { recursive: true });
    const rawPatchMap = JSON.parse(await readFile(path.join(MAPPINGS_DIR, "stratz_patches.json"), "utf8"));
    const heroMapping = JSON.parse(await readFile(path.join(MAPPINGS_DIR, "heroes.json"), "utf8"));
    const classifiedPatches = (await readdir(path.resolve("research-output", "classified-patches")))
        .filter(f => f.endsWith(".json"))
        .map(f => f.replace(".json", ""))
        .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));

    console.log(`[Backfill] Processing ${classifiedPatches.length} patches.`);

    // 1. Fetch ALL winrate data once
    const bracketData: Record<string, Record<number, any>> = {};
    for (const bracketName of Object.keys(BRACKETS)) {
        console.log(`[Stratz] Downloading full history for ${bracketName}...`);
        const data = await fetchStratzGraphQL(WINRATE_QUERY, { bracketId: bracketName });
        const stats = data.data.heroStats.winGameVersion;
        
        const versionMap: Record<number, any> = {};
        for (const s of stats) {
            if (!versionMap[s.gameVersionId]) versionMap[s.gameVersionId] = {};
            const winrate = s.matchCount > 0 ? (s.winCount / s.matchCount) : 0;
            versionMap[s.gameVersionId][s.heroId] = {
                winrate: parseFloat(winrate.toFixed(4)),
                matchCount: s.matchCount
            };
        }
        bracketData[bracketName] = versionMap;
        await sleep(1000); 
    }

    // Identify the absolute latest ID available
    const availableIds = Object.keys(bracketData["DIVINE"]).map(Number).sort((a, b) => b - a);
    const latestId = availableIds[0];

    for (const version of classifiedPatches) {
        const stratzVersionId = rawPatchMap[version];
        let finalWinrateData: any = null;

        if (stratzVersionId && bracketData["DIVINE"][stratzVersionId]) {
            // VERIFIED MATCH
            finalWinrateData = {};
            for (const bracketName of Object.keys(BRACKETS)) {
                finalWinrateData[bracketName] = bracketData[bracketName][stratzVersionId];
            }
            console.log(`[Backfill] ${version} -> Found exact match (ID: ${stratzVersionId})`);
        } else {
            // NO MATCH - USE LATEST LIVE DATA AS REPRESENTATIVE
            // This fills the gaps for 7.41 series with the most recent performance stats
            finalWinrateData = {};
            for (const bracketName of Object.keys(BRACKETS)) {
                finalWinrateData[bracketName] = bracketData[bracketName][latestId];
            }
            console.log(`[Backfill] ${version} -> Unmapped. Using latest live period data (ID: ${latestId})`);
        }

        const outPath = path.join(OUTPUT_DIR, `winrates-${version}.json`);
        await writeFile(outPath, JSON.stringify(finalWinrateData, null, 2), "utf8");
        
        const patchRecord = await prisma.patch.findUnique({ where: { version } });
        if (patchRecord) {
            await prisma.winrateSnapshot.deleteMany({ where: { patchId: patchRecord.id } });
            await updateDatabase(patchRecord.id, finalWinrateData, heroMapping);
        }
    }

    console.log("[Backfill] Completed. Current period data restored to all recent patches.");
    await prisma.$disconnect();
}

main().catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
});
