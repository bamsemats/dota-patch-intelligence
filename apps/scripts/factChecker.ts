// apps/scripts/factChecker.ts

import { readFile, readdir, writeFile } from "node:fs/promises";
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
    "Aghanim's Shard", "Aghanim's Scepter", "Talents", "Attributes",
    "Outpost", "Outposts", "Bounty Rune", "Bounty Runes", "Power Rune", "Power Runes",
    "River", "High Ground", "Jungle", "Ancient", "Ancients", "Neutral Creeps",
    "Glyph of Fortification", "Scan", "Courier", "Backdoor Protection",
    "Spell Immunity", "Debuff Immunity", "Pure Damage", "Magic Resistance",
    "Armor", "Strength", "Agility", "Intelligence", "Movement Speed",
    "Attack Range", "Cast Range", "Cooldown Reduction", "Mana Cost",
    "Health Regeneration", "Mana Regeneration", "Lifesteal", "Spell Lifesteal"
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
    let modifiedFiles = 0;

    for (const file of files) {
        const filePath = path.join(META_DIR, file);
        const analysis = JSON.parse(await readFile(filePath, "utf8"));
        const version = file.replace("meta-", "").replace(".json", "");
        let fileModified = false;
        let hallucinatedEntities = new Set<string>();

        const errors: string[] = [];

        // 1. Surgical Removal from Synergistic Lists
        const originalWinnersCount = analysis.synergisticWinners.length;
        analysis.synergisticWinners = analysis.synergisticWinners.filter((s: any) => {
            const { valid } = checkEntity(s.entity, mappings);
            if (!valid) {
                errors.push(`Removed Invalid Entity: "${s.entity}" from Synergistic Winners`);
                hallucinatedEntities.add(s.entity);
                fileModified = true;
                return false;
            }
            return true;
        });

        const originalLosersCount = analysis.synergisticLosers.length;
        analysis.synergisticLosers = analysis.synergisticLosers.filter((s: any) => {
            const { valid } = checkEntity(s.entity, mappings);
            if (!valid) {
                errors.push(`Removed Invalid Entity: "${s.entity}" from Synergistic Losers`);
                hallucinatedEntities.add(s.entity);
                fileModified = true;
                return false;
            }
            return true;
        });

        // 2. Surgical Removal from Role Lists
        const roles = ["Carry", "Mid", "Offlane", "SoftSupport", "HardSupport"];
        roles.forEach(role => {
            if (analysis.roleSpecificWinners && analysis.roleSpecificWinners[role]) {
                analysis.roleSpecificWinners[role] = analysis.roleSpecificWinners[role].filter((entry: any) => {
                    if (!mappings.heroes.has(entry.hero)) {
                        errors.push(`Removed Invalid Hero: "${entry.hero}" from ${role} Winners`);
                        hallucinatedEntities.add(entry.hero);
                        fileModified = true;
                        return false;
                    }
                    return true;
                });
            }
            
            if (analysis.roleSpecificLosers && analysis.roleSpecificLosers[role]) {
                analysis.roleSpecificLosers[role] = analysis.roleSpecificLosers[role].filter((entry: any) => {
                    if (!mappings.heroes.has(entry.hero)) {
                        errors.push(`Removed Invalid Hero: "${entry.hero}" from ${role} Losers`);
                        hallucinatedEntities.add(entry.hero);
                        fileModified = true;
                        return false;
                    }
                    return true;
                });
            }
        });

        // 3. Cross-Validation Discard (Text summaries mentioning hallucinations)
        if (hallucinatedEntities.size > 0 && analysis.metaShifts) {
            analysis.metaShifts = analysis.metaShifts.filter((shift: any) => {
                let keep = true;
                hallucinatedEntities.forEach(he => {
                    if (shift.description.includes(he) || shift.theme.includes(he)) {
                        errors.push(`Discarded Meta Shift "${shift.theme}" due to hallucination reference: "${he}"`);
                        keep = false;
                        fileModified = true;
                    }
                });
                return keep;
            });
        }

        // Specific Hardcoded Hallucination Checks
        const analysisString = JSON.stringify(analysis);
        if (analysisString.includes("Intelligence form") || analysisString.includes("Intelligence Shift")) {
            if (analysisString.includes("Morphling")) {
                errors.push(`CRITICAL HALLUCINATION: Mentioned "Intelligence form/shift" for Morphling`);
                // In extreme cases, flag as fully hallucinated
                analysis.validationState = "HALLUCINATED";
                fileModified = true;
            }
        }

        if (fileModified) {
            analysis.validationState = analysis.validationState === "HALLUCINATED" ? "HALLUCINATED" : "PARTIALLY_VALIDATED";
            await writeFile(filePath, JSON.stringify(analysis, null, 2), "utf8");
            console.error(`\n[FactChecker] Surgically edited ${version} (Validation State: ${analysis.validationState}):`);
            errors.forEach(err => console.error(`  - ${err}`));
            totalErrors += errors.length;
            modifiedFiles++;
        } else {
             analysis.validationState = "VALIDATED";
             // Optional: save back the validated state
             await writeFile(filePath, JSON.stringify(analysis, null, 2), "utf8");
        }
    }

    if (totalErrors === 0) {
        console.log("\n[FactChecker] Success: All files are structurally clean.");
    } else {
        console.log(`\n[FactChecker] Completed: Surgically removed ${totalErrors} hallucinated entries across ${modifiedFiles} files.`);
    }
}

main().catch(console.error);
