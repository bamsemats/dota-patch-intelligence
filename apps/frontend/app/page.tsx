import { promises as fs } from "node:fs";
import path from "node:path";
import Page from "./patch/[version]/page";

export default async function Home() {
  const researchDir = path.resolve(process.cwd(), "../../research-output");
  const patchesDir = path.join(researchDir, "classified-patches");
  
  const files = await fs.readdir(patchesDir);
  const latestPatch = files
    .filter(f => f.endsWith(".json"))
    .map(f => f.replace(".json", ""))
    .sort((a, b) => b.localeCompare(a, undefined, { numeric: true, sensitivity: 'base' }))[0] || "7.41d";

  // Re-use the dynamic page component to render the latest patch at the root
  return <Page params={Promise.resolve({ version: latestPatch })} />;
}
