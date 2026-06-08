// apps/scripts/classifyPatches.ts

import { mkdir, writeFile, readFile, readdir } from "node:fs/promises";
import * as path from "node:path";

const INPUT_DIR = path.resolve("research-output", "structured-patches");
const OUTPUT_DIR = path.resolve("research-output", "classified-patches");

type ClassificationType = "Buff" | "Nerf" | "Rework" | "Adjustment" | "New" | "Removed";

interface Classification {
    classificationType: ClassificationType;
    confidenceScore: number;
    reasoning: string;
}

// Certain metrics denote a negative property where an "INCREASE" is actually a Nerf (e.g., Cooldown).
const NEGATIVE_METRICS = [
    "cooldown", 
    "mana cost", 
    "cast point", 
    "cast animation", 
    "delay", 
    "respawn", 
    "gold cost", 
    "recipe cost", 
    "total cost",
    "turn rate",
    "penalty"
];

// Certain metrics are positive where an "INCREASE" is a Buff (e.g., Damage, Armor)
const POSITIVE_METRICS = [
    "damage",
    "health",
    "mana",
    "regen",
    "armor",
    "speed",
    "range",
    "radius",
    "duration",
    "strength",
    "agility",
    "intelligence",
    "all attributes",
    "slow", // increasing a slow on an enemy is a buff
    "stun",
    "evasion",
    "lifesteal",
    "cleave",
    "bonus",
    "multiplier",
    "amplification",
    "resistance"
];

function determineClassification(change: any): Classification {
    const changeType = change.changeType;
    const metricStr = (change.metric || "").toLowerCase();

    // 1. Explicit Feature Handling
    if (changeType === "ADDITION") {
        return {
            classificationType: "Buff", // or 'New' if it's a completely new entity, but for changes it's a buff
            confidenceScore: 0.9,
            reasoning: "Addition of a new mechanic, feature, or scaling is generally a buff."
        };
    }

    if (changeType === "REMOVAL") {
        return {
            classificationType: "Nerf", // or 'Removed'
            confidenceScore: 0.9,
            reasoning: "Removal of a mechanic or scaling is generally a nerf."
        };
    }

    if (changeType === "REWORK") {
        return {
            classificationType: "Rework",
            confidenceScore: 1.0,
            reasoning: "Explicitly designated as a replacement or rework."
        };
    }

    if (changeType === "RESCALE") {
        return {
            classificationType: "Adjustment",
            confidenceScore: 0.8,
            reasoning: "Rescaling redistributes power across levels and requires contextual analysis."
        };
    }

    // 2. Deterministic Metric Logic
    if (changeType === "INCREASED" || changeType === "DECREASED") {
        if (!metricStr) {
            return {
                classificationType: "Adjustment",
                confidenceScore: 0.5,
                reasoning: "No metric identified to determine power shift direction."
            };
        }

        const isNegativeMetric = NEGATIVE_METRICS.some(m => metricStr.includes(m));
        const isPositiveMetric = POSITIVE_METRICS.some(m => metricStr.includes(m));

        if (changeType === "INCREASED") {
            if (isNegativeMetric) {
                return { classificationType: "Nerf", confidenceScore: 1.0, reasoning: `Increased a negative metric (${metricStr}).` };
            }
            if (isPositiveMetric) {
                return { classificationType: "Buff", confidenceScore: 1.0, reasoning: `Increased a positive metric (${metricStr}).` };
            }
        }

        if (changeType === "DECREASED") {
            if (isNegativeMetric) {
                return { classificationType: "Buff", confidenceScore: 1.0, reasoning: `Decreased a negative metric (${metricStr}).` };
            }
            if (isPositiveMetric) {
                return { classificationType: "Nerf", confidenceScore: 1.0, reasoning: `Decreased a positive metric (${metricStr}).` };
            }
        }
    }

    // Fallback
    return {
        classificationType: "Adjustment",
        confidenceScore: 0.5,
        reasoning: "Could not deterministically classify based on metric rules."
    };
}

async function classifyPatch(filePath: string) {
    const data = JSON.parse(await readFile(filePath, "utf8"));
    const classifiedChanges = data.changes.map((change: any) => ({
        ...change,
        classification: determineClassification(change)
    }));

    return {
        schemaVersion: data.schemaVersion,
        version: data.version,
        changes: classifiedChanges
    };
}

async function main() {
    await mkdir(OUTPUT_DIR, { recursive: true });

    const files = await readdir(INPUT_DIR);
    console.log(`[Classifier] Found ${files.length} patches to classify.`);

    let totalClassified = 0;
    const typeCounts: Record<string, number> = { Buff: 0, Nerf: 0, Rework: 0, Adjustment: 0, New: 0, Removed: 0 };

    for (const file of files) {
        if (!file.endsWith(".json")) continue;

        console.log(`[Classifier] Processing ${file}...`);
        const classifiedPatch = await classifyPatch(path.join(INPUT_DIR, file));
        
        await writeFile(
            path.join(OUTPUT_DIR, file),
            JSON.stringify(classifiedPatch, null, 2),
            "utf8"
        );

        classifiedPatch.changes.forEach((c: any) => {
            totalClassified++;
            typeCounts[c.classification.classificationType]++;
        });
    }

    console.log(`\n[Summary] Successfully classified ${totalClassified} changes.`);
    for (const [type, count] of Object.entries(typeCounts)) {
        if (count > 0) {
            console.log(`- ${type}: ${count} (${((count / totalClassified) * 100).toFixed(1)}%)`);
        }
    }
}

main().catch(error => {
    console.error("[Error] Fatal error in classifier:", error);
    process.exit(1);
});
