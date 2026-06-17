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
    DIVINE: 7,
    IMMORTAL: 8 // OpenDota 8 is Immortal
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
        patchData["PRO"] = {};
        patchData["GLOBAL_BLEND"] = {}; // ISSUE-6: New Global Blend

        for (const hero of stats) {
            const heroId = hero.id;
            
            // Standard Brackets
            for (const [bracketName, openDotaId] of Object.entries(BRACKETS)) {
                const picks = hero[`${openDotaId}_pick`] || 0;
                const wins = hero[`${openDotaId}_win`] || 0;
                const winrate = picks > 0 ? (wins / picks) : 0;
                
                patchData[bracketName][heroId] = {
                    winrate: parseFloat(winrate.toFixed(4)),
                    matchCount: picks
                };
            }

            // Pro Bracket
            const proPicks = hero.pro_pick || 0;
            const proWins = hero.pro_win || 0;
            const proWinrate = proPicks > 0 ? (proWins / proPicks) : 0;
            patchData["PRO"][heroId] = {
                winrate: parseFloat(proWinrate.toFixed(4)),
                matchCount: proPicks
            };

            // Global Blend (Weighted average of Divine, Immortal, and Pro)
            // Giving Pro higher weight due to strategic relevance
            const divinePicks = patchData["DIVINE"][heroId].matchCount;
            const immortalPicks = patchData["IMMORTAL"][heroId].matchCount;
            
            const totalHighTierPicks = divinePicks + immortalPicks + (proPicks * 5); // Weight Pro picks 5x
            const totalHighTierWins = 
                (patchData["DIVINE"][heroId].winrate * divinePicks) + 
                (patchData["IMMORTAL"][heroId].winrate * immortalPicks) + 
                (proWinrate * proPicks * 5);

            const blendedWinrate = totalHighTierPicks > 0 ? (totalHighTierWins / totalHighTierPicks) : 0;

            patchData["GLOBAL_BLEND"][heroId] = {
                winrate: parseFloat(blendedWinrate.toFixed(4)),
                matchCount: divinePicks + immortalPicks + proPicks // Store actual count
            };
        }

        const outputPath = path.join(OUTPUT_DIR, `winrates-${targetPatch}.json`);
        await writeFile(outputPath, JSON.stringify(patchData, null, 2), "utf8");
        
        console.log(`✔️  Success: Processed ${stats.length} heroes including GLOBAL_BLEND.`);
        console.log(`🎉 Saved to ${outputPath}`);
    } catch (error: any) {
        console.error("❌ Failed to fetch winrates:", error.message);
        process.exit(1);
    }
}

main().catch(console.error);
