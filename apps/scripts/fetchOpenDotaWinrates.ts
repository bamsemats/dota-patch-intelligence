// apps/scripts/fetchOpenDotaWinrates.ts

import { mkdir, writeFile } from "node:fs/promises";
import * as path from "node:path";

const OUTPUT_DIR = path.resolve("research-output", "calibration-data");
const OPENDOTA_HERO_STATS_URL = "https://api.opendota.com/api/heroStats";

const BRACKETS = {
    HERALD: 1,
    GUARDIAN: 2,
    CRUSADER: 3,
    ARCHON: 4,
    LEGEND: 5,
    ANCIENT: 6,
    DIVINE: 7
};

async function main() {
    const targetPatch = process.argv[2] || "7.41d";
    console.log("=========================================");
    console.log(`   OpenDota Winrate Fetcher (${targetPatch})   `);
    console.log("=========================================\n");

    try {
        await mkdir(OUTPUT_DIR, { recursive: true });

        console.log(`[OpenDota] Fetching current hero stats...`);
        const response = await fetch(OPENDOTA_HERO_STATS_URL);
        
        if (!response.ok) {
            throw new Error(`OpenDota API Error: ${response.status} ${response.statusText}`);
        }

        const stats = await response.json();
        const patchData: Record<string, any> = {};

        // Initialize brackets
        for (const bracketName of Object.keys(BRACKETS)) {
            patchData[bracketName] = {};
        }

        for (const hero of stats) {
            const heroId = hero.id;
            
            for (const [bracketName, openDotaId] of Object.entries(BRACKETS)) {
                const picks = hero[`${openDotaId}_pick`] || 0;
                const wins = hero[`${openDotaId}_win`] || 0;
                const winrate = picks > 0 ? (wins / picks) : 0;
                
                patchData[bracketName][heroId] = {
                    winrate: parseFloat(winrate.toFixed(4)),
                    matchCount: picks
                };
            }
        }

        const outputPath = path.join(OUTPUT_DIR, `winrates-${targetPatch}.json`);
        await writeFile(outputPath, JSON.stringify(patchData, null, 2), "utf8");
        
        console.log(`✔️  Success: Processed ${stats.length} heroes.`);
        console.log(`🎉 Saved to ${outputPath}`);
    } catch (error: any) {
        console.error("❌ Failed to fetch winrates:", error.message);
        process.exit(1);
    }
}

main().catch(console.error);
