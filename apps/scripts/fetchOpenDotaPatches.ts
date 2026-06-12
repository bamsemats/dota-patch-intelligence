// apps/scripts/fetchOpenDotaPatches.ts

import { writeFile, mkdir } from "node:fs/promises";
import * as path from "node:path";

const OUTPUT_DIR = path.resolve("research-output", "mappings");
const OPENDOTA_PATCHES_URL = "https://api.opendota.com/api/constants/patch";

async function main() {
    console.log("=========================================");
    console.log("   OpenDota Patch Mapping Fetcher        ");
    console.log("=========================================\n");

    try {
        await mkdir(OUTPUT_DIR, { recursive: true });

        console.log(`[OpenDota] Fetching patch constants...`);
        const response = await fetch(OPENDOTA_PATCHES_URL);
        
        if (!response.ok) {
            throw new Error(`OpenDota API Error: ${response.status} ${response.statusText}`);
        }

        const patches = await response.json();
        const mapping: Record<string, number> = {};

        for (const patch of patches) {
            mapping[patch.name] = patch.id;
        }

        const outputPath = path.join(OUTPUT_DIR, "opendota_patches.json");
        await writeFile(outputPath, JSON.stringify(mapping, null, 2), "utf8");
        
        console.log(`✔️  Success: Mapped ${Object.keys(mapping).length} patches.`);
        console.log(`🎉 Saved to ${outputPath}`);
    } catch (error: any) {
        console.error("❌ Failed to fetch patches:", error.message);
        process.exit(1);
    }
}

main().catch(console.error);
