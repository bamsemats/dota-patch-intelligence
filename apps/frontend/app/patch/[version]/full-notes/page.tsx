import Link from "next/link";
import PatchSelector from "../../../components/PatchSelector";
import FullNotesTabs from "./FullNotesTabs";
import { getLocalPatches, getLocalPatchData } from "../../../lib/localData";

interface PageProps {
  params: Promise<{ version: string }>;
}

const API_BASE = process.env.API_URL || "http://localhost:8080";

export async function generateStaticParams() {
  try {
    const res = await fetch(`${API_BASE}/api/patches`);
    if (!res.ok) throw new Error();
    const patches = await res.json();
    return patches.map((p: any) => ({
      version: p.version,
    }));
  } catch (error) {
    const patches = await getLocalPatches();
    return patches.map(v => ({ version: v }));
  }
}

export default async function PatchNotesPage({ params }: PageProps) {
  const { version: patchVersion } = await params;
  
  let availablePatches: string[] = [];
  try {
    const res = await fetch(`${API_BASE}/api/patches`);
    if (res.ok) {
      const patches = await res.json();
      availablePatches = patches.map((p: any) => p.version);
    } else {
      throw new Error();
    }
  } catch (e) {
    availablePatches = await getLocalPatches();
    availablePatches.reverse();
  }

  let patchData = null;
  try {
    const res = await fetch(`${API_BASE}/api/patches/${patchVersion}`);
    if (res.ok) {
      patchData = await res.json();
    } else {
      throw new Error();
    }
  } catch (e) {
    patchData = await getLocalPatchData(patchVersion);
  }

  if (!patchData) return <div>Patch not found.</div>;

  // Process Data
  const heroMap = new Map<string, any>();
  const itemMap = new Map<string, any>();
  const neutralMap = new Map<string, any>();
  const generalMap = new Map<string, any>();

  // Extract Winrates mapping for the HeroList component to use
  const winrateData: Record<string, Record<string, any>> = {};
  if (patchData.winrateSnapshots) {
    for (const wr of patchData.winrateSnapshots) {
      const rank = wr.bracket;
      const heroIdStr = wr.entity.id.toString(); 
      if (!winrateData[rank]) winrateData[rank] = {};
      winrateData[rank][heroIdStr] = {
        winrate: wr.winrate,
        matchCount: wr.matchCount
      };
    }
  }

  // Create a minimal hero mapping for the component
  const heroMapping: Record<string, string> = {};
  if (patchData.winrateSnapshots) {
    for (const wr of patchData.winrateSnapshots) {
      heroMapping[wr.entity.id.toString()] = wr.entity.name;
    }
  }

  if (patchData.changes) {
    for (const change of patchData.changes) {
      const entityName = change.entity.name;
      const category = change.entity.type.toLowerCase();
      
      const formattedChange = {
        category,
        entityName,
        subEntityName: change.subEntityName,
        rawNote: change.rawNote,
        classification: {
          classificationType: change.classificationType,
          reasoning: change.reasoning,
          strategicWeight: change.strategicWeight
        }
      };

      if (category === "hero") {
        if (!heroMap.has(entityName)) {
          heroMap.set(entityName, { heroName: entityName, changes: [], netScore: 0, vectorDelta: null });
        }
        const hero = heroMap.get(entityName);
        hero.changes.push(formattedChange);
        hero.netScore += change.netScoreDelta;
      } 
      else if (category === "item") {
        if (!itemMap.has(entityName)) {
          itemMap.set(entityName, { itemName: entityName, itemType: "Shop Item", changes: [], netScore: 0 });
        }
        const item = itemMap.get(entityName);
        item.changes.push(formattedChange);
        item.netScore += change.netScoreDelta;
      }
      else if (category === "neutral") {
        if (!neutralMap.has(entityName)) {
          neutralMap.set(entityName, { itemName: entityName, itemType: "Neutral Item", changes: [], netScore: 0 });
        }
        const item = neutralMap.get(entityName);
        item.changes.push(formattedChange);
        item.netScore += change.netScoreDelta;
      }
      else if (category === "general") {
        if (!generalMap.has(entityName)) {
          generalMap.set(entityName, { sectionName: entityName, changes: [] });
        }
        generalMap.get(entityName).changes.push(formattedChange);
      }
    }
  }

  if (patchData.featureVectors) {
    for (const vector of patchData.featureVectors) {
      const entityName = vector.entity.name;
      if (heroMap.has(entityName)) {
        heroMap.get(entityName).vectorDelta = {
          farming: vector.farming,
          mobility: vector.mobility,
          survivability: vector.survivability,
          teamfight: vector.teamfight,
          laning: vector.laning,
          siege: vector.siege,
          utility: vector.utility
        };
      }
    }
  }

  const heroesArray = Array.from(heroMap.values()).sort((a, b) => a.heroName.localeCompare(b.heroName));
  const itemsArray = Array.from(itemMap.values()).sort((a, b) => a.itemName.localeCompare(b.itemName));
  const neutralsArray = Array.from(neutralMap.values()).sort((a, b) => a.itemName.localeCompare(b.itemName));
  const generalArray = Array.from(generalMap.values());

  return (
    <div className="container">
      <div style={{ display: 'flex', gap: '20px', alignItems: 'center', marginBottom: '10px' }}>
         <Link href={`/patch/${patchVersion}`} style={{ color: 'var(--color-artifact)', textDecoration: 'none' }}>← Summary</Link>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '20px' }}>
        <h1 style={{ color: "var(--color-artifact)", margin: 0, fontSize: "2.5rem" }}>
          Patch {patchVersion} Notes
        </h1>
        
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
          <PatchSelector availablePatches={availablePatches} currentPatch={patchVersion} />
        </div>
      </div>

      <FullNotesTabs 
        heroes={heroesArray}
        items={itemsArray}
        neutrals={neutralsArray}
        general={generalArray}
        winrateData={winrateData}
        heroMapping={heroMapping}
      />
    </div>
  );
}
