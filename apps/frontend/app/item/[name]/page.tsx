import { promises as fs } from "node:fs";
import path from "node:path";
import Link from "next/link";
import styles from "../../components/HeroDetailModal.module.css";

interface PageProps {
  params: Promise<{ name: string }>;
}

const researchDir = path.resolve(process.cwd(), "../../research-output");
const historyDir = path.join(researchDir, "item-history");

export async function generateStaticParams() {
  const files = await fs.readdir(historyDir).catch(() => []);
  return files
    .filter(f => f.endsWith(".json"))
    .map(f => ({
      name: f.replace(".json", ""),
    }));
}

export async function generateMetadata({ params }: PageProps) {
  const { name } = await params;
  
  const itemPath = path.join(historyDir, `${name}.json`);
  let itemName = name.replace(/_/g, ' ');
  try {
    const rawData = await fs.readFile(itemPath, "utf-8");
    const itemData = JSON.parse(rawData);
    itemName = itemData.name;
  } catch (e) {}

  const title = `${itemName} Balance History - Dota Patch Intelligence`;
  return { title };
}

export default async function ItemPage({ params }: PageProps) {
  const { name } = await params;
  
  const itemPath = path.join(historyDir, `${name}.json`);
  let itemData = null;
  try {
    const rawData = await fs.readFile(itemPath, "utf-8");
    itemData = JSON.parse(rawData);
  } catch (e) {
    console.error("Could not load item data:", e);
  }

  if (!itemData) return <div className="container">Item not found.</div>;

  const getItemImageUrl = (name: string) => {
    let slug = name.replace(/ /g, '_').replace(/[^a-zA-Z0-9_]/g, '').toLowerCase();
    if (slug === "aghanims_scepter") slug = "ultimate_scepter";
    if (slug === "aghanims_shard") slug = "aghanims_shard";
    if (slug === "town_portal_scroll") slug = "tpscroll";
    if (slug === "boots_of_speed") slug = "boots";
    if (slug === "gem_of_true_sight") slug = "gem";
    if (slug === "observer_ward") slug = "ward_observer";
    if (slug === "sentry_ward") slug = "ward_sentry";
    if (slug === "tango") slug = "tango";
    if (slug === "clarity") slug = "clarity";
    if (slug === "healing_salve") slug = "flask";
    if (slug === "smoke_of_deceit") slug = "smoke_of_deceit";
    if (slug === "dust_of_appearance") slug = "dust";
    if (slug === "bottle") slug = "bottle";
    if (slug === "animal_courier") slug = "courier";
    if (slug === "flying_courier") slug = "flying_courier";
    if (slug === "shadow_amulet") slug = "shadow_amulet";
    if (slug === "magic_stick") slug = "magic_stick";
    if (slug === "magic_wand") slug = "magic_wand";

    const enhancements = ["crude", "brawny", "quickened", "tough", "greedy", "mystical", "keen", "toxic", "stalwart", "swift", "alert", "timeless", "titanic", "vital", "audacious", "evolved", "feverish", "fleetfooted", "hulking", "manic", "vampiric", "keen_eyed", "boundless", "nimble", "vast", "wise"];
    if (enhancements.includes(slug)) {
      slug = `enhancement_${slug}`;
    }

    return `https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/items/${slug}.png`;
  };

  return (
    <div className="container" style={{ position: 'relative' }}>
      <div className={styles.heroImageWrapper} style={{ position: 'absolute', top: '-40px', left: '-20px', width: 'calc(100% + 40px)', height: '400px', zIndex: -1 }}>
        <img 
          src={getItemImageUrl(itemData.name)} 
          alt="" 
          className={styles.heroImage} 
          style={{ objectFit: 'contain', padding: '40px', opacity: 0.4 }}
        />
      </div>

      <div style={{ marginBottom: '40px', paddingTop: '40px' }}>
        <h1 style={{ color: "var(--color-artifact)", margin: 0, fontSize: "clamp(2rem, 5vw, 3rem)" }}>
          {itemData.name}
        </h1>
        {itemData.cost && <p style={{ color: 'var(--color-rare)', fontSize: '1.2rem', fontWeight: 'bold' }}>Cost: {itemData.cost} gold</p>}
      </div>

      <div className={styles.content} style={{ padding: 0 }}>
        <div className={styles.section}>
          {itemData.description && (
             <div style={{ background: 'var(--bg-panel)', padding: '20px', borderRadius: '12px', marginBottom: '30px', border: '1px solid var(--border-color)' }}>
               <h3 style={{ color: 'var(--color-rare)', marginTop: 0 }}>Item Description</h3>
               <p style={{ color: '#ccc', lineHeight: '1.6', fontSize: '1.1rem' }}>{itemData.description}</p>
               
               {itemData.attributes && itemData.attributes.length > 0 && (
                 <div style={{ marginTop: '15px', display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                   {itemData.attributes.map((attr: any, idx: number) => (
                     <span key={idx} style={{ background: 'rgba(255,255,255,0.05)', padding: '4px 12px', borderRadius: '4px', fontSize: '0.9rem', color: 'var(--color-epic)' }}>
                       {attr.key.replace(/_/g, ' ')}: {attr.value}
                     </span>
                   ))}
                 </div>
               )}
             </div>
          )}

          <h2 style={{ color: 'var(--color-rare)', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
            Balance History
          </h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '30px', marginTop: '20px' }}>
            {itemData.history.slice().reverse().map((patch: any, pIdx: number) => (
              <div key={pIdx} style={{ background: 'var(--bg-panel)', padding: '25px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                  <Link href={`/patch/${patch.version}`} style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--color-rare)', textDecoration: 'none' }}>
                    Patch {patch.version}
                  </Link>
                  <span style={{ color: '#666' }}>{new Date(patch.date).toLocaleDateString()}</span>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {patch.changes.length > 0 ? (
                    patch.changes.map((change: any, cIdx: number) => (
                      <div key={cIdx} style={{ 
                        borderLeft: `3px solid ${
                          change.classification.classificationType === 'Buff' ? 'var(--color-buff)' : 
                          change.classification.classificationType === 'Nerf' ? 'var(--color-nerf)' : 
                          'var(--color-adjustment)'
                        }`,
                        paddingLeft: '12px'
                      }}>
                        {change.subEntityName && <strong style={{ color: 'var(--color-consumable)' }}>{change.subEntityName}: </strong>}
                        <span style={{ color: '#ccc' }}>{change.rawNote}</span>
                      </div>
                    ))
                  ) : (
                    <div style={{ color: '#666', fontStyle: 'italic', paddingLeft: '12px' }}>
                      No direct changes in this patch.
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
