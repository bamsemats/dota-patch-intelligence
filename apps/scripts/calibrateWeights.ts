// apps/scripts/calibrateWeights.ts

import { readFile, mkdir, writeFile, readdir } from "node:fs/promises";
import * as path from "node:path";

const RESEARCH_DIR = path.resolve("research-output");
const OUTPUT_DIR = path.resolve("research-output", "calibration-reports");
const ONTOLOGY_PATH = path.resolve("research-output", "ontology", "balance_metrics.json");

const BRACKET_MAP: Record<string, string> = {
    "HERALD": "Herald",
    "GUARDIAN": "Guardian",
    "CRUSADER": "Crusader",
    "ARCHON": "Archon",
    "LEGEND": "Legend",
    "ANCIENT": "Ancient",
    "DIVINE": "Divine"
};

async function loadJSON(filePath: string) {
    return JSON.parse(await readFile(filePath, "utf8"));
}

function calculateScoreForHero(heroName: string, patchData: any, weights: any, bracketKey: string): { score: number, metrics: string[] } {
    const heroChanges = patchData.changes.filter((c: any) => c.category === "hero" && c.entityName === heroName);
    let totalScore = 0;
    const usedMetrics: string[] = [];

    for (const change of heroChanges) {
        const polarity = change.classification.classificationType;
        let multiplier = 0;
        if (polarity === "Buff") multiplier = 1;
        if (polarity === "Nerf") multiplier = -1;
        if (multiplier === 0) continue;

        const metricStr = (change.metric || "").toLowerCase();
        const metricData = weights.metrics[metricStr];
        const baseWeight = metricData ? (metricData.weights[bracketKey] || 5) : 5;
        
        totalScore += (baseWeight * multiplier);
        if (metricStr) usedMetrics.push(metricStr);
    }

    return { score: totalScore, metrics: usedMetrics };
}

async function calibrateAllPatches() {
    console.log("=========================================");
    console.log("   Winrate Calibration Auto-Tuner (v5)   ");
    console.log("=========================================\n");

    let weights = await loadJSON(ONTOLOGY_PATH);
    const heroesMap = await loadJSON(path.join(RESEARCH_DIR, "mappings", `heroes.json`));
    
    const winrateFiles = await readdir(path.join(RESEARCH_DIR, "calibration-data"));
    const versions = winrateFiles
        .map(f => f.replace("winrates-", "").replace(".json", ""))
        .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));
    
    console.log(`[Auto-Tuner] Found ${versions.length} patches with potential winrate data.`);

    const NUDGE_FACTOR = 0.5;
    let totalAdjustments = 0;

    for (const version of versions) {
        const winratePath = path.join(RESEARCH_DIR, "calibration-data", `winrates-${version}.json`);
        const patchPath = path.join(RESEARCH_DIR, "classified-patches", `${version}.json`);

        // SKIP if we don't have both the winrates and the classified patch
        try {
            await readFile(patchPath);
        } catch (e) {
            console.log(`[Auto-Tuner] Skipping Patch ${version} (Classified patch file missing).`);
            continue;
        }

        console.log(`[Auto-Tuner] Calibrating Patch ${version}...`);
        
        const winrates = await loadJSON(winratePath);
        const patchData = await loadJSON(patchPath);

        if (Object.keys(winrates).length === 0) {
            console.log(`[Auto-Tuner] Skipping Patch ${version} (Winrate data is empty).`);
            continue;
        }

        // ISSUE-6: Use the new GLOBAL_BLEND for empirical tuning
        const bracketWinrates = winrates["GLOBAL_BLEND"];
        if (!bracketWinrates || Object.keys(bracketWinrates).length === 0) {
            console.log(`[Auto-Tuner] Skipping Patch ${version} (No GLOBAL_BLEND data).`);
            continue;
        }

        // We calibrate the "Divine" weight based on the Global Blend
        const bracketKey = "Divine";

        for (const [heroIdStr, stats] of Object.entries(bracketWinrates)) {
            const heroName = heroesMap[heroIdStr as any];
            if (!heroName) continue;

            const { score, metrics } = calculateScoreForHero(heroName, patchData, weights, bracketKey);
            const winrateShift = (stats as any).winrate - 0.50;

            let isMismatch = false;
            let direction: "REDUCE" | "INCREASE" | null = null;

            // Prediction significantly opposes reality
            if (score >= 5 && winrateShift <= -0.01) { 
                isMismatch = true;
                direction = "REDUCE";
            } else if (score <= -5 && winrateShift >= 0.01) {
                isMismatch = true;
                direction = "REDUCE";
            }

            if (isMismatch && direction && metrics.length > 0) {
                for (const m of metrics) {
                    if (weights.metrics[m]) {
                        const oldVal = weights.metrics[m].weights[bracketKey];
                        const newVal = direction === "REDUCE" ? Math.max(1, oldVal - NUDGE_FACTOR) : Math.min(10, oldVal + NUDGE_FACTOR);
                        weights.metrics[m].weights[bracketKey] = newVal;
                        totalAdjustments++;
                    }
                }
            }
        }
    }

    if (totalAdjustments > 0) {
        await writeFile(ONTOLOGY_PATH, JSON.stringify(weights, null, 2), "utf8");
        console.log(`\n✔️  SUCCESS: Applied ${totalAdjustments} weight adjustments across the historical dataset.`);
    } else {
        console.log("\n⚖️  No historical mismatches found requiring automatic tuning.");
    }

    await mkdir(OUTPUT_DIR, { recursive: true });
    const logPath = path.join(OUTPUT_DIR, `final-calibration-report.json`);
    await writeFile(logPath, JSON.stringify(weights, null, 2), "utf8");
}

calibrateAllPatches().catch(console.error);