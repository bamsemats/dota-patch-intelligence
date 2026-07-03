// apps/scripts/fetchWeeklyWinrate.ts

import { mkdir, writeFile } from "node:fs/promises";
import * as path from "node:path";

const OUTPUT_DIR = path.resolve("research-output", "weekly-winrates");
const OPENDOTA_HERO_STATS_URL = "https://api.opendota.com/api/heroStats";

const BRACKETS = {
    HERALD: 1,
    GUARDIAN: 2,
    CRUSADER: 3,
    ARCHON: 4,
    LEGEND: 5,
    ANCIENT: 6,
    DIVINE: 7,
    IMMORTAL: 8
};

async function main() {
    const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
    console.log("=========================================");
    console.log(`   Weekly Winrate Snapshot (${today})   `);
    console.log("=========================================\n");

    try {
        await mkdir(OUTPUT_DIR, { recursive: true });

        console.log(`[Weekly] Fetching current hero stats from OpenDota...`);
        const response = await fetch(OPENDOTA_HERO_STATS_URL);
        if (!response.ok) {
            throw new Error(`OpenDota API Error: ${response.status} ${response.statusText}`);
        }

        const stats = await response.json();
        const winrateData: Record<string, Record<string, number>> = {};

        // Initialize ranks
        const ranks = [...Object.keys(BRACKETS), "PRO", "GLOBAL_BLEND"];
        for (const rank of ranks) {
            winrateData[rank] = {};
        }

        for (const hero of stats) {
            const heroId = String(hero.id);
            
            // Standard Brackets
            for (const [bracketName, openDotaId] of Object.entries(BRACKETS)) {
                const picks = hero[`${openDotaId}_pick`] || 0;
                const wins = hero[`${openDotaId}_win`] || 0;
                winrateData[bracketName][heroId] = picks > 0 ? parseFloat((wins / picks).toFixed(4)) : 0;
            }

            // Pro Bracket
            const proPicks = hero.pro_pick || 0;
            const proWins = hero.pro_win || 0;
            winrateData["PRO"][heroId] = proPicks > 0 ? parseFloat((proWins / proPicks).toFixed(4)) : 0;

            // Global Blend
            const divinePicks = hero[`7_pick`] || 0;
            const divineWins = hero[`7_win`] || 0;
            const immortalPicks = hero[`8_pick`] || 0;
            const immortalWins = hero[`8_win`] || 0;

            const totalPicks = divinePicks + immortalPicks + (proPicks * 5);
            const totalWins = divineWins + immortalWins + (proWins * 5);
            winrateData["GLOBAL_BLEND"][heroId] = totalPicks > 0 ? parseFloat((totalWins / totalPicks).toFixed(4)) : 0;
        }

        const outputPath = path.join(OUTPUT_DIR, `winrates-${today}.json`);
        await writeFile(outputPath, JSON.stringify(winrateData, null, 2), "utf8");
        
        console.log(`✔️  Success: Stored weekly winrates snapshot to ${outputPath}`);
    } catch (error: any) {
        console.error("❌ Failed to fetch weekly winrates:", error.message);
        process.exit(1);
    }
}

main().catch(console.error);
