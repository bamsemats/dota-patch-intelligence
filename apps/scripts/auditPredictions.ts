// apps/scripts/auditPredictions.ts

import { readFile, readdir, writeFile, mkdir } from "node:fs/promises";
import * as path from "node:path";

const RESEARCH_DIR = path.resolve("research-output");
const OUTPUT_DIR = path.resolve("research-output", "validation");

async function loadJSON(filePath: string) {
    try {
        return JSON.parse(await readFile(filePath, "utf8"));
    } catch (e) {
        return null;
    }
}

async function main() {
    console.log("=========================================");
    console.log("   Empirical Truth Score Auditor (v1)   ");
    console.log("=========================================\n");

    const winrateFiles = await readdir(path.join(RESEARCH_DIR, "calibration-data"));
    const versions = winrateFiles
        .map(f => f.replace("winrates-", "").replace(".json", ""))
        .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));

    const heroesMap = await loadJSON(path.join(RESEARCH_DIR, "mappings", `heroes.json`));
    const nameToIdMap: Record<string, string> = {};
    for (const [id, name] of Object.entries(heroesMap)) {
        nameToIdMap[name as string] = id;
    }

    let globalTotalPredictions = 0;
    let globalCorrectPredictions = 0;

    let cumulativePredictionsSoFar = 0;
    let cumulativeCorrectSoFar = 0;

    const auditResults: Record<string, any> = {};

    for (let i = 1; i < versions.length; i++) {
        const currentVersion = versions[i];
        const prevVersion = versions[i - 1];

        const meta = await loadJSON(path.join(RESEARCH_DIR, "meta-analysis", `meta-${currentVersion}.json`));
        const currentWinrates = await loadJSON(path.join(RESEARCH_DIR, "calibration-data", `winrates-${currentVersion}.json`));
        const prevWinrates = await loadJSON(path.join(RESEARCH_DIR, "calibration-data", `winrates-${prevVersion}.json`));

        if (!meta || !currentWinrates?.GLOBAL_BLEND || !prevWinrates?.GLOBAL_BLEND) {
            console.log(`[Audit] Skipping ${currentVersion} (Missing data).`);
            continue;
        }

        const priorAccuracy = cumulativePredictionsSoFar > 0
            ? parseFloat(((cumulativeCorrectSoFar / cumulativePredictionsSoFar) * 100).toFixed(1))
            : 85.0; // Default to 85% baseline prior accuracy if no prior patches are processed

        const forecastStatus = priorAccuracy >= 80.0 ? "SYSTEM_FORECAST" : "SPECULATIVE_ESTIMATE";

        console.log(`[Audit] Evaluating predictions for ${currentVersion} (Prior Accuracy: ${priorAccuracy}%, Status: ${forecastStatus})...`);

        let patchPredictions = 0;
        let patchCorrect = 0;
        const evaluationDetails: any[] = [];

        const evaluateEntity = (heroName: string, predictedDirection: "UP" | "DOWN", sourceList: string) => {
            const heroId = nameToIdMap[heroName];
            if (!heroId) return;

            const currentWR = currentWinrates.GLOBAL_BLEND[heroId]?.winrate;
            const prevWR = prevWinrates.GLOBAL_BLEND[heroId]?.winrate;

            if (currentWR !== undefined && prevWR !== undefined) {
                const delta = currentWR - prevWR;
                // Threshold: Needs to be a meaningful shift, e.g., > 0.5% (0.005)
                const THRESHOLD = 0.005; 
                let actualDirection = "STABLE";
                if (delta > THRESHOLD) actualDirection = "UP";
                if (delta < -THRESHOLD) actualDirection = "DOWN";

                // If prediction was UP, and actual went UP -> Correct
                // If prediction was DOWN, and actual went DOWN -> Correct
                const isCorrect = predictedDirection === actualDirection;

                patchPredictions++;
                if (isCorrect) patchCorrect++;

                evaluationDetails.push({
                    hero: heroName,
                    prediction: predictedDirection,
                    actual: actualDirection,
                    delta: parseFloat((delta * 100).toFixed(2)) + "%",
                    isCorrect,
                    source: sourceList
                });
            }
        };

        // 1. Synergistic Winners
        (meta.synergisticWinners || []).forEach((w: any) => {
            evaluateEntity(w.entity, "UP", "Synergistic Winners");
        });

        // 2. Synergistic Losers
        (meta.synergisticLosers || []).forEach((l: any) => {
            evaluateEntity(l.entity, "DOWN", "Synergistic Losers");
        });

        // 3. Role Winners/Losers
        const roles = ["Carry", "Mid", "Offlane", "SoftSupport", "HardSupport"];
        roles.forEach(role => {
            (meta.roleSpecificWinners?.[role] || []).forEach((w: any) => {
                evaluateEntity(w.hero, "UP", `${role} Winners`);
            });
            (meta.roleSpecificLosers?.[role] || []).forEach((l: any) => {
                evaluateEntity(l.hero, "DOWN", `${role} Losers`);
            });
        });

        const patchAccuracy = patchPredictions > 0 ? (patchCorrect / patchPredictions) : 0;
        
        auditResults[currentVersion] = {
            accuracy: parseFloat((patchAccuracy * 100).toFixed(1)),
            totalPredictions: patchPredictions,
            correctPredictions: patchCorrect,
            details: evaluationDetails
        };

        globalTotalPredictions += patchPredictions;
        globalCorrectPredictions += patchCorrect;

        // INJECT TRUTH SCORE BACK INTO META ANALYSIS JSON
        const updateEntityWithTruth = (entityObj: any, entityNameField: string) => {
             const detail = evaluationDetails.find(d => d.hero === entityObj[entityNameField]);
             if (detail) {
                 entityObj.isCorrectPrediction = detail.isCorrect;
                 entityObj.actualDelta = detail.delta;
             }
        };

        if (meta.synergisticWinners) meta.synergisticWinners.forEach((w: any) => updateEntityWithTruth(w, 'entity'));
        if (meta.synergisticLosers) meta.synergisticLosers.forEach((l: any) => updateEntityWithTruth(l, 'entity'));
        
        roles.forEach(role => {
            if (meta.roleSpecificWinners?.[role]) {
                meta.roleSpecificWinners[role].forEach((w: any) => updateEntityWithTruth(w, 'hero'));
            }
            if (meta.roleSpecificLosers?.[role]) {
                meta.roleSpecificLosers[role].forEach((l: any) => updateEntityWithTruth(l, 'hero'));
            }
        });

        meta.truthScore = {
            accuracy: parseFloat((patchAccuracy * 100).toFixed(1)),
            total: patchPredictions,
            correct: patchCorrect,
            forecastStatus,
            historicalAccuracy: priorAccuracy
        };

        // Accumulate for prior accuracy calculation in the next patch iteration
        cumulativePredictionsSoFar += patchPredictions;
        cumulativeCorrectSoFar += patchCorrect;

        // Save updated meta analysis
        await writeFile(path.join(RESEARCH_DIR, "meta-analysis", `meta-${currentVersion}.json`), JSON.stringify(meta, null, 2), "utf8");
    }

    const globalAccuracy = globalTotalPredictions > 0 ? (globalCorrectPredictions / globalTotalPredictions) : 0;


    console.log(`\n=========================================`);
    console.log(`[Result] Global Prediction Accuracy: ${(globalAccuracy * 100).toFixed(1)}%`);
    console.log(`[Result] Evaluated ${globalTotalPredictions} historical LLM predictions.`);
    
    await mkdir(OUTPUT_DIR, { recursive: true });
    await writeFile(path.join(OUTPUT_DIR, "truth_score_report.json"), JSON.stringify({
        globalAccuracy: parseFloat((globalAccuracy * 100).toFixed(1)),
        globalTotalPredictions,
        globalCorrectPredictions,
        patchScores: auditResults
    }, null, 2), "utf8");
    console.log(`[Result] Detailed report saved to research-output/validation/truth_score_report.json`);
}

main().catch(console.error);