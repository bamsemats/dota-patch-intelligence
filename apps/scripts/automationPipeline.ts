// apps/scripts/automationPipeline.ts

import { exec } from "node:child_process";
import { promisify } from "node:util";

const execAsync = promisify(exec);

async function runCommand(command: string, description: string) {
    console.log(`\n=============================================`);
    console.log(`🚀 ${description}`);
    console.log(`   > ${command}`);
    console.log(`=============================================\n`);
    
    try {
        const { stdout, stderr } = await execAsync(command);
        if (stdout) console.log(stdout);
        if (stderr) console.error(stderr);
    } catch (error: any) {
        console.error(`❌ Command failed: ${command}`);
        console.error(error.message);
        process.exit(1);
    }
}

async function main() {
    const targetVersion = process.argv[2];
    
    if (!targetVersion) {
        console.error("Please provide a patch version to process (e.g., npx tsx apps/scripts/automationPipeline.ts 7.42)");
        process.exit(1);
    }

    console.log(`\n🤖 Starting Full Automation Pipeline for Patch ${targetVersion} 🤖\n`);

    // 1. Fetch
    await runCommand(`npx tsx apps/scripts/fetchSpecificPatch.ts ${targetVersion}`, "Fetching Patch Data");
    
    // 2. Parse & Classify
    await runCommand(`npm run patch:parse`, "Parsing Raw Notes");
    await runCommand(`npm run patch:classify`, "Classifying Changes");
    
    // 3. Models
    await runCommand(`npm run patch:vectors`, "Calculating Feature Vectors");
    await runCommand(`npm run patch:impact -- ${targetVersion}`, "Scoring Impact");
    
    // 4. Intelligence
    // Assuming API key is available in environment
    await runCommand(`npm run patch:meta -- ${targetVersion}`, "Generating LLM Meta Analysis");
    await runCommand(`npm run patch:meta-check`, "Validating Factual Accuracy");
    
    // 5. Finalization
    await runCommand(`npm run patch:generate-history`, "Building Hero Archives");
    await runCommand(`npm run db:seed`, "Backing up and Seeding Database");
    
    // 6. Build
    await runCommand(`npm run build --prefix apps/frontend`, "Triggering Next.js Static Build");

    console.log(`\n🎉 Pipeline completed successfully for ${targetVersion}! 🎉`);
}

main().catch(console.error);
