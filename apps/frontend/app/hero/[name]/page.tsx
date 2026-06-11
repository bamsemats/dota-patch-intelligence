import { promises as fs } from "node:fs";
import path from "node:path";
import Link from "next/link";
import styles from "../../components/HeroDetailModal.module.css";
import WinrateHistorySelector from "./WinrateHistorySelector";

interface PageProps {
  params: Promise<{ name: string }>;
}

const researchDir = path.resolve(process.cwd(), "../../research-output");
const historyDir = path.join(researchDir, "hero-history");

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
  
  // Try to read hero data to get the exact formatted name
  const heroPath = path.join(historyDir, `${name}.json`);
  let heroName = name.replace(/_/g, ' ');
  try {
    const rawData = await fs.readFile(heroPath, "utf-8");
    const heroData = JSON.parse(rawData);
    heroName = heroData.name;
  } catch (e) {
    // fallback to formatted URL param
    heroName = heroName.charAt(0).toUpperCase() + heroName.slice(1);
  }

  const title = `${heroName} Balance History & Winrates`;
  const description = `Track the historical balance changes, feature vector shifts, and winrate trajectories for ${heroName} across all Dota 2 patches.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "article",
      siteName: "Dota Patch Intelligence",
      images: [
        {
          url: "/api/og?title=" + encodeURIComponent(heroName), // Placeholder for future dynamic OG image
          width: 1200,
          height: 630,
          alt: `${heroName} Balance History`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function HeroPage({ params }: PageProps) {
  const { name } = await params;
  
  const heroPath = path.join(historyDir, `${name}.json`);
  let heroData = null;
  try {
    const rawData = await fs.readFile(heroPath, "utf-8");
    heroData = JSON.parse(rawData);
  } catch (e) {
    console.error("Could not load hero data:", e);
  }

  if (!heroData) return <div className="container">Hero not found.</div>;

  const latestHistory = heroData.history[heroData.history.length - 1];

  const getVectorColor = (val: number) => {
    if (val > 0) return "var(--color-buff)";
    if (val < 0) return "var(--color-nerf)";
    return "var(--color-common)";
  };

  return (
    <div className="container">
      <div style={{ marginBottom: '40px' }}>
        <h1 style={{ color: "var(--color-artifact)", margin: 0, fontSize: "clamp(2rem, 5vw, 3rem)" }}>
          {heroData.name}
        </h1>
        <p style={{ color: '#888', fontSize: '1.2rem' }}>Historical Balance Tracker & Intelligence</p>
      </div>

      <div className={styles.content} style={{ padding: 0 }}>
        <div className={styles.section}>
          <h2 style={{ color: 'var(--color-rare)', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
            Balance History
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '30px', marginTop: '20px' }}>
            {heroData.history.slice().reverse().map((patch: any, pIdx: number) => (
              <div key={pIdx} style={{ background: 'var(--bg-panel)', padding: '25px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', flexWrap: 'wrap', gap: '10px' }}>
                  <Link href={`/patch/${patch.version}`} style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--color-rare)', textDecoration: 'none' }}>
                    Patch {patch.version}
                  </Link>
                  <span style={{ color: '#666' }}>{new Date(patch.date).toLocaleDateString()}</span>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {patch.changes.map((change: any, cIdx: number) => (
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
                  ))}
                </div>

                {patch.vectorDelta && (
                   <div style={{ marginTop: '20px', display: 'flex', flexWrap: 'wrap', gap: '8px', paddingTop: '15px', borderTop: '1px dashed var(--border-color)' }}>
                     {Object.entries(patch.vectorDelta).filter(([_, v]: any) => v !== 0).map(([dim, val]: any) => (
                        <span key={dim} style={{ 
                          fontSize: '0.8rem', 
                          padding: '4px 10px', 
                          borderRadius: '4px', 
                          background: 'rgba(0,0,0,0.2)',
                          color: getVectorColor(val),
                          border: `1px solid ${getVectorColor(val)}`
                        }}>
                          {dim.toUpperCase()} {val > 0 ? `+${val}` : val}
                        </span>
                     ))}
                   </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className={styles.sidebar}>
          <div className={styles.section}>
            <h3 style={{ color: 'var(--color-rare)' }}>Current Feature Vectors</h3>
            <div className={styles.vectorGrid} style={{ background: 'var(--bg-panel)', padding: '20px', borderRadius: '12px' }}>
              {latestHistory.vectorDelta && Object.entries(latestHistory.vectorDelta).map(([dim, val]: any) => (
                <div key={dim} className={styles.vectorRow}>
                  <span className={styles.dimName}>{dim.charAt(0).toUpperCase() + dim.slice(1)}</span>
                  <div className={styles.barContainer}>
                    <div 
                      className={styles.bar} 
                      style={{ 
                        width: `${Math.min(Math.abs(val) * 5, 100)}%`, 
                        backgroundColor: getVectorColor(val),
                        marginLeft: val < 0 ? 'auto' : '0',
                        marginRight: val > 0 ? 'auto' : '0'
                      }}
                    />
                  </div>
                  <span className={styles.dimVal} style={{ color: getVectorColor(val) }}>
                    {val > 0 ? `+${val}` : val}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <WinrateHistorySelector history={heroData.history} />
        </div>
      </div>
    </div>
  );
}
