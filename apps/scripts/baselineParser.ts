// apps/scripts/baselineParser.ts

import { readdir, readFile } from "node:fs/promises";
import * as path from "node:path";

const OUTPUT_DIR = path.resolve("research-output", "structured-patches");

async function main() {
    const files = await readdir(OUTPUT_DIR);
    let totalChanges = 0;
    const typeCounts: Record<string, number> = {};
    const unparsedSamples: string[] = [];

    for (const file of files) {
        if (!file.endsWith(".json")) continue;
        
        const data = JSON.parse(await readFile(path.join(OUTPUT_DIR, file), "utf8"));
        
        for (const change of data.changes) {
            totalChanges++;
            const type = change.changeType || "UNKNOWN";
            typeCounts[type] = (typeCounts[type] || 0) + 1;
            
            if (type === "ADJUSTMENT" && unparsedSamples.length < 50 && change.category !== "general") {
                const cleanNote = change.rawNote.replace(/<[^>]*>/g, "").trim();
                if (cleanNote.length > 5 && !cleanNote.startsWith("This update") && !cleanNote.startsWith("Facets") && !cleanNote.startsWith("Innates")) {
                    unparsedSamples.push(cleanNote);
                }
            }
        }
    }

    console.log(`=== Parser Baseline ===`);
    console.log(`Total Changes: ${totalChanges}`);
    
    for (const [type, count] of Object.entries(typeCounts).sort((a, b) => b[1] - a[1])) {
        const percentage = ((count / totalChanges) * 100).toFixed(1);
        console.log(`${type}: ${count} (${percentage}%)`);
    }

    console.log(`\n=== Sample ADJUSTMENT notes for improvement ===`);
    unparsedSamples.forEach(s => console.log(`- ${s}`));
}

main().catch(console.error);