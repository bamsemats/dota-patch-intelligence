// apps/scripts/fetchHistoricalWinrates.ts

import { mkdir, writeFile, readFile } from "node:fs/promises";
import * as path from "node:path";

const OUTPUT_DIR = path.resolve("research-output", "calibration-data");
const MAPPINGS_DIR = path.resolve("research-output", "mappings");
const OPENDOTA_EXPLORER_URL = "https://api.opendota.com/api/explorer";

/**
 * SQL Query to fetch winrates for a specific patch version string.
 * This query joins matches, player_matches, and match_patch.
 */
function getWinrateQuery(patchVersion: string) {
    return `
SELECT 
  hero_id,
  SUM(CASE WHEN (player_slot < 128 AND radiant_win) OR (player_slot >= 128 AND NOT radiant_win) THEN 1 ELSE 0 END) as wins,
  COUNT(*) as picks
FROM matches
JOIN player_matches USING(match_id)
JOIN match_patch USING(match_id)
WHERE match_patch.patch = '${patchVersion}'
AND matches.lobby_type = 1
GROUP BY hero_id
    `.trim();
}

async function fetchHistoricalData(patchVersion: string, retries = 3) {
    const sql = getWinrateQuery(patchVersion);
    const url = `${OPENDOTA_EXPLORER_URL}?sql=${encodeURIComponent(sql)}`;
    
    console.log(`[OpenDota] Querying SQL Explorer for patch string "${patchVersion}"...`);
    
    try {
        const response = await fetch(url);
        
        if (!response.ok) {
            if (response.status === 400) {
                const err = await response.json();
                if (err.err && err.err.includes("timeout")) {
                    if (retries > 0) {
                        console.warn(`⚠️  Query timeout for ${patchVersion}. Retrying (${retries} left)...`);
                        await new Promise(r => setTimeout(r, 5000));
                        return fetchHistoricalData(patchVersion, retries - 1);
                    }
                    console.error(`❌ Permanent timeout for ${patchVersion}.`);
                    return null;
                }
            }
            const errText = await response.text();
            throw new Error(`OpenDota Explorer Error: ${response.status}\n${errText}`);
        }

        const data = await response.json();
        return data.rows || [];
    } catch (e: any) {
        if (retries > 0) {
            console.warn(`⚠️  Request failed for ${patchVersion}: ${e.message}. Retrying...`);
            await new Promise(r => setTimeout(r, 5000));
            return fetchHistoricalData(patchVersion, retries - 1);
        }
        throw e;
    }
}

async function main() {
    const targetPatches = process.argv.slice(2);
    if (targetPatches.length === 0) {
        console.error("❌ Please provide target patch versions (e.g., 7.39 7.39b)");
        process.exit(1);
    }

    console.log("=========================================");
    console.log(`   Historical Winrate SQL Fetcher        `);
    console.log("=========================================\n");

    for (const patch of targetPatches) {
        try {
            await mkdir(OUTPUT_DIR, { recursive: true });
            
            let rows = await fetchHistoricalData(patch);
            
            // FALLBACK LOGIC: If a minor patch (e.g. 7.41a) has 0 matches,
            // try to fetch the base patch (e.g. 7.41) instead of leaving it empty.
            if (rows && rows.length === 0 && patch.match(/[a-z]$/i)) {
                const baseVersion = patch.replace(/[a-z]$/i, '');
                console.log(`[Fallback] No data for ${patch}. Trying base version ${baseVersion}...`);
                rows = await fetchHistoricalData(baseVersion);
            }

            if (!rows || rows.length === 0) {
                console.log(`[Skip] No data found for ${patch} (or base version). Leaving file empty.`);
                await writeFile(path.join(OUTPUT_DIR, `winrates-${patch}.json`), JSON.stringify({}, null, 2), "utf8");
                continue;
            }

            console.log(`✔️  Retrieved historical data for ${rows.length} heroes.`);

            const patchData: Record<string, any> = {
                "PROFESSIONAL": {},
                "GLOBAL_BLEND": {} // Added to support Truth Score / Calibration (ISSUE-6/19)
            };

            for (const row of rows) {
                const heroId = row.hero_id;
                const wins = parseInt(row.wins);
                const picks = parseInt(row.picks);
                const winrate = picks > 0 ? (wins / picks) : 0;
                
                const stats = { 
                    winrate: parseFloat(winrate.toFixed(4)), 
                    matchCount: picks,
                    isHistorical: true 
                };

                patchData["PROFESSIONAL"][heroId] = stats;
                // For historical queries via SQL Explorer, we use Professional as a proxy for the Blend
                // because querying historical public matches by tier causes extreme timeouts.
                patchData["GLOBAL_BLEND"][heroId] = stats; 
            }

            const outputPath = path.join(OUTPUT_DIR, `winrates-${patch}.json`);
            await writeFile(outputPath, JSON.stringify(patchData, null, 2), "utf8");
            console.log(`🎉 Saved data to ${outputPath}`);
            
            // Respect API
            await new Promise(r => setTimeout(r, 1000));
        } catch (error: any) {
            console.error(`❌ Failed for ${patch}:`, error.message);
        }
    }
}

main().catch(console.error);
