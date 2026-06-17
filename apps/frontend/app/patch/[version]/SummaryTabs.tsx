"use client";

import { useState } from "react";
import styles from "../../components/Tabs.module.css";
import Link from "next/link";

interface SummaryTabsProps {
  metaData: any;
}

export default function SummaryTabs({ metaData }: SummaryTabsProps) {
  const [activeTab, setActiveTab] = useState<"shifts" | "synergies" | "roles">("shifts");

  if (!metaData) return null;

  return (
    <div className={styles.tabContainer}>
      <div className={styles.tabHeader}>
        <button 
          className={`${styles.tabButton} ${activeTab === "shifts" ? styles.active : ""}`}
          onClick={() => setActiveTab("shifts")}
        >
          Thematic Meta Shifts
        </button>
        <button 
          className={`${styles.tabButton} ${activeTab === "synergies" ? styles.active : ""}`}
          onClick={() => setActiveTab("synergies")}
        >
          Overall Synergies
        </button>
        {(metaData.roleSpecificWinners || metaData.roleSpecificLosers) && (
          <button 
            className={`${styles.tabButton} ${activeTab === "roles" ? styles.active : ""}`}
            onClick={() => setActiveTab("roles")}
          >
            Role Insights
          </button>
        )}
      </div>

      <div className={styles.tabContent}>
        {activeTab === "shifts" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {metaData.metaShifts?.map((shift: any, idx: number) => (
              <div key={idx} style={{ background: "var(--bg-panel)", padding: "20px", borderRadius: "10px", border: "1px solid var(--border-color)" }}>
                <h3 style={{ margin: "0 0 10px 0", color: "var(--color-epic)" }}>{shift.theme}</h3>
                <p style={{ margin: "0 0 10px 0", lineHeight: "1.5" }}>{shift.description}</p>
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  {shift.impactedRoles?.map((role: string) => (
                    <span key={role} style={{ background: "var(--border-color)", padding: "4px 10px", borderRadius: "20px", fontSize: "0.85rem" }}>{role}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === "synergies" && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "20px" }}>
            
            {/* Truth Score Banner */}
            {metaData.truthScore && (
              <div style={{ gridColumn: "1 / -1", background: "rgba(26, 135, 249, 0.1)", border: "1px solid var(--color-rare)", padding: "15px", borderRadius: "8px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontWeight: "bold", color: "var(--color-rare)" }}>Empirical Truth Score</span>
                <span style={{ fontSize: "1.2rem", fontWeight: "bold", color: "var(--text-color)" }}>{metaData.truthScore.accuracy}% <span style={{fontSize: "0.8rem", color: "#888", fontWeight: "normal"}}>({metaData.truthScore.correct}/{metaData.truthScore.total} predictions matched reality)</span></span>
              </div>
            )}

            <div style={{ background: "var(--bg-panel)", padding: "20px", borderRadius: "10px", border: "1px solid var(--border-color)" }}>
              <h2 style={{ color: "var(--color-buff)", marginTop: 0, borderBottom: "1px solid var(--border-color)", paddingBottom: "10px" }}>
                Overall Synergistic Winners
              </h2>
              <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginTop: "16px" }}>
                {metaData.synergisticWinners?.map((winner: any, idx: number) => (
                  <div key={idx}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                      <h4 style={{ margin: 0, color: "var(--color-epic)" }}>
                        {winner.entity}
                        {winner.isCorrectPrediction !== undefined && (
                           <span title={`Actual Winrate Delta: ${winner.actualDelta}`} style={{ marginLeft: '6px', fontSize: '1.1rem' }}>
                             {winner.isCorrectPrediction ? '✅' : '❌'}
                           </span>
                        )}
                      </h4>
                      {winner.temporalAssessment && winner.temporalAssessment !== "N/A" && (
                        <span style={{ 
                          fontSize: "0.65rem", 
                          padding: "2px 6px", 
                          borderRadius: "4px", 
                          background: winner.temporalAssessment === "Net Gain" ? "rgba(76, 175, 80, 0.2)" : "rgba(255, 152, 0, 0.2)",
                          color: winner.temporalAssessment === "Net Gain" ? "#81c784" : "#ffb74d",
                          border: `1px solid ${winner.temporalAssessment === "Net Gain" ? "#4caf50" : "#ff9800"}`,
                          fontWeight: "bold",
                          textTransform: "uppercase"
                        }}>
                          {winner.temporalAssessment}
                        </span>
                      )}
                    </div>
                    <p style={{ margin: 0, fontSize: "0.9rem", color: "#ccc", lineHeight: "1.4" }}>{winner.synergyExplanation}</p>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ background: "var(--bg-panel)", padding: "20px", borderRadius: "10px", border: "1px solid var(--border-color)" }}>
              <h2 style={{ color: "var(--color-nerf)", marginTop: 0, borderBottom: "1px solid var(--border-color)", paddingBottom: "10px" }}>
                Overall Synergistic Losers
              </h2>
              <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginTop: "16px" }}>
                {metaData.synergisticLosers?.map((loser: any, idx: number) => (
                  <div key={idx}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                      <h4 style={{ margin: 0, color: "var(--color-epic)" }}>
                        {loser.entity}
                        {loser.isCorrectPrediction !== undefined && (
                           <span title={`Actual Winrate Delta: ${loser.actualDelta}`} style={{ marginLeft: '6px', fontSize: '1.1rem' }}>
                             {loser.isCorrectPrediction ? '✅' : '❌'}
                           </span>
                        )}
                      </h4>
                    </div>
                    <p style={{ margin: 0, fontSize: "0.9rem", color: "#ccc", lineHeight: "1.4" }}>{loser.synergyExplanation}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === "roles" && (metaData.roleSpecificWinners || metaData.roleSpecificLosers) && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "20px" }}>
            {["Carry", "Mid", "Offlane", "SoftSupport", "HardSupport"].map(role => {
              const winners = metaData.roleSpecificWinners ? metaData.roleSpecificWinners[role] : [];
              const losers = metaData.roleSpecificLosers ? metaData.roleSpecificLosers[role] : [];
              
              if ((!winners || winners.length === 0) && (!losers || losers.length === 0)) return null;
              
              const roleDisplay = role.replace(/([A-Z])/g, ' $1').trim(); // e.g. "SoftSupport" -> "Soft Support"
              
              return (
                <div key={role} style={{ background: "var(--bg-panel)", padding: "20px", borderRadius: "10px", border: "1px solid var(--border-color)" }}>
                  <h3 style={{ color: "var(--color-artifact)", marginTop: 0, marginBottom: "20px", fontSize: "1.4rem", borderBottom: "1px solid var(--border-color)", paddingBottom: "10px" }}>
                    {roleDisplay}
                  </h3>
                  
                  {winners && winners.length > 0 && (
                    <div style={{ marginBottom: "20px" }}>
                      <h4 style={{ color: "var(--color-buff)", marginTop: 0, marginBottom: "15px", fontSize: "1.1rem", display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: 'var(--color-buff)' }}></span>
                        Top Winners
                      </h4>
                      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                        {winners.map((winner: any, idx: number) => (
                          <div key={idx}>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                              <Link href={`/hero/${winner.hero.replace(/[^a-z0-9]/gi, '_').toLowerCase()}`} style={{ textDecoration: 'none' }}>
                                 <h5 style={{ margin: 0, color: "var(--color-epic)", cursor: 'pointer', fontSize: "1rem" }}>{winner.hero}</h5>
                              </Link>
                              {winner.temporalAssessment && winner.temporalAssessment !== "N/A" && (
                                <span style={{ 
                                  fontSize: "0.6rem", 
                                  padding: "1px 5px", 
                                  borderRadius: "4px", 
                                  background: winner.temporalAssessment === "Net Gain" ? "rgba(76, 175, 80, 0.2)" : "rgba(255, 152, 0, 0.2)",
                                  color: winner.temporalAssessment === "Net Gain" ? "#81c784" : "#ffb74d",
                                  border: `1px solid ${winner.temporalAssessment === "Net Gain" ? "#4caf50" : "#ff9800"}`,
                                  fontWeight: "bold",
                                  textTransform: "uppercase"
                                }}>
                                  {winner.temporalAssessment}
                                </span>
                              )}
                            </div>
                            <p style={{ margin: 0, fontSize: "0.85rem", color: "#ccc", lineHeight: "1.4" }}>{winner.explanation}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {losers && losers.length > 0 && (
                    <div>
                      <h4 style={{ color: "var(--color-nerf)", marginTop: 0, marginBottom: "15px", fontSize: "1.1rem", display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: 'var(--color-nerf)' }}></span>
                        Top Losers
                      </h4>
                      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                        {losers.map((loser: any, idx: number) => (
                          <div key={idx}>
                            <Link href={`/hero/${loser.hero.replace(/[^a-z0-9]/gi, '_').toLowerCase()}`} style={{ textDecoration: 'none' }}>
                               <h5 style={{ margin: "0 0 4px 0", color: "var(--color-epic)", cursor: 'pointer', fontSize: "1rem" }}>{loser.hero}</h5>
                            </Link>
                            <p style={{ margin: 0, fontSize: "0.85rem", color: "#ccc", lineHeight: "1.4" }}>{loser.explanation}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
