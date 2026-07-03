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

const COUNTERS_PATH = path.resolve("research-output", "mappings", "hero_counters.json");

async function calibrateAllPatches() {
    console.log("=========================================");
    console.log("   Winrate Calibration Auto-Tuner (v5)   ");
    console.log("=========================================\n");

    let weights = await loadJSON(ONTOLOGY_PATH);
    const heroesMap = await loadJSON(path.join(RESEARCH_DIR, "mappings", `heroes.json`));
    
    let countersMap = {};
    try {
        const rawCounters = await readFile(COUNTERS_PATH, "utf8");
        countersMap = JSON.parse(rawCounters);
    } catch (e) {
        console.warn("[Auto-Tuner] Warning: Could not load hero counters map. Ripple tuning disabled.");
    }

    const winrateFiles = await readdir(path.join(RESEARCH_DIR, "calibration-data"));
    const versions = winrateFiles
        .map(f => f.replace("winrates-", "").replace(".json", ""))
        .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));
    
    console.log(`[Auto-Tuner] Found ${versions.length} patches with potential winrate data.`);

    const NUDGE_FACTOR = 0.5;
    const RIPPLE_NUDGE = 0.005;
    let totalAdjustments = 0;

    // Load or initialize ripple coefficients in weights
    if (!weights.rippleCoefficients) {
        weights.rippleCoefficients = {
            counter: -0.15,
            partner: 0.15
        };
    }

    let C = weights.rippleCoefficients.counter;
    let S = weights.rippleCoefficients.partner;

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

        // First pass: Calculate direct score for all heroes in this patch
        const directScores = new Map<string, number>();
        const heroMetricsMap = new Map<string, string[]>();

        for (const [heroIdStr, stats] of Object.entries(bracketWinrates)) {
            const heroName = heroesMap[heroIdStr as any];
            if (!heroName) continue;

            const { score, metrics } = calculateScoreForHero(heroName, patchData, weights, bracketKey);
            directScores.set(heroName, score);
            heroMetricsMap.set(heroName, metrics);
        }

        // Second pass: Calculate combined score (direct + ripple) and check mismatches
        for (const [heroIdStr, stats] of Object.entries(bracketWinrates)) {
            const heroName = heroesMap[heroIdStr as any];
            if (!heroName) continue;

            const directScore = directScores.get(heroName) || 0;
            const metrics = heroMetricsMap.get(heroName) || [];

            let rippleScore = 0;
            const relationship = (countersMap as any)[heroName];
            if (relationship) {
                // Apply counter ripple effect
                if (Array.isArray(relationship.counters)) {
                    for (const counterHero of relationship.counters) {
                        const counterScore = directScores.get(counterHero) || 0;
                        rippleScore += counterScore * C;
                    }
                }
                // Apply partner ripple effect
                if (Array.isArray(relationship.partners)) {
                    for (const partnerHero of relationship.partners) {
                        const partnerScore = directScores.get(partnerHero) || 0;
                        rippleScore += partnerScore * S;
                    }
                }
            }

            const score = directScore + rippleScore;
            const winrateShift = (stats as any).winrate - 0.50;

            let isMismatch = false;
            let direction: "REDUCE" | "INCREASE" | null = null;

            // Prediction significantly opposes reality
            if (score >= 5 && winrateShift <= -0.01) { 
                isMismatch = true;
                direction = "REDUCE";
            } else if (score <= -5 && winrateShift >= 0.01) {
                isMismatch = true;
                direction = "INCREASE";
            }

            if (isMismatch && direction) {
                // Adjust metric weights
                if (metrics.length > 0) {
                    for (const m of metrics) {
                        if (weights.metrics[m]) {
                            const oldVal = weights.metrics[m].weights[bracketKey];
                            const newVal = direction === "REDUCE" ? Math.max(1, oldVal - NUDGE_FACTOR) : Math.min(10, oldVal + NUDGE_FACTOR);
                            weights.metrics[m].weights[bracketKey] = newVal;
                            totalAdjustments++;
                        }
                    }
                }

                // Adjust ripple coefficients C and S
                if (direction === "REDUCE") {
                    // Prediction was too positive, Y actually went down (winrateShift <= -0.01)
                    if (rippleScore > 0) {
                        // Partner help was overestimated, nudge S down
                        S = Math.max(0.01, S - RIPPLE_NUDGE);
                        totalAdjustments++;
                    } else if (rippleScore < 0) {
                        // Counter penalty should have been stronger, nudge C further negative
                        C = Math.max(-0.5, C - RIPPLE_NUDGE);
                        totalAdjustments++;
                    }
                } else if (direction === "INCREASE") {
                    // Prediction was too negative, Y actually went up (winrateShift >= 0.01)
                    if (rippleScore < 0) {
                        // Counter penalty was too harsh, nudge C positive (closer to 0)
                        C = Math.min(-0.01, C + RIPPLE_NUDGE);
                        totalAdjustments++;
                    } else if (rippleScore > 0) {
                        // Partner help should have been stronger, nudge S positive
                        S = Math.min(0.5, S + RIPPLE_NUDGE);
                        totalAdjustments++;
                    }
                }
            }
        }
    }

    // Save tuned weights and coefficients
    weights.rippleCoefficients = {
        counter: parseFloat(C.toFixed(4)),
        partner: parseFloat(S.toFixed(4))
    };

    if (totalAdjustments > 0) {
        await writeFile(ONTOLOGY_PATH, JSON.stringify(weights, null, 2), "utf8");
        console.log(`\n✔️  SUCCESS: Applied ${totalAdjustments} adjustments (metric weights & ripple coefficients: C=${weights.rippleCoefficients.counter}, S=${weights.rippleCoefficients.partner}) across the historical dataset.`);
    } else {
        console.log("\n⚖️  No historical mismatches found requiring automatic tuning.");
    }

    await mkdir(OUTPUT_DIR, { recursive: true });
    const logPath = path.join(OUTPUT_DIR, `final-calibration-report.json`);
    await writeFile(logPath, JSON.stringify(weights, null, 2), "utf8");
}

calibrateAllPatches().catch(console.error);