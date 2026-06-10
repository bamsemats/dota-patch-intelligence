// apps/scripts/fetchStratzPatches.ts

import { mkdir, writeFile } from "node:fs/promises";
import * as path from "node:path";

require('dotenv').config();

const OUTPUT_DIR = path.resolve("research-output", "mappings");
const STRATZ_ENDPOINT = "https://api.stratz.com/graphql";
const API_KEY = process.env.STRATZ_API_KEY;

async function fetchStratzGraphQL(query: string, variables: any = {}) {
    if (!API_KEY) {
        throw new Error("STRATZ_API_KEY is not set in .env.");
    }

    const response = await fetch(STRATZ_ENDPOINT, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${API_KEY}`,
            "User-Agent": "STRATZ_API"
        },
        body: JSON.stringify({ query, variables })
    });

    if (!response.ok) {
        throw new Error(`Stratz API Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    if (data.errors) {
        throw new Error(`GraphQL Errors: ${JSON.stringify(data.errors, null, 2)}`);
    }

    return data;
}

const PATCH_QUERY = `
query {
  constants {
    gameVersions {
      id
      name
      asOfDateTime
    }
  }
}
`;

async function main() {
    console.log("[Stratz] Fetching patch ID mappings...");
    
    try {
        const data = await fetchStratzGraphQL(PATCH_QUERY);
        const versions = data.data.constants.gameVersions;
        
        const patchMap: Record<string, number> = {};
        
        for (const v of versions) {
            // Stratz names are usually like "7.30c"
            patchMap[v.name] = v.id;
        }

        await mkdir(OUTPUT_DIR, { recursive: true });
        const outputPath = path.join(OUTPUT_DIR, "stratz_patches.json");
        await writeFile(outputPath, JSON.stringify(patchMap, null, 2), "utf8");
        
        console.log(`✔️  Successfully mapped ${versions.length} patches.`);
        console.log(`Saved to ${outputPath}`);
    } catch (e: any) {
        console.error("❌ Failed to fetch patch mappings:", e.message);
    }
}

main();