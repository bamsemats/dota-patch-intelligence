// apps/scripts/factChecker.ts

import { readFile, readdir } from "node:fs/promises";
import * as path from "node:path";

const MAPPINGS_DIR = path.resolve("research-output", "mappings");
const META_DIR = path.resolve("research-output", "meta-analysis");

interface Mappings {
    heroes: Set<string>;
    abilities: Set<string>;
    items: Set<string>;
}

async function loadMappings(): Promise<Mappings> {
    const heroes = JSON.parse(await readFile(path.join(MAPPINGS_DIR, "heroes.json"), "utf8"));
    const abilities = JSON.parse(await readFile(path.join(MAPPINGS_DIR, "abilities.json"), "utf8"));
    const items = JSON.parse(await readFile(path.join(MAPPINGS_DIR, "items.json"), "utf8"));

    return {
        heroes: new Set(Object.values(heroes) as string[]),
        abilities: new Set(Object.values(abilities) as string[]),
        items: new Set(Object.values(items) as string[])
    };
}

const ALLOWED_ENTITIES = new Set([
    "Watchers", "Tormentor", "Tormentors", "Wisdom Rune", "Wisdom Runes", 
    "Lotus Pool", "Lotus Pools", "Twin Gate", "Twin Gates", "New Frontiers",
    "Universal Heroes", "Universal Hero Archetype", "Map Expansion", "Roshan",
    "Aghanim's Shard", "Aghanim's Scepter", "Talents", "Attributes"
]);

function checkEntity(entity: string, mappings: Mappings): { valid: boolean; type?: string } {
    if (mappings.heroes.has(entity)) return { valid: true, type: "Hero" };
    if (mappings.items.has(entity)) return { valid: true, type: "Item" };
    if (mappings.abilities.has(entity)) return { valid: true, type: "Ability" };
    if (ALLOWED_ENTITIES.has(entity)) return { valid: true, type: "Mechanic" };
    return { valid: false };
}

async function main() {
    console.log("[FactChecker] Loading mappings...");
    const mappings = await loadMappings();

    const files = (await readdir(META_DIR)).filter(f => f.startsWith("meta-") && f.endsWith(".json"));
    console.log(`[FactChecker] Validating ${files.length} analysis files...`);

    let totalErrors = 0;

    for (const file of files) {
        const filePath = path.join(META_DIR, file);
        const analysis = JSON.parse(await readFile(filePath, "utf8"));
        const version = file.replace("meta-", "").replace(".json", "");

        const errors: string[] = [];

        // Check synergistic winners/losers
        [...analysis.synergisticWinners, ...analysis.synergisticLosers].forEach((s: any) => {
            const { valid, type } = checkEntity(s.entity, mappings);
            if (!valid) {
                errors.push(`Invalid Entity: "${s.entity}" in Synergistic Winners/Losers`);
            }
        });

        // Check role-specific winners/losers
        const roles = ["Carry", "Mid", "Offlane", "SoftSupport", "HardSupport"];
        roles.forEach(role => {
            const winners = analysis.roleSpecificWinners?.[role] || [];
            const losers = analysis.roleSpecificLosers?.[role] || [];

            [...winners, ...losers].forEach((entry: any) => {
                if (!mappings.heroes.has(entry.hero)) {
                    errors.push(`Invalid Hero: "${entry.hero}" in ${role} section`);
                }
            });
        });

        // Specific Hallucination Checks
        const analysisString = JSON.stringify(analysis);
        if (analysisString.includes("Intelligence form") || analysisString.includes("Intelligence Shift")) {
            if (analysisString.includes("Morphling")) {
                errors.push(`CRITICAL HALLUCINATION: Mentioned "Intelligence form/shift" for Morphling`);
            }
        }

        if (errors.length > 0) {
            console.error(`\n[FactChecker] Errors found in ${version}:`);
            errors.forEach(err => console.error(`  - ${err}`));
            totalErrors += errors.length;
        }
    }

    if (totalErrors === 0) {
        console.log("\n[FactChecker] Success: All files passed factual grounding validation.");
    } else {
        console.error(`\n[FactChecker] Failed: ${totalErrors} factual errors detected.`);
        process.exit(1);
    }
}

main().catch(console.error);
