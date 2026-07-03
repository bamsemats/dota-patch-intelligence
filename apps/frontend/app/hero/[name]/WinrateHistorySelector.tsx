"use client";

import { useState } from "react";
import styles from "../../components/HeroDetailModal.module.css";

interface WinrateData {
  winrate: number;
  matchCount: number;
  isHistorical?: boolean;
}

interface PatchHistory {
  version: string;
  date: string;
  winrates: Record<string, WinrateData>;
}

interface WeeklyHistoryItem {
  date: string;
  winrates: Record<string, number>;
}

interface WinrateHistorySelectorProps {
  history: PatchHistory[];
  weeklyHistory: WeeklyHistoryItem[];
}

const RANKS = ["HERALD", "GUARDIAN", "CRUSADER", "ARCHON", "LEGEND", "ANCIENT", "DIVINE"];

export default function WinrateHistorySelector({ history, weeklyHistory = [] }: WinrateHistorySelectorProps) {
  const [selectedVersion, setSelectedVersion] = useState(history[history.length - 1]?.version);
  const [trendRank, setTrendRank] = useState("GLOBAL_BLEND");

  const selectedPatch = history.find(h => h.version === selectedVersion) || history[history.length - 1];

  // Check if this patch uses the PROFESSIONAL historical baseline
  const isProfessional = selectedPatch?.winrates["PROFESSIONAL"] !== undefined;

  const HISTORICAL_RANKS = ["GLOBAL_BLEND", "PRO", "DIVINE", "ANCIENT", "LEGEND", "ARCHON", "CRUSADER", "GUARDIAN", "HERALD"];
  
  const chartWidth = 260;
  const chartHeight = 110;
  const paddingLeft = 32;
  const paddingRight = 15;
  const paddingTop = 20;
  const paddingBottom = 20;

  const totalWidth = chartWidth + paddingLeft + paddingRight;
  const totalHeight = chartHeight + paddingTop + paddingBottom;

  const winrateValues = weeklyHistory
    .map(w => w.winrates[trendRank])
    .filter(v => v !== undefined && v > 0);

  const minWr = winrateValues.length > 0 ? Math.min(...winrateValues) : 0.45;
  const maxWr = winrateValues.length > 0 ? Math.max(...winrateValues) : 0.55;

  const wrDiff = maxWr - minWr;
  const pad = Math.max(0.01, wrDiff * 0.15);
  const yMin = Math.max(0, minWr - pad);
  const yMax = Math.min(1.0, maxWr + pad);

  const coordinates = weeklyHistory.map((w, index) => {
    const wr = w.winrates[trendRank];
    const x = paddingLeft + (index * (chartWidth / Math.max(1, weeklyHistory.length - 1)));
    const y = wr !== undefined && wr > 0
      ? paddingTop + (chartHeight - ((wr - yMin) / (yMax - yMin) * chartHeight))
      : paddingTop + (chartHeight / 2);
    
    const parts = w.date.split("-");
    const label = parts.length === 3 ? `${parseInt(parts[1])}/${parseInt(parts[2])}` : w.date;
    return { x, y, wr, label };
  });

  const polylinePoints = coordinates
    .filter(c => c.wr !== undefined && c.wr > 0)
    .map(c => `${c.x},${c.y}`)
    .join(" ");

  const gridLinesCount = 3;
  const gridLines = [];
  for (let i = 0; i <= gridLinesCount; i++) {
    const ratio = i / gridLinesCount;
    const y = paddingTop + (chartHeight * ratio);
    const value = yMax - (ratio * (yMax - yMin));
    gridLines.push({ y, value });
  }

  return (
    <>
      <div className={styles.section}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
          <h3 style={{ color: 'var(--color-rare)', margin: 0 }}>
            {isProfessional ? "Pro Winrate Baseline" : "Winrate by Rank"}
          </h3>
          <select 
            value={selectedVersion} 
            onChange={(e) => setSelectedVersion(e.target.value)}
            className={styles.rankSelect}
          >
            {history.slice().reverse().map(h => (
              <option key={h.version} value={h.version}>
                Patch {h.version}
              </option>
            ))}
          </select>
        </div>

        <div style={{ background: 'var(--bg-panel)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
          {isProfessional ? (
            <div style={{ textAlign: 'center', padding: '10px 0' }}>
              <div style={{ fontSize: '3rem', fontWeight: 'bold', color: ((selectedPatch?.winrates["PROFESSIONAL"]?.winrate || 0) > 0.5 ? 'var(--color-buff)' : 'var(--color-nerf)') }}>
                {((selectedPatch?.winrates["PROFESSIONAL"]?.winrate || 0) * 100).toFixed(1)}%
              </div>
              <div style={{ color: '#888', fontSize: '0.9rem', marginTop: '5px' }}>
                Aggregate Professional Baseline
              </div>
              <div style={{ color: '#666', fontSize: '0.75rem', marginTop: '10px', fontStyle: 'italic' }}>
                Tiered data unavailable for this historical patch.
              </div>
            </div>
          ) : (
            <>
              <div className={styles.histogram}>
                {RANKS.map(rank => {
                  const wrData = selectedPatch?.winrates[rank];
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
            </>
          )}
        </div>
      </div>

      <div className={styles.section} style={{ marginTop: '30px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
          <h3 style={{ color: 'var(--color-rare)', margin: 0 }}>
            Winrate Trend
          </h3>
          <select 
            value={trendRank} 
            onChange={(e) => setTrendRank(e.target.value)}
            className={styles.rankSelect}
          >
            {HISTORICAL_RANKS.map(rank => (
              <option key={rank} value={rank}>
                {rank.replace('_', ' ')}
              </option>
            ))}
          </select>
        </div>

        {weeklyHistory.length === 0 ? (
          <div style={{ background: 'var(--bg-panel)', padding: '30px 20px', borderRadius: '12px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '120px', color: '#888', fontSize: '13px', textAlign: 'center' }}>
            <span style={{ color: 'var(--color-rare)', marginBottom: '8px', fontWeight: 'bold' }}>Accumulating Historical Data</span>
            Weekly winrate snapshots will automatically register and build this chart.
          </div>
        ) : (
          <div style={{ background: 'var(--bg-panel)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-color)', overflowX: 'auto' }}>
            <svg width="100%" height={totalHeight} viewBox={`0 0 ${totalWidth} ${totalHeight}`} style={{ overflow: 'visible' }}>
              {/* Grid Lines & Y-axis labels */}
              {gridLines.map((line, idx) => (
                <g key={idx}>
                  <line 
                    x1={paddingLeft} 
                    y1={line.y} 
                    x2={paddingLeft + chartWidth} 
                    y2={line.y} 
                    stroke="rgba(255,255,255,0.05)" 
                    strokeDasharray="4 4" 
                  />
                  <text 
                    x={paddingLeft - 8} 
                    y={line.y + 3} 
                    fontSize="8" 
                    fill="#666" 
                    textAnchor="end"
                  >
                    {(line.value * 100).toFixed(1)}%
                  </text>
                </g>
              ))}

              {/* Line path */}
              {polylinePoints && (
                <polyline 
                  fill="none" 
                  stroke="var(--color-rare)" 
                  strokeWidth="2" 
                  points={polylinePoints} 
                />
              )}

              {/* Points & hover labels */}
              {coordinates.map((pt, i) => (
                <g key={i}>
                  {pt.wr !== undefined && pt.wr > 0 && (
                    <>
                      <circle 
                        cx={pt.x} 
                        cy={pt.y} 
                        r="4" 
                        fill="var(--bg-panel)" 
                        stroke="var(--color-rare)" 
                        strokeWidth="2" 
                      />
                      <text 
                        x={pt.x} 
                        y={pt.y - 8} 
                        fontSize="9" 
                        fill="var(--text-color)" 
                        textAnchor="middle"
                        fontWeight="bold"
                      >
                        {(pt.wr * 100).toFixed(1)}%
                      </text>
                    </>
                  )}
                  {/* X-axis labels (Weekly Dates) */}
                  <text 
                    x={pt.x} 
                    y={totalHeight - 5} 
                    fontSize="9" 
                    fill="#666" 
                    textAnchor="middle"
                  >
                    {pt.label}
                  </text>
                </g>
              ))}
            </svg>
          </div>
        )}
      </div>
    </>
  );
}
