import { promises as fs } from "node:fs";
import path from "node:path";
import Link from "next/link";
import PatchSelector from "../../../components/PatchSelector";

interface PageProps {
  params: Promise<{ version: string }>;
}

const researchDir = path.resolve(process.cwd(), "../../research-output");
const patchesDir = path.join(researchDir, "classified-patches");

export async function generateStaticParams() {
  const files = await fs.readdir(patchesDir);
  return files
    .filter(f => f.endsWith(".json"))
    .map(f => ({
      version: f.replace(".json", ""),
    }));
}

export default async function PatchNotesPage({ params }: PageProps) {
  const { version: patchVersion } = await params;
  
  const files = await fs.readdir(patchesDir);
  const availablePatches = files
    .filter(f => f.endsWith(".json"))
    .map(f => f.replace(".json", ""))
    .sort((a, b) => b.localeCompare(a, undefined, { numeric: true, sensitivity: 'base' }));

  const patchPath = path.join(researchDir, "classified-patches", `${patchVersion}.json`);
  let patchData = null;
  try {
    const rawPatch = await fs.readFile(patchPath, "utf-8");
    patchData = JSON.parse(rawPatch);
  } catch (e) {
    console.error("Could not load patch data:", e);
  }

  if (!patchData) return <div>Patch not found.</div>;

  // Group changes by category and entity
  const categoryMap: Record<string, Record<string, any[]>> = {
    general: {},
    item: {},
    neutral: {},
    hero: {}
  };

  for (const change of patchData.changes) {
    const cat = change.category || "general";
    if (!categoryMap[cat]) categoryMap[cat] = {};
    if (!categoryMap[cat][change.entityName]) categoryMap[cat][change.entityName] = [];
    categoryMap[cat][change.entityName].push(change);
  }

  const sections = [
    { id: 'general', title: 'General Updates' },
    { id: 'item', title: 'Item Changes' },
    { id: 'neutral', title: 'Neutral Item Changes' },
    { id: 'hero', title: 'Hero Changes' }
  ];

  const getClassificationStyle = (type: string) => {
    switch (type) {
      case "Buff": return { borderLeft: '3px solid var(--color-buff)', paddingLeft: '10px' };
      case "Nerf": return { borderLeft: '3px solid var(--color-nerf)', paddingLeft: '10px' };
      case "Adjustment": return { borderLeft: '3px solid var(--color-adjustment)', paddingLeft: '10px' };
      case "Rework": return { borderLeft: '3px solid var(--color-rework)', paddingLeft: '10px' };
      default: return { borderLeft: '3px solid transparent', paddingLeft: '10px' };
    }
  };

  const getEntityTitleStyle = (category: string) => {
    switch (category) {
      case "hero": return { color: 'var(--color-epic)' };
      case "item": return { color: 'var(--color-artifact)' };
      case "neutral": return { color: 'var(--color-consumable)' };
      case "general": return { color: 'var(--color-secret-shop)' };
      default: return {};
    }
  };

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '20px' }}>
        <h1 style={{ color: "var(--color-artifact)", margin: 0, fontSize: "2.5rem" }}>
          Patch {patchVersion} Notes
        </h1>
        
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
          <Link href={`/patch/${patchVersion}`} style={{ color: 'var(--color-rare)', fontWeight: 'bold' }}>
            &larr; View Strategic Summary
          </Link>
          <PatchSelector availablePatches={availablePatches} currentPatch={patchVersion} />
        </div>
      </div>

      <div style={{ background: 'var(--bg-panel)', padding: '40px', borderRadius: '12px', border: '1px solid var(--border-color)', marginTop: '20px' }}>
        {sections.map(section => {
          const entities = categoryMap[section.id];
          if (!entities || Object.keys(entities).length === 0) return null;

          const sortedEntityNames = Object.keys(entities).sort((a, b) => a.localeCompare(b));

          return (
            <div key={section.id} style={{ marginBottom: '60px' }}>
              <h2 style={{ 
                color: 'var(--color-rare)', 
                fontSize: '2.2rem', 
                borderBottom: '2px solid var(--color-rare)', 
                paddingBottom: '15px',
                marginBottom: '30px',
                textTransform: 'uppercase',
                letterSpacing: '1px'
              }}>
                {section.title}
              </h2>

              {sortedEntityNames.map((entityName) => (
                <div key={entityName} style={{ marginBottom: '40px' }}>
                  <h3 style={{ 
                    ...getEntityTitleStyle(section.id), 
                    fontSize: '1.6rem', 
                    borderBottom: '1px solid var(--border-color)',
                    paddingBottom: '8px',
                    marginBottom: '15px'
                  }}>
                    {section.id === "hero" ? (
                      <Link href={`/hero/${entityName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                        {entityName}
                      </Link>
                    ) : entityName}
                  </h3>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {entities[entityName].map((change: any, cIdx: number) => (
                      <div key={cIdx} style={{ 
                        ...getClassificationStyle(change.classification.classificationType),
                        lineHeight: '1.6',
                        fontSize: '1rem'
                      }}>
                        {change.subEntityName && (
                          <strong style={{ color: 'var(--color-consumable)', marginRight: '8px' }}>
                            {change.subEntityName}:
                          </strong>
                        )}
                        <span style={{ color: '#ddd' }}>{change.rawNote}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
