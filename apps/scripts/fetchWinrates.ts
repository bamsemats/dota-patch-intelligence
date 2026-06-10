// apps/scripts/fetchWinrates.ts

import { mkdir, writeFile, readFile } from "node:fs/promises";
import * as path from "node:path";

require('dotenv').config();

const OUTPUT_DIR = path.resolve("research-output", "calibration-data");
const MAPPINGS_DIR = path.resolve("research-output", "mappings");
const STRATZ_ENDPOINT = "https://api.stratz.com/graphql";
const API_KEY = process.env.STRATZ_API_KEY;

// Rate Limits: 20/sec, 250/min. 
// A 300ms delay ensures max ~200 requests per minute, safely below the 250/min threshold.
const DELAY_MS = 300;
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Stratz Brackets mapping (Rank tiers)
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
    if (!API_KEY) {
        throw new Error("STRATZ_API_KEY is not set in .env. Please add it to continue.");
    }

    const response = await fetch(STRATZ_ENDPOINT, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${API_KEY}`,
            "User-Agent": "STRATZ_API" // Required by Stratz
        },
        body: JSON.stringify({ query, variables })
    });

    if (!response.ok) {
        const text = await response.text();
        throw new Error(`Stratz API Error: ${response.status} ${response.statusText}\n${text}`);
    }

    const data = await response.json();
    if (data.errors) {
        throw new Error(`GraphQL Errors: ${JSON.stringify(data.errors, null, 2)}`);
    }

    return data;
}

// Example query to fetch winrates for a specific patch and bracket
const WINRATE_QUERY = `
query GetHeroWinrates($bracketId: RankBracket!) {
  heroStats {
    winGameVersion(bracketIds: [$bracketId], take: 5000) {
      gameVersionId
      heroId
      matchCount
      winCount
    }
  }
}
`;

async function fetchBracketData(patchVersion: string, patchId: number, bracketName: string, bracketId: number) {
    console.log(`[Stratz] Fetching data for bracket: ${bracketName}...`);
    
    // We pass the bracket name as the enum for RankBracket
    const data = await fetchStratzGraphQL(WINRATE_QUERY, { bracketId: bracketName });
    
    // Process into a simpler format: { heroId: { winrate: 0.52, matchCount: 1000 } }
    const results: Record<number, any> = {};
    
    if (data?.data?.heroStats?.winGameVersion) {
        // Filter for our target patchId
        const versionStats = data.data.heroStats.winGameVersion.filter((s: any) => s.gameVersionId === patchId);
        
        for (const stat of versionStats) {
            const winrate = stat.matchCount > 0 ? (stat.winCount / stat.matchCount) : 0;
            results[stat.heroId] = {
                winrate: parseFloat(winrate.toFixed(4)),
                matchCount: stat.matchCount
            };
        }
    }

    return results;
}

async function loadPatchMapping(): Promise<Record<string, number>> {
    try {
        const data = await readFile(path.join(MAPPINGS_DIR, "stratz_patches.json"), "utf8");
        return JSON.parse(data);
    } catch (e) {
        throw new Error("Could not load stratz_patches.json mapping file. Did you run fetchStratzPatches.ts?");
    }
}

async function main() {
    console.log("=========================================");
    console.log("   Stratz Winrate Calibration Fetcher    ");
    console.log("=========================================\n");

    if (!API_KEY) {
        console.error("❌ STRATZ_API_KEY is missing from your .env file.");
        process.exit(1);
    }

    await mkdir(OUTPUT_DIR, { recursive: true });

    const patchMap = await loadPatchMapping();
    const targetPatch = process.argv[2] || "7.41d";
    
    const patchId = patchMap[targetPatch];
    if (patchId === undefined) {
        console.error(`❌ Could not find a Stratz internal ID for patch '${targetPatch}'.`);
        process.exit(1);
    }

    console.log(`[Calibration] Initiating fetch sequence for Patch ${targetPatch} (Stratz ID: ${patchId})`);

    const patchData: Record<string, any> = {};

    for (const [bracketName, bracketId] of Object.entries(BRACKETS)) {
        try {
            const bracketData = await fetchBracketData(targetPatch, patchId, bracketName, bracketId);
            patchData[bracketName] = bracketData;
            console.log(`✔️  Success: Retrieved data for ${Object.keys(bracketData).length} heroes in ${bracketName}.`);
        } catch (error: any) {
            console.error(`❌ Failed to fetch ${bracketName}:`, error.message);
        }

        // Mandatory rate limit delay
        await sleep(DELAY_MS);
    }

    const outputPath = path.join(OUTPUT_DIR, `winrates-${targetPatch}.json`);
    await writeFile(outputPath, JSON.stringify(patchData, null, 2), "utf8");
    
    console.log(`\n🎉 Winrate data successfully saved to ${outputPath}`);
}

main().catch(console.error);