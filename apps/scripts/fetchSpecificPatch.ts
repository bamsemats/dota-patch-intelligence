// apps/scripts/fetchSpecificPatch.ts

import { mkdir, writeFile } from "node:fs/promises";
import * as path from "node:path";

const OUTPUT_DIR = path.resolve("research-output", "patches");

async function fetchPatchJson(version: string): Promise<any | null> {
    const url = `https://www.dota2.com/datafeed/patchnotes?version=${version}&language=english`;
    try {
        const response = await fetch(url);
        if (!response.ok) return null;
        return await response.json();
    } catch (error) {
        console.error(`[Fetch] Error fetching JSON from ${url}:`, error);
        return null;
    }
}

async function main() {
    const versions = process.argv.slice(2);
    if (versions.length === 0) {
        console.error("Please provide patch versions to fetch.");
        process.exit(1);
    }

    for (const version of versions) {
        console.log(`[Fetch] Fetching artifacts for ${version}...`);
        const json = await fetchPatchJson(version);
        
        if (json && json.success) {
            const patchDir = path.join(OUTPUT_DIR, version);
            await mkdir(patchDir, { recursive: true });

            await writeFile(
                path.join(patchDir, "data.json"),
                JSON.stringify(json, null, 2),
                "utf8"
            );

            // Create a minimal metadata.json
            const metadata = {
                version,
                discoveryDate: new Date().toISOString(),
                source: "manual-fetch"
            };
            await writeFile(
                path.join(patchDir, "metadata.json"),
                JSON.stringify(metadata, null, 2),
                "utf8"
            );

            console.log(`✔️  Successfully saved patch ${version} artifacts.`);
        } else {
            console.error(`❌ Failed to fetch patch ${version} or it returned success: false.`);
        }
    }
}

main().catch(console.error);
