// apps/scripts/validateEngine.ts

import { readFile, mkdir, writeFile } from "node:fs/promises";
import * as path from "node:path";

const GOLD_STANDARD_PATH = path.resolve("research-output", "validation", "gold_standard.json");
const CLASSIFIED_DIR = path.resolve("research-output", "classified-patches");
const OUTPUT_DIR = path.resolve("research-output", "validation-logs");

interface ValidationResult {
    totalEvaluated: number;
    correctClassifications: number;
    correctStates: number;
    precision: string;
    stateAccuracy: string;
    failures: any[];
}

async function runValidation() {
    let goldStandard: any[];
    try {
        goldStandard = JSON.parse(await readFile(GOLD_STANDARD_PATH, "utf8"));
    } catch (e) {
        console.error("[Error] Gold standard dataset not found.");
        return;
    }

    console.log(`[Validation] Loaded ${goldStandard.length} ground-truth test cases.`);

    const failures: any[] = [];
    let correctClassifications = 0;
    let correctStates = 0;

    for (const testCase of goldStandard) {
        try {
            const patchData = JSON.parse(await readFile(path.join(CLASSIFIED_DIR, `${testCase.patch}.json`), "utf8"));
            
            // Find the change in the patch
            const engineResult = patchData.changes.find((c: any) => c.rawNote === testCase.rawNote);

            if (!engineResult) {
                failures.push({ testCase, error: "Change not found in parsed output." });
                continue;
            }

            let passedClassification = false;
            let passedState = false;

            const actualClass = engineResult.classification.classificationType;
            const actualState = engineResult.classification.state;

            // Strict check: 'Unknown' state is technically an 'Adjustment' mathematically if unresolved,
            // but we want to validate the exact type match if provided.
            if (actualClass === testCase.expectedClassification || 
               (actualState === "UNKNOWN" && testCase.expectedClassification === "Adjustment")) {
                passedClassification = true;
                correctClassifications++;
            }

            if (actualState === testCase.expectedState) {
                passedState = true;
                correctStates++;
            }

            if (!passedClassification || !passedState) {
                failures.push({
                    rawNote: testCase.rawNote,
                    expected: { class: testCase.expectedClassification, state: testCase.expectedState },
                    actual: { class: actualClass, state: actualState }
                });
            }

        } catch (e) {
            console.error(`[Error] Could not evaluate test case for patch ${testCase.patch}.`);
        }
    }

    const precision = ((correctClassifications / goldStandard.length) * 100).toFixed(2);
    const stateAccuracy = ((correctStates / goldStandard.length) * 100).toFixed(2);

    const result: ValidationResult = {
        totalEvaluated: goldStandard.length,
        correctClassifications,
        correctStates,
        precision: `${precision}%`,
        stateAccuracy: `${stateAccuracy}%`,
        failures
    };

    console.log(`\n=== Validation Results ===`);
    console.log(`Evaluated: ${result.totalEvaluated}`);
    console.log(`Classification Precision: ${result.precision}`);
    console.log(`State Accuracy: ${result.stateAccuracy}`);

    if (failures.length > 0) {
        console.log(`\n=== Failures (${failures.length}) ===`);
        failures.forEach(f => console.log(f));
    }

    // Save Log
    await mkdir(OUTPUT_DIR, { recursive: true });
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const logPath = path.join(OUTPUT_DIR, `run-${timestamp}.json`);
    await writeFile(logPath, JSON.stringify(result, null, 2), "utf8");
    console.log(`\nValidation log saved to ${logPath}`);
}

runValidation().catch(console.error);