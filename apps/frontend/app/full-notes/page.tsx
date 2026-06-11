import { promises as fs } from "node:fs";
import path from "node:path";
import FullNotesPage from "../patch/[version]/full-notes/page";

export default async function FullNotesHome() {
  const researchDir = path.resolve(process.cwd(), "../../research-output");
  const patchesDir = path.join(researchDir, "classified-patches");
  
  const files = await fs.readdir(patchesDir);
  const latestPatch = files
    .filter(f => f.endsWith(".json"))
    .map(f => f.replace(".json", ""))
    .sort((a, b) => b.localeCompare(a, undefined, { numeric: true, sensitivity: 'base' }))[0] || "7.41d";

  // Re-use the dynamic page component to render the latest patch's full notes at the root
  return <FullNotesPage params={Promise.resolve({ version: latestPatch })} />;
}
