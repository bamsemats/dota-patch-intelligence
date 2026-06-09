// apps/scripts/classifyPatches.ts

import { mkdir, writeFile, readFile, readdir } from "node:fs/promises";
import * as path from "node:path";

const INPUT_DIR = path.resolve("research-output", "structured-patches");
const OUTPUT_DIR = path.resolve("research-output", "classified-patches");
const ONTOLOGY_DIR = path.resolve("research-output", "ontology");

type ClassificationType = "Buff" | "Nerf" | "Rework" | "Adjustment" | "New" | "Removed" | "Unknown";
type ChangeState = "NUMERIC" | "KNOWN_SEMANTIC" | "PARTIALLY_CLASSIFIED" | "UNKNOWN";

interface Classification {
    state: ChangeState;
    classificationType: ClassificationType;
    confidenceScore: number;
    reasoning: string;
    semanticTag?: string;
    strategicWeight?: number;
}

let semanticOntology: any[] = [];
let balanceOntology: any = {};

async function loadOntologies() {
    try {
        semanticOntology = JSON.parse(await readFile(path.join(ONTOLOGY_DIR, "semantic_tags.json"), "utf8"));
        balanceOntology = JSON.parse(await readFile(path.join(ONTOLOGY_DIR, "balance_metrics.json"), "utf8"));
        console.log("[Classifier] Ontologies loaded successfully.");
    } catch (e) {
        console.warn("[Classifier] Could not load ontologies, falling back to defaults.");
        semanticOntology = [];
        balanceOntology = { metrics: {} };
    }
}

function determineClassification(change: any): Classification {
    const changeType = change.changeType;
    const metricStr = (change.metric || "").toLowerCase();
    const rawNoteLower = change.rawNote.toLowerCase();

    // Catch structural headers that bypass the parser's HTML strip
    if (changeType === "SECTION_HEADER") {
        return {
            state: "KNOWN_SEMANTIC",
            classificationType: "Adjustment", // Treat as neutral info
            semanticTag: "STRUCTURAL_HEADER",
            strategicWeight: 0,
            confidenceScore: 1.0,
            reasoning: "Structural HTML header, not a gameplay change."
        };
    }

    // 1. Check for NUMERIC states (Deterministic via Balance Ontology)
    if (changeType === "INCREASED" || changeType === "DECREASED" || changeType === "RESCALE") {
        const metricData = balanceOntology.metrics[metricStr];
        const weight = metricData ? metricData.weight : 5; // Default weight
        
        if (changeType === "RESCALE") {
            return {
                state: "NUMERIC",
                classificationType: "Adjustment",
                confidenceScore: 0.8,
                strategicWeight: weight,
                reasoning: "Rescaling redistributes power across levels and requires contextual analysis."
            };
        }

        // We use a heuristic if metric is not mapped explicitly with polarity.
        // For MVP, we still rely on basic keyword matching for polarity if balance_ontology doesn't define it.
        const isNegativeMetric = ["cooldown", "mana cost", "cast point", "delay", "cost", "penalty"].some(m => metricStr.includes(m));
        const isPositiveMetric = ["damage", "health", "mana", "armor", "speed", "range", "duration", "strength", "agility", "intelligence", "radius", "regen"].some(m => metricStr.includes(m));

        if (changeType === "INCREASED") {
            if (isNegativeMetric) return { state: "NUMERIC", classificationType: "Nerf", confidenceScore: 1.0, strategicWeight: weight, reasoning: `Increased a negative metric (${metricStr}).` };
            if (isPositiveMetric) return { state: "NUMERIC", classificationType: "Buff", confidenceScore: 1.0, strategicWeight: weight, reasoning: `Increased a positive metric (${metricStr}).` };
        }

        if (changeType === "DECREASED") {
            if (isNegativeMetric) return { state: "NUMERIC", classificationType: "Buff", confidenceScore: 1.0, strategicWeight: weight, reasoning: `Decreased a negative metric (${metricStr}).` };
            if (isPositiveMetric) return { state: "NUMERIC", classificationType: "Nerf", confidenceScore: 1.0, strategicWeight: weight, reasoning: `Decreased a positive metric (${metricStr}).` };
        }
        
        // Numeric but ambiguous polarity
        return {
            state: "NUMERIC",
            classificationType: "Adjustment",
            confidenceScore: 0.5,
            strategicWeight: weight,
            reasoning: "Numeric change, but polarity could not be deterministically resolved."
        };
    }

    // Explicit Feature Handling (Rework/Add/Remove)
    if (changeType === "REWORK") return { state: "KNOWN_SEMANTIC", classificationType: "Rework", confidenceScore: 1.0, reasoning: "Explicitly designated as a replacement or rework." };
    if (changeType === "ADDITION") return { state: "KNOWN_SEMANTIC", classificationType: "Buff", confidenceScore: 0.9, reasoning: "Addition of a new mechanic or feature." };
    if (changeType === "REMOVAL") return { state: "KNOWN_SEMANTIC", classificationType: "Nerf", confidenceScore: 0.9, reasoning: "Removal of a mechanic or feature." };

    // 2. Check Semantic Ontology for KNOWN_SEMANTIC
    for (const entry of semanticOntology) {
        for (const pattern of entry.matchPatterns) {
            if (rawNoteLower.includes(pattern.toLowerCase())) {
                return {
                    state: "KNOWN_SEMANTIC",
                    classificationType: "Adjustment", // Polarity often depends on context for semantic changes
                    semanticTag: entry.tag,
                    strategicWeight: entry.defaultWeight,
                    confidenceScore: 0.95,
                    reasoning: `Matches semantic pattern: "${pattern}"`
                };
            }
        }
    }

    // 3. Fallback to UNKNOWN (Human Review Required)
    return {
        state: "UNKNOWN",
        classificationType: "Unknown",
        confidenceScore: 0.0,
        reasoning: "Change did not match any numeric metrics or semantic ontology patterns. Requires human review."
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
    await loadOntologies();
    await mkdir(OUTPUT_DIR, { recursive: true });

    const files = await readdir(INPUT_DIR);
    console.log(`[Classifier] Found ${files.length} patches to classify.`);

    let totalClassified = 0;
    const stateCounts: Record<string, number> = { NUMERIC: 0, KNOWN_SEMANTIC: 0, PARTIALLY_CLASSIFIED: 0, UNKNOWN: 0 };

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
            const state = c.classification.state;
            stateCounts[state] = (stateCounts[state] || 0) + 1;
        });
    }

    console.log(`\n[Summary] Successfully classified ${totalClassified} changes via Tiered Architecture.`);
    for (const [state, count] of Object.entries(stateCounts)) {
        if (count > 0) {
            console.log(`- ${state}: ${count} (${((count / totalClassified) * 100).toFixed(1)}%)`);
        }
    }
}

main().catch(error => {
    console.error("[Error] Fatal error in classifier:", error);
    process.exit(1);
});
