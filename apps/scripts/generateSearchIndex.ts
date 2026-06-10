import { promises as fs } from "node:fs";
import path from "node:path";

const researchDir = path.resolve(process.cwd(), "research-output");
const patchesDir = path.join(researchDir, "classified-patches");
const outputPath = path.join(researchDir, "search-index.json");

async function generate() {
  console.log("Generating search index...");
  
  const files = await fs.readdir(patchesDir);
  const jsonFiles = files.filter(f => f.endsWith(".json"));
  
  const index: any[] = [];
  
  for (const file of jsonFiles) {
    const patchVersion = file.replace(".json", "");
    const rawData = await fs.readFile(path.join(patchesDir, file), "utf-8");
    const data = JSON.parse(rawData);
    
    if (data.changes) {
      for (const change of data.changes) {
        index.push({
          v: patchVersion,
          e: change.entityName,
          s: change.subEntityName || "",
          c: change.classification.classificationType,
          n: change.rawNote.slice(0, 100), // Truncate note for index size
          cat: change.category
        });
      }
    }
  }
  
  await fs.writeFile(outputPath, JSON.stringify(index));
  console.log(`Search index generated at ${outputPath} (${index.length} entries)`);
}

generate().catch(console.error);
