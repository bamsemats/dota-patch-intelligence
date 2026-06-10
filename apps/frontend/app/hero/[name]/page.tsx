import { promises as fs } from "node:fs";
import path from "node:path";
import Link from "next/link";
import styles from "../../components/HeroDetailModal.module.css";

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

const RANKS = ["HERALD", "GUARDIAN", "CRUSADER", "ARCHON", "LEGEND", "ANCIENT", "DIVINE", "IMMORTAL"];

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
        <h1 style={{ color: "var(--color-artifact)", margin: 0, fontSize: "3rem" }}>
          {heroData.name}
        </h1>
        <p style={{ color: '#888', fontSize: '1.2rem' }}>Historical Balance Tracker & Intelligence</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '40px' }}>
        <div className={styles.section}>
          <h2 style={{ color: 'var(--color-rare)', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
            Balance History
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '30px', marginTop: '20px' }}>
            {heroData.history.slice().reverse().map((patch: any, pIdx: number) => (
              <div key={pIdx} style={{ background: 'var(--bg-panel)', padding: '25px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
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

        <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
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

          <div className={styles.section}>
            <h3 style={{ color: 'var(--color-rare)' }}>Latest Winrate by Rank</h3>
            <div style={{ background: 'var(--bg-panel)', padding: '20px', borderRadius: '12px' }}>
              <div className={styles.histogram}>
                {RANKS.map(rank => {
                  const wrData = latestHistory.winrates[rank];
                  const wr = wrData ? wrData.winrate : null;
                  const percent = wr ? (wr * 100).toFixed(1) : "N/A";
                  const height = wr ? (wr - 0.4) * 500 : 0;
                  
                  return (
                    <div key={rank} className={styles.histCol}>
                      <div className={styles.histBarContainer}>
                        {wr && (
                          <div 
                            className={styles.histBar} 
                            style={{ height: `${Math.max(height, 5)}%`, backgroundColor: wr > 0.5 ? 'var(--color-buff)' : 'var(--color-nerf)' }}
                          >
                            <span className={styles.histVal}>{percent}%</span>
                          </div>
                        )}
                      </div>
                      <span className={styles.rankLabel}>{rank.charAt(0)}</span>
                    </div>
                  );
                })}
              </div>
              <div className={styles.rankLegend}>
                {RANKS.map(rank => (
                  <span key={rank} style={{ fontSize: '0.65rem', color: '#666' }}>{rank.charAt(0)}={rank} </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
