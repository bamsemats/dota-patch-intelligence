// apps/scripts/fetchMappings.ts

import { mkdir, writeFile, readFile, access } from "node:fs/promises";
import * as path from "node:path";

const MAPPINGS_DIR = path.resolve("research-output", "mappings");

async function fileExists(filePath: string): Promise<boolean> {
    try {
        await access(filePath);
        return true;
    } catch {
        return false;
    }
}

async function fetchJson(url: string): Promise<any> {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
    }
    return await response.json();
}

async function fetchHeroList(): Promise<any> {
    console.log("[Mappings] Fetching hero list...");
    return await fetchJson("https://www.dota2.com/datafeed/herolist?language=english");
}

async function fetchHeroData(heroId: number): Promise<any> {
    return await fetchJson(`https://www.dota2.com/datafeed/herodata?language=english&hero_id=${heroId}`);
}

async function fetchItemList(): Promise<any> {
    console.log("[Mappings] Fetching item list...");
    return await fetchJson("https://www.dota2.com/datafeed/itemlist?language=english");
}

async function main() {
    await mkdir(MAPPINGS_DIR, { recursive: true });
    
    const forceRefresh = process.argv.includes("--force");
    const heroesFile = path.join(MAPPINGS_DIR, "heroes.json");
    
    if (!forceRefresh && await fileExists(heroesFile)) {
        console.log("[Mappings] Cached mappings found. Use --force to refresh.");
        return;
    }

    const heroResponse = await fetchHeroList();
    const heroes = heroResponse.result?.data?.heroes;
    
    if (!heroes || !Array.isArray(heroes)) {
        throw new Error("Invalid hero list data format received.");
    }
    
    const heroMap: Record<number, string> = {};
    const abilityMap: Record<number, string> = {};

    for (const hero of heroes) {
        heroMap[hero.id] = hero.name_english_loc;
        console.log(`[Mappings] Fetching abilities for ${hero.name_english_loc}...`);
        
        try {
            const heroDataResponse = await fetchHeroData(hero.id);
            const heroData = heroDataResponse.result?.data?.heroes?.[0];
            
            if (heroData && heroData.abilities) {
                for (const ability of heroData.abilities) {
                    abilityMap[ability.id] = ability.name_loc;
                }
            }
            if (heroData && heroData.talents) {
                for (const talent of heroData.talents) {
                    abilityMap[talent.id] = talent.name_loc;
                }
            }
        } catch (error) {
            console.error(`[Mappings] Error fetching data for hero ${hero.id}:`, error);
        }
    }

    const itemResponse = await fetchItemList();
    const items = itemResponse.result?.data?.itemabilities;
    const itemMap: Record<number, string> = {};

    if (items && Array.isArray(items)) {
        for (const item of items) {
            itemMap[item.id] = item.name_loc;
        }
    } else {
         console.warn("[Mappings] Warning: Invalid or missing item data.");
    }

    // Validation
    if (Object.keys(heroMap).length === 0) throw new Error("Validation Failed: No heroes mapped.");
    if (Object.keys(itemMap).length === 0) throw new Error("Validation Failed: No items mapped.");

    await writeFile(heroesFile, JSON.stringify(heroMap, null, 2), "utf8");
    await writeFile(path.join(MAPPINGS_DIR, "abilities.json"), JSON.stringify(abilityMap, null, 2), "utf8");
    await writeFile(path.join(MAPPINGS_DIR, "items.json"), JSON.stringify(itemMap, null, 2), "utf8");

    console.log(`\n[Summary] Successfully updated mappings:`);
    console.log(`- Heroes: ${Object.keys(heroMap).length}`);
    console.log(`- Abilities/Talents: ${Object.keys(abilityMap).length}`);
    console.log(`- Items: ${Object.keys(itemMap).length}`);
}

main().catch((error) => {
    console.error("[Error] Fatal error fetching mappings:", error);
    process.exit(1);
});
