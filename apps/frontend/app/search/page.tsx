import { promises as fs } from "node:fs";
import path from "node:path";
import SearchClient from "./SearchClient";

const researchDir = path.resolve(process.cwd(), "../../research-output");

export default async function SearchPage() {
  const indexPath = path.join(researchDir, "search-index.json");
  let searchIndex = [];
  try {
    const rawIndex = await fs.readFile(indexPath, "utf-8");
    searchIndex = JSON.parse(rawIndex);
  } catch (e) {
    console.error("Could not load search index:", e);
  }

  return (
    <div className="container">
      <h1 style={{ color: "var(--color-artifact)", marginBottom: "30px" }}>Global Patch Search</h1>
      <SearchClient index={searchIndex} />
    </div>
  );
}
