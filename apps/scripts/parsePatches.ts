// apps/scripts/parsePatches.ts

import { mkdir, writeFile, readFile, readdir } from "node:fs/promises";
import * as path from "node:path";

interface Mapping {
    heroes: Record<number, string>;
    abilities: Record<number, string>;
    items: Record<number, string>;
}

interface StructuredChange {
    category: "hero" | "item" | "neutral" | "general";
    entityName: string;
    subEntityName?: string;
    rawNote: string;      // The cleaned display note
    originalSource: string; // The 100% raw Valve source (ISSUE-5)
    indentLevel: number;
    metric?: string;
    changeType?: "INCREASE" | "DECREASE" | "RESCALE" | "REWORK" | "ADDITION" | "REMOVAL" | "ADJUSTMENT";
    oldValue?: string;
    newValue?: string;
    metadata: {
        entityId?: number;
        subEntityId?: number;
    };
}

interface StructuredPatch {
    schemaVersion: string;
    version: string;
    changes: StructuredChange[];
}

const PATCHES_DIR = path.resolve("research-output", "patches");
const MAPPINGS_DIR = path.resolve("research-output", "mappings");
const OUTPUT_DIR = path.resolve("research-output", "structured-patches");

async function loadMappings(): Promise<Mapping> {
    const heroes = JSON.parse(await readFile(path.join(MAPPINGS_DIR, "heroes.json"), "utf8"));
    const abilities = JSON.parse(await readFile(path.join(MAPPINGS_DIR, "abilities.json"), "utf8"));
    const items = JSON.parse(await readFile(path.join(MAPPINGS_DIR, "items.json"), "utf8"));
    return { heroes, abilities, items };
}

function decomposeNote(note: string): Partial<StructuredChange> {
    // Detect structural headers before stripping HTML
    if (note.includes('class="Subtitle"')) {
        return { changeType: "SECTION_HEADER" as any };
    }

    const cleanNote = note.replace(/<[^>]*>/g, "").trim().replace(/\.$/, ""); // remove trailing dot
    
    // Pattern: X replaced with Y
    const replacedMatch = cleanNote.match(/^(.+?)\s+replaced\s+with\s+(.+)$/i);
    if (replacedMatch) {
        return {
            metric: replacedMatch[1].trim(),
            changeType: "REWORK",
            newValue: replacedMatch[2].trim()
        };
    }

    // Pattern 1: X increased/decreased/improved/worsened/reduced from Y to Z
    const incDecMatch = cleanNote.match(/^(.+?)\s+(increased|decreased|improved|worsened|reduced|rescaled)\s+(?:from\s+)?(.+?)\s+to\s+(.+)$/i);
    if (incDecMatch) {
        const typeStr = incDecMatch[2].toUpperCase();
        let cType: any = "ADJUSTMENT";
        if (typeStr === "INCREASED" || typeStr === "IMPROVED") cType = "INCREASED";
        if (typeStr === "DECREASED" || typeStr === "WORSENED" || typeStr === "REDUCED") cType = "DECREASED";
        if (typeStr === "RESCALED") cType = "RESCALE";
        
        return {
            metric: incDecMatch[1].trim(),
            changeType: cType,
            oldValue: incDecMatch[3].trim(),
            newValue: incDecMatch[4].trim()
        };
    }

    // Pattern 3: X increased/decreased/reduced by Y
    const byMatch = cleanNote.match(/^(.+?)\s+(increased|decreased|reduced)\s+by\s+(.+)$/i);
    if (byMatch) {
        const typeStr = byMatch[2].toUpperCase();
        return {
            metric: byMatch[1].trim(),
            changeType: typeStr === "REDUCED" ? "DECREASED" : typeStr as any,
            newValue: byMatch[3].trim()
        };
    }

    // Pattern 4: Now grants/provides/also (Addition)
    if (cleanNote.toLowerCase().startsWith("now ") || cleanNote.toLowerCase().includes(" grants ") || cleanNote.toLowerCase().includes(" now also ")) {
        return { changeType: "ADDITION" };
    }

    // Pattern 5: No longer (Removal)
    if (cleanNote.toLowerCase().includes("no longer") || cleanNote.toLowerCase().includes(" removed")) {
        return { changeType: "REMOVAL" };
    }

    // Pattern 6: New ability/feature
    if (cleanNote.toLowerCase().startsWith("new ") || cleanNote.toLowerCase() === "new ability") {
        return { changeType: "ADDITION" };
    }

    return { changeType: "ADJUSTMENT" };
}

function processNotes(notes: any[], category: any, entityName: string, entityId: number | undefined, subEntityName: string | undefined, subEntityId: number | undefined): StructuredChange[] {
    if (!notes) return [];
    
    return notes
        .filter(n => {
            // Drop notes that are just HTML artifacts like "<br>" or empty spaces
            const clean = (n.note || "").replace(/<[^>]*>/g, "").trim();
            return clean.length > 0;
        })
        .map(n => {
            const decomposition = decomposeNote(n.note);
            // Clean the display note: strip HTML and trailing dots
            const cleanedDisplayNote = n.note.replace(/<[^>]*>/g, "").trim().replace(/\.$/, "");

            return {
                category,
                entityName,
                subEntityName,
                rawNote: cleanedDisplayNote,
                originalSource: n.note, // Preservation (ISSUE-5)
                indentLevel: n.indent_level || 0,
                ...decomposition,
                metadata: {
                    entityId,
                    subEntityId
                }
            };
        });
}

async function parsePatch(version: string, mapping: Mapping): Promise<StructuredPatch | null> {
    const dataPath = path.join(PATCHES_DIR, version, "data.json");
    try {
        const rawData = JSON.parse(await readFile(dataPath, "utf8"));
        const changes: StructuredChange[] = [];

        // 1. General Notes
        if (rawData.general_notes) {
            for (const section of rawData.general_notes) {
                if (section.generic) {
                    changes.push(...processNotes(section.generic, "general", section.title || "General", undefined, undefined, undefined));
                }
            }
        }

        // 2. Items (Valve uses "ability_id" for items here)
        if (rawData.items) {
            for (const item of rawData.items) {
                const itemId = item.ability_id;
                const itemName = mapping.items[itemId] || `Unknown Item (${itemId})`;
                if (item.ability_notes) {
                    changes.push(...processNotes(item.ability_notes, "item", itemName, itemId, undefined, undefined));
                }
            }
        }

        // 3. Neutral Items
        if (rawData.neutral_items) {
            for (const item of rawData.neutral_items) {
                const itemId = item.ability_id;
                const itemName = mapping.items[itemId] || `Unknown Neutral (${itemId})`;
                if (item.ability_notes) {
                    changes.push(...processNotes(item.ability_notes, "neutral", itemName, itemId, undefined, undefined));
                }
            }
        }

        // 4. Heroes
        if (rawData.heroes) {
            for (const hero of rawData.heroes) {
                const heroName = mapping.heroes[hero.hero_id] || `Unknown Hero (${hero.hero_id})`;
                
                // Hero base changes
                if (hero.hero_notes) {
                    changes.push(...processNotes(hero.hero_notes, "hero", heroName, hero.hero_id, undefined, undefined));
                }

                // Ability changes
                if (hero.abilities) {
                    for (const ability of hero.abilities) {
                        const abilityName = mapping.abilities[ability.ability_id] || `Unknown Ability (${ability.ability_id})`;
                        if (ability.ability_notes) {
                            changes.push(...processNotes(ability.ability_notes, "hero", heroName, hero.hero_id, abilityName, ability.ability_id));
                        }
                    }
                }

                // Talent changes (talent_notes is a direct array of notes in some versions)
                if (hero.talent_notes) {
                    changes.push(...processNotes(hero.talent_notes, "hero", heroName, hero.hero_id, "Talents", undefined));
                }
            }
        }

        return { schemaVersion: "1.0", version, changes };
    } catch (error) {
        console.error(`[Parser] Error parsing version ${version}:`, error);
        return null;
    }
}

async function main() {
    const mapping = await loadMappings();
    await mkdir(OUTPUT_DIR, { recursive: true });

    const versions = await readdir(PATCHES_DIR);
    console.log(`[Parser] Found ${versions.length} patches to parse.`);

    for (const version of versions) {
        console.log(`[Parser] Processing ${version}...`);
        const structured = await parsePatch(version, mapping);
        if (structured) {
            await writeFile(
                path.join(OUTPUT_DIR, `${version}.json`),
                JSON.stringify(structured, null, 2),
                "utf8"
            );
        }
    }

    console.log(`\n[Summary] Successfully parsed ${versions.length} patches into structured JSON.`);
}

main().catch(error => {
    console.error("[Error] Fatal error in parser:", error);
    process.exit(1);
});
