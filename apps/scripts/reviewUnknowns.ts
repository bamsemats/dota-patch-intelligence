// apps/scripts/reviewUnknowns.ts

import { readFile, writeFile, readdir } from "node:fs/promises";
import * as path from "node:path";
import * as readline from "node:readline/promises";

const INPUT_DIR = path.resolve("research-output", "classified-patches");
const ONTOLOGY_PATH = path.resolve("research-output", "ontology", "semantic_tags.json");

interface UnknownChange {
    patch: string;
    category: string;
    entityName: string;
    subEntityName?: string;
    rawNote: string;
    currentState: string;
    currentClassification: string;
}

async function loadOntology() {
    try {
        const data = await readFile(ONTOLOGY_PATH, "utf8");
        return JSON.parse(data);
    } catch (e) {
        console.error("Could not load ontology.");
        return [];
    }
}

async function saveOntology(ontology: any[]) {
    await writeFile(ONTOLOGY_PATH, JSON.stringify(ontology, null, 2), "utf8");
    console.log("✔️  Ontology successfully saved.\n");
}

async function gatherUnknowns(filterQuery?: string): Promise<UnknownChange[]> {
    const files = await readdir(INPUT_DIR);
    const unknowns: UnknownChange[] = [];
    const seenNotes = new Set<string>(); // Deduplicate exact same strings

    // Sort files to process logically
    files.sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));

    for (const file of files) {
        if (!file.endsWith(".json")) continue;
        const data = JSON.parse(await readFile(path.join(INPUT_DIR, file), "utf8"));
        
        for (const change of data.changes) {
            const state = change.classification.state;
            const cleanNote = change.rawNote.trim().toLowerCase();
            
            let isMatch = false;
            if (filterQuery) {
                isMatch = cleanNote.includes(filterQuery.toLowerCase()) || 
                          change.entityName.toLowerCase().includes(filterQuery.toLowerCase()) || 
                          (change.subEntityName && change.subEntityName.toLowerCase().includes(filterQuery.toLowerCase()));
            } else {
                isMatch = state === "UNKNOWN" || state === "PARTIALLY_CLASSIFIED";
            }

            if (isMatch && !seenNotes.has(cleanNote)) {
                seenNotes.add(cleanNote);
                unknowns.push({
                    patch: data.version,
                    category: change.category,
                    entityName: change.entityName,
                    subEntityName: change.subEntityName,
                    rawNote: change.rawNote,
                    currentState: state,
                    currentClassification: change.classification.classificationType
                });
            }
        }
    }
    return unknowns;
}

async function main() {
    // Process filter query from command line arguments
    const args = process.argv.slice(2);
    const filterQuery = args.find(arg => !arg.startsWith("--"));

    console.log("=========================================");
    console.log("   Dota Patch Intelligence Review Tool   ");
    if (filterQuery) {
        console.log(`   Searching for: "${filterQuery}"`);
    } else {
        console.log("   Reviewing UNKNOWN & PARTIALLY_CLASSIFIED");
    }
    console.log("=========================================\n");

    const ontology = await loadOntology();
    const unknowns = await gatherUnknowns(filterQuery);

    if (unknowns.length === 0) {
        console.log("🎉 No matching changes found to review!");
        return;
    }

    console.log(`Found ${unknowns.length} unique changes to review.\n`);

    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    let reviewedCount = 0;

    for (let i = 0; i < unknowns.length; i++) {
        const change = unknowns[i];
        console.log(`-----------------------------------------`);
        console.log(`[${i + 1}/${unknowns.length}] Patch: ${change.patch} | ${change.category.toUpperCase()}`);
        console.log(`Entity: ${change.entityName} ${change.subEntityName ? `> ${change.subEntityName}` : ''}`);
        console.log(`Current: State: ${change.currentState} | Class: ${change.currentClassification}`);
        console.log(`Note:   \x1b[33m"${change.rawNote}"\x1b[0m`);
        console.log(`-----------------------------------------`);

        const action = await rl.question(`Action: [m]ap to existing tag, [c]reate new tag, [o]verride manually, [s]kip, [q]uit: `);
        const choice = action.trim().toLowerCase();

        if (choice === 'q') {
            console.log("\nExiting review tool...");
            break;
        }

        if (choice === 's') {
            console.log("Skipping...\n");
            continue;
        }

        if (choice === 'o') {
            console.log("\n--- Creating manual override ---");
            const typeOverride = await rl.question(`Classification Type (Buff, Nerf, Rework, Adjustment) or Enter to cancel: `);
            const cleanOverride = typeOverride.trim();
            if (cleanOverride && ["Buff", "Nerf", "Rework", "Adjustment"].includes(cleanOverride)) {
                const reason = await rl.question(`Enter reason for override: `);
                
                const OVERRIDES_PATH = path.resolve("research-output", "ontology", "manual_overrides.json");
                let overrides: any[] = [];
                try {
                    overrides = JSON.parse(await readFile(OVERRIDES_PATH, "utf8"));
                } catch (e) {
                    overrides = [];
                }
                
                overrides.push({
                    entityName: change.entityName,
                    rawNote: change.rawNote,
                    classificationType: cleanOverride,
                    reason: reason.trim() || "Manual override"
                });
                
                await writeFile(OVERRIDES_PATH, JSON.stringify(overrides, null, 2), "utf8");
                console.log("✔️  Manual override successfully saved to manual_overrides.json.\n");
                reviewedCount++;
            } else {
                console.log("Canceled override.\n");
            }
            continue;
        }

        if (choice === 'm') {
            console.log("\nExisting Tags:");
            ontology.forEach((tag: any, idx: number) => {
                console.log(`  ${idx + 1}. ${tag.tag}`);
            });
            const tagIdxStr = await rl.question(`\nEnter tag number (or 0 to cancel): `);
            const tagIdx = parseInt(tagIdxStr, 10) - 1;

            if (tagIdx >= 0 && tagIdx < ontology.length) {
                const newPattern = await rl.question(`Enter the exact generic phrase to match (e.g., "now pierces spell immunity"): `);
                if (newPattern.trim()) {
                    const typeOverride = await rl.question(`Classification Type (Buff, Nerf, Rework, Adjustment) or Enter for Adjustment: `);
                    const cleanOverride = typeOverride.trim();

                    const finalPattern = (cleanOverride && ["Buff", "Nerf", "Rework", "Adjustment"].includes(cleanOverride))
                        ? { pattern: newPattern.trim(), classificationType: cleanOverride }
                        : newPattern.trim();

                    ontology[tagIdx].matchPatterns.push(finalPattern);
                    await saveOntology(ontology);
                    reviewedCount++;
                }
            } else {
                console.log("Canceled mapping.\n");
            }
        }

        if (choice === 'c') {
            const newTagName = await rl.question(`Enter NEW tag name (e.g., MANA_BURN_INTERACTION): `);
            const newPattern = await rl.question(`Enter the exact generic phrase to match: `);
            const impactStr = await rl.question(`Enter impact areas (comma separated, e.g., laning, teamfight): `);
            const weightStr = await rl.question(`Enter default strategic weight (1-10): `);

            if (newTagName && newPattern) {
                const typeOverride = await rl.question(`Classification Type (Buff, Nerf, Rework, Adjustment) or Enter for Adjustment: `);
                const cleanOverride = typeOverride.trim();

                const finalPattern = (cleanOverride && ["Buff", "Nerf", "Rework", "Adjustment"].includes(cleanOverride))
                    ? { pattern: newPattern.trim(), classificationType: cleanOverride }
                    : newPattern.trim();

                ontology.push({
                    tag: newTagName.trim().toUpperCase(),
                    matchPatterns: [finalPattern],
                    impactAreas: impactStr.split(',').map(s => s.trim()),
                    defaultWeight: parseInt(weightStr, 10) || 5
                });
                await saveOntology(ontology);
                reviewedCount++;
            } else {
                console.log("Canceled creation (missing required fields).\n");
            }
        }
    }

    rl.close();
    console.log(`\nReview session complete. You processed ${reviewedCount} new ontology rules.`);
    console.log(`Remember to run 'npm run patch:classify' to apply the new rules to the dataset!`);
}

main().catch(console.error);