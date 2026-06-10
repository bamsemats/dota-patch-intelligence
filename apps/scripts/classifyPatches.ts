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

    // Helper to find the best matching metric key from ontology
    const findMetricData = (mStr: string) => {
        // 1. Try exact match
        if (balanceOntology.metrics[mStr]) return balanceOntology.metrics[mStr];
        
        // 2. Try partial match (check if ontology key is part of the extracted metric)
        // Sort keys by length descending to match most specific first (e.g., "mana regen" before "mana")
        const keys = Object.keys(balanceOntology.metrics).sort((a, b) => b.length - a.length);
        for (const key of keys) {
            if (mStr.includes(key)) return balanceOntology.metrics[key];
        }
        return null;
    };

    // Catch structural headers that bypass the parser's HTML strip
    if (changeType === "SECTION_HEADER") {
        return {
            state: "KNOWN_SEMANTIC",
            classificationType: "Adjustment",
            semanticTag: "STRUCTURAL_HEADER",
            strategicWeight: { "Herald": 0, "Guardian": 0, "Crusader": 0, "Archon": 0, "Legend": 0, "Ancient": 0, "Divine": 0 },
            confidenceScore: 1.0,
            reasoning: "Structural HTML header, not a gameplay change."
        };
    }

    // 1. Check for NUMERIC states (Deterministic via Balance Ontology)
    if (changeType === "INCREASED" || changeType === "DECREASED" || changeType === "RESCALE") {
        const metricData = findMetricData(metricStr);
        const defaultWeights = { "Herald": 5, "Guardian": 5, "Crusader": 5, "Archon": 5, "Legend": 5, "Ancient": 5, "Divine": 5 };
        const weightsObj = metricData ? metricData.weights : defaultWeights;
        
        if (changeType === "RESCALE") {
            return {
                state: "NUMERIC",
                classificationType: "Adjustment",
                confidenceScore: 0.8,
                strategicWeight: weightsObj,
                reasoning: "Rescaling redistributes power across levels and requires contextual analysis."
            };
        }

        // We use a heuristic if metric is not mapped explicitly with polarity.
        const isNegativeMetric = ["cooldown", "mana cost", "cast point", "delay", "cost", "penalty"].some(m => metricStr.includes(m));
        const isPositiveMetric = ["damage", "health", "mana", "armor", "speed", "range", "duration", "strength", "agility", "intelligence", "radius", "regen"].some(m => metricStr.includes(m));

        if (changeType === "INCREASED") {
            if (isNegativeMetric) return { state: "NUMERIC", classificationType: "Nerf", confidenceScore: 1.0, strategicWeight: weightsObj, reasoning: `Increased a negative metric (${metricStr}).` };
            if (isPositiveMetric) return { state: "NUMERIC", classificationType: "Buff", confidenceScore: 1.0, strategicWeight: weightsObj, reasoning: `Increased a positive metric (${metricStr}).` };
        }

        if (changeType === "DECREASED") {
            if (isNegativeMetric) return { state: "NUMERIC", classificationType: "Buff", confidenceScore: 1.0, strategicWeight: weightsObj, reasoning: `Decreased a negative metric (${metricStr}).` };
            if (isPositiveMetric) return { state: "NUMERIC", classificationType: "Nerf", confidenceScore: 1.0, strategicWeight: weightsObj, reasoning: `Decreased a positive metric (${metricStr}).` };
        }
        
        return {
            state: "NUMERIC",
            classificationType: "Adjustment",
            confidenceScore: 0.5,
            strategicWeight: weightsObj,
            reasoning: "Numeric change, but polarity could not be deterministically resolved."
        };
    }

    // Explicit Feature Handling (Rework/Add/Remove)
    const wrapWeight = (w: number) => ({ "Herald": w, "Guardian": w, "Crusader": w, "Archon": w, "Legend": w, "Ancient": w, "Divine": w });

    if (changeType === "REWORK") return { state: "KNOWN_SEMANTIC", classificationType: "Rework", confidenceScore: 1.0, strategicWeight: wrapWeight(8), reasoning: "Explicitly designated as a replacement or rework." };
    if (changeType === "ADDITION") return { state: "KNOWN_SEMANTIC", classificationType: "Buff", confidenceScore: 0.9, strategicWeight: wrapWeight(7), reasoning: "Addition of a new mechanic or feature." };
    if (changeType === "REMOVAL") return { state: "KNOWN_SEMANTIC", classificationType: "Nerf", confidenceScore: 0.9, strategicWeight: wrapWeight(7), reasoning: "Removal of a mechanic or feature." };

    // 2. Check Semantic Ontology for KNOWN_SEMANTIC
    for (const entry of semanticOntology) {
        for (const pattern of entry.matchPatterns) {
            if (rawNoteLower.includes(pattern.toLowerCase())) {
                return {
                    state: "KNOWN_SEMANTIC",
                    classificationType: "Adjustment", 
                    semanticTag: entry.tag,
                    strategicWeight: wrapWeight(entry.defaultWeight || 5),
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
        strategicWeight: wrapWeight(5),
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
