// apps/scripts/regressionGate.ts

import { readFile, writeFile } from "node:fs/promises";
import * as path from "node:path";
import { exec } from "node:child_process";
import { promisify } from "node:util";

const execAsync = promisify(exec);

const METRICS_PATH = path.resolve("research-output", "ontology", "balance_metrics.json");
const REPORT_PATH = path.resolve("research-output", "validation", "truth_score_report.json");

async function runCommand(command: string) {
    try {
        await execAsync(command);
    } catch (e: any) {
        console.error(`Error running command: ${command}`);
        console.error(e.message);
        throw e;
    }
}

async function getGlobalAccuracy(): Promise<number> {
    try {
        const raw = await readFile(REPORT_PATH, "utf8");
        const report = JSON.parse(raw);
        return report.globalAccuracy || 0;
    } catch (e) {
        return 0;
    }
}

async function main() {
    console.log("=========================================");
    console.log("   Autopilot Calibration Regression Gate  ");
    console.log("=========================================\n");

    // 1. Establish baseline accuracy
    console.log("[Gate] Calculating baseline historical accuracy...");
    await runCommand("npx tsx apps/scripts/auditPredictions.ts");
    const baselineAccuracy = await getGlobalAccuracy();
    console.log(`[Gate] Baseline Global Accuracy: ${baselineAccuracy}%`);

    // 2. Backup current weights
    console.log("[Gate] Backing up current balance metrics...");
    const backupMetrics = await readFile(METRICS_PATH, "utf8");

    try {
        // 3. Run calibration
        console.log("[Gate] Calibrating balance weights...");
        await runCommand("npx tsx apps/scripts/calibrateWeights.ts");

        // 4. Regenerate all pipelines with new weights
        console.log("[Gate] Re-classifying patches...");
        await runCommand("npm run patch:classify");

        console.log("[Gate] Re-calculating feature vectors...");
        await runCommand("npm run patch:vectors");

        console.log("[Gate] Regenerating hero history database...");
        await runCommand("npm run patch:generate-history");

        // 5. Audit the new predictions accuracy
        console.log("[Gate] Auditing new calibration accuracy...");
        await runCommand("npx tsx apps/scripts/auditPredictions.ts");
        const candidateAccuracy = await getGlobalAccuracy();
        console.log(`[Gate] Candidate Global Accuracy: ${candidateAccuracy}%`);

        // 6. Compare
        if (candidateAccuracy < baselineAccuracy) {
            console.warn(`\n⚠️  REGRESSION DETECTED: Candidate accuracy (${candidateAccuracy}%) is lower than baseline (${baselineAccuracy}%).`);
            console.log("[Gate] Reverting to backup metrics...");
            await writeFile(METRICS_PATH, backupMetrics, "utf8");

            // Restore all files to baseline state
            console.log("[Gate] Restoring patch classifications...");
            await runCommand("npm run patch:classify");
            console.log("[Gate] Restoring feature vectors...");
            await runCommand("npm run patch:vectors");
            console.log("[Gate] Restoring hero history database...");
            await runCommand("npm run patch:generate-history");
            console.log("[Gate] Re-running audit for baseline state...");
            await runCommand("npx tsx apps/scripts/auditPredictions.ts");

            console.log("\n❌ Gate failed. Restored baseline weights.");
            process.exit(1);
        } else {
            console.log(`\n✔️  SUCCESS: Calibration approved! Accuracy improved/maintained (${baselineAccuracy}% -> ${candidateAccuracy}%).`);
            process.exit(0);
        }

    } catch (error) {
        console.error("\n❌ Fatal error in regression gate, reverting to backup metrics...", error);
        await writeFile(METRICS_PATH, backupMetrics, "utf8");
        await runCommand("npm run patch:classify");
        await runCommand("npm run patch:vectors");
        await runCommand("npm run patch:generate-history");
        process.exit(1);
    }
}

main().catch(console.error);
