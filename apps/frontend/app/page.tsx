import { promises as fs } from "node:fs";
import path from "node:path";
import HeroList from "./components/HeroList";
import ItemList from "./components/ItemList";
import GeneralList from "./components/GeneralList";
import Legend from "./components/Legend";

// Types
interface MetaShift {
  theme: string;
  description: string;
  impactedRoles: string[];
}

interface SynergisticEntity {
  entity: string;
  synergyExplanation: string;
}

export default async function Page() {
  // Load data from research-output
  const patchVersion = "7.41d";
  const researchDir = path.resolve(process.cwd(), "../../research-output");
  
  // 1. Load Meta Analysis
  const metaPath = path.join(researchDir, "meta-analysis", `meta-${patchVersion}.json`);
  let metaData = null;
  try {
    const rawMeta = await fs.readFile(metaPath, "utf-8");
    metaData = JSON.parse(rawMeta);
  } catch (e) {
    console.error("Could not load meta analysis:", e);
  }

  // 2. Load Classified Patch Data
  const patchPath = path.join(researchDir, "classified-patches", `${patchVersion}.json`);
  let patchData = null;
  try {
    const rawPatch = await fs.readFile(patchPath, "utf-8");
    patchData = JSON.parse(rawPatch);
  } catch (e) {
    console.error("Could not load patch data:", e);
  }

  // 3. Load Feature Vectors
  const vectorPath = path.join(researchDir, "feature-vectors", `vectors-${patchVersion}.json`);
  let vectorData = null;
  try {
    const rawVectors = await fs.readFile(vectorPath, "utf-8");
    vectorData = JSON.parse(rawVectors);
  } catch (e) {
    console.error("Could not load vector data:", e);
  }

  // Process Data
  const heroMap = new Map<string, any>();
  const itemMap = new Map<string, any>();
  const neutralMap = new Map<string, any>();
  const generalMap = new Map<string, any>();

  if (patchData && patchData.changes) {
    for (const change of patchData.changes) {
      const type = change.classification?.classificationType;
      let netScoreDelta = 0;
      if (type === "Buff") netScoreDelta = 1;
      if (type === "Nerf") netScoreDelta = -1;

      if (change.category === "hero") {
        if (!heroMap.has(change.entityName)) {
          heroMap.set(change.entityName, { heroName: change.entityName, changes: [], netScore: 0, vectorDelta: null });
        }
        const hero = heroMap.get(change.entityName);
        hero.changes.push(change);
        hero.netScore += netScoreDelta;
      } 
      else if (change.category === "item") {
        if (!itemMap.has(change.entityName)) {
          itemMap.set(change.entityName, { itemName: change.entityName, itemType: "Shop Item", changes: [], netScore: 0 });
        }
        const item = itemMap.get(change.entityName);
        item.changes.push(change);
        item.netScore += netScoreDelta;
      }
      else if (change.category === "neutral") {
        if (!neutralMap.has(change.entityName)) {
          neutralMap.set(change.entityName, { itemName: change.entityName, itemType: "Neutral Item", changes: [], netScore: 0 });
        }
        const item = neutralMap.get(change.entityName);
        item.changes.push(change);
        item.netScore += netScoreDelta;
      }
      else if (change.category === "general") {
        if (!generalMap.has(change.entityName)) {
          generalMap.set(change.entityName, { sectionName: change.entityName, changes: [] });
        }
        generalMap.get(change.entityName).changes.push(change);
      }
    }
  }

  // Merge vector data
  if (vectorData && vectorData.vectorDeltas) {
    for (const vector of vectorData.vectorDeltas) {
      if (heroMap.has(vector.heroName)) {
        heroMap.get(vector.heroName).vectorDelta = vector.vectorDelta;
      }
    }
  }

  const heroesArray = Array.from(heroMap.values()).sort((a, b) => a.heroName.localeCompare(b.heroName));
  const itemsArray = Array.from(itemMap.values()).sort((a, b) => a.itemName.localeCompare(b.itemName));
  const neutralsArray = Array.from(neutralMap.values()).sort((a, b) => a.itemName.localeCompare(b.itemName));
  const generalArray = Array.from(generalMap.values());

  return (
    <div className="container">
      <h1 style={{ color: "var(--color-artifact)", textAlign: "center", fontSize: "2.5rem" }}>
        Patch {patchVersion} Intelligence
      </h1>

      {metaData && (
        <>
          <div style={{ marginBottom: "40px" }}>
            <h2 style={{ color: "var(--color-rare)", borderBottom: "1px solid var(--border-color)", paddingBottom: "10px" }}>
              Thematic Meta Shifts
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "20px", marginTop: "20px" }}>
              {metaData.metaShifts?.map((shift: MetaShift, idx: number) => (
                <div key={idx} style={{ background: "var(--bg-panel)", padding: "20px", borderRadius: "10px", border: "1px solid var(--border-color)" }}>
                  <h3 style={{ margin: "0 0 10px 0", color: "var(--color-epic)" }}>{shift.theme}</h3>
                  <p style={{ margin: "0 0 10px 0", lineHeight: "1.5" }}>{shift.description}</p>
                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                    {shift.impactedRoles?.map(role => (
                      <span key={role} style={{ background: "var(--border-color)", padding: "4px 10px", borderRadius: "20px", fontSize: "0.85rem" }}>{role}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: "40px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "20px" }}>
            <div style={{ background: "var(--bg-panel)", padding: "20px", borderRadius: "10px", border: "1px solid var(--border-color)" }}>
              <h2 style={{ color: "var(--color-buff)", marginTop: 0, borderBottom: "1px solid var(--border-color)", paddingBottom: "10px" }}>
                Synergistic Winners
              </h2>
              <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginTop: "16px" }}>
                {metaData.synergisticWinners?.map((winner: SynergisticEntity, idx: number) => (
                  <div key={idx}>
                    <h4 style={{ margin: "0 0 4px 0", color: "var(--color-epic)" }}>{winner.entity}</h4>
                    <p style={{ margin: 0, fontSize: "0.9rem", color: "#ccc", lineHeight: "1.4" }}>{winner.synergyExplanation}</p>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ background: "var(--bg-panel)", padding: "20px", borderRadius: "10px", border: "1px solid var(--border-color)" }}>
              <h2 style={{ color: "var(--color-nerf)", marginTop: 0, borderBottom: "1px solid var(--border-color)", paddingBottom: "10px" }}>
                Synergistic Losers
              </h2>
              <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginTop: "16px" }}>
                {metaData.synergisticLosers?.map((loser: SynergisticEntity, idx: number) => (
                  <div key={idx}>
                    <h4 style={{ margin: "0 0 4px 0", color: "var(--color-epic)" }}>{loser.entity}</h4>
                    <p style={{ margin: 0, fontSize: "0.9rem", color: "#ccc", lineHeight: "1.4" }}>{loser.synergyExplanation}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      <Legend />

      {generalArray.length > 0 && (
        <GeneralList sections={generalArray} />
      )}

      {itemsArray.length > 0 && (
        <ItemList title="Item Changes" items={itemsArray} />
      )}

      {neutralsArray.length > 0 && (
        <ItemList title="Neutral Item Changes" items={neutralsArray} />
      )}

      {heroesArray.length > 0 ? (
        <HeroList heroes={heroesArray} />
      ) : (
        <p>No hero data available.</p>
      )}
    </div>
  );
}