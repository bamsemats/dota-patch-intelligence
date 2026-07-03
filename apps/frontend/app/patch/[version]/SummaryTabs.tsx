"use client";

import { useState } from "react";
import styles from "../../components/Tabs.module.css";
import Link from "next/link";

interface SummaryTabsProps {
  metaData: any;
  itemSlugs?: Record<string, string>;
}

export default function SummaryTabs({ metaData, itemSlugs }: SummaryTabsProps) {
  const [activeTab, setActiveTab] = useState<"shifts" | "synergies" | "roles">("shifts");
  const [expandedKeys, setExpandedKeys] = useState<Record<string, boolean>>({});

  const toggleKey = (key: string) => {
    setExpandedKeys(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const RenderExplanation = ({ text, id, postMortem }: { text: string; id: string; postMortem?: string }) => {
    const isExpanded = !!expandedKeys[id];

    return (
      <div className={styles.roleExplanationContainer}>
        {isExpanded && (
          <>
            <p className={styles.roleExplanationText}>
              {text}
            </p>
            {postMortem && (
              <div className={styles.postMortemBlock} style={{ marginBottom: "8px" }}>
                <strong style={{ color: "var(--color-rare)" }}>Post-Mortem Retrospective:</strong> {postMortem}
              </div>
            )}
          </>
        )}
        <button 
          onClick={() => toggleKey(id)} 
          className={styles.roleExplanationBtn}
        >
          {isExpanded ? "Collapse Analysis" : "Expand Analysis"}
        </button>
      </div>
    );
  };

  if (!metaData) return null;

  const getImageUrl = (name: string) => {
    // Check if it's an item in our slugs mapping
    let slug = itemSlugs ? itemSlugs[name] : null;
    let type = "items";

    if (!slug) {
        // Fallback to hero slugification logic
        slug = name.replace(/ /g, '_').replace(/[^a-zA-Z0-9_]/g, '').toLowerCase();
        
        // Manual Hero Overrides
        if (slug === "natures_prophet") slug = "furion";
        if (slug === "outworld_destroyer") slug = "obsidian_destroyer";
        if (slug === "vengeful_spirit") slug = "vengefulspirit";
        if (slug === "anti_mage") slug = "antimage";
        if (slug === "centaur_warrunner") slug = "centaur";
        if (slug === "clockwerk") slug = "rattletrap";
        if (slug === "doom") slug = "doom_bringer";
        if (slug === "io") slug = "wisp";
        if (slug === "lifestealer") slug = "life_stealer";
        if (slug === "magnus") slug = "magnataur";
        if (slug === "necrophos") slug = "necrolyte";
        if (slug === "queen_of_pain") slug = "queenofpain";
        if (slug === "shadow_fiend") slug = "nevermore";
        if (slug === "treant_protector") slug = "treant";
        if (slug === "underlord") slug = "abyssal_underlord";
        if (slug === "wraith_king") slug = "skeleton_king";
        if (slug === "zeus") slug = "zuus";

        type = "heroes";
    }

    return `https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/${type}/${slug}.png`;
  };

  return (
    <div className={styles.tabContainer}>
      {/* Truth Score Banner */}
      {metaData.truthScore && (
        <div className={`${styles.truthScoreBanner} ${metaData.truthScore.forecastStatus === "SPECULATIVE_ESTIMATE" ? styles.speculativeBanner : ""}`}>
          <span className={styles.truthScoreTitle}>
            {metaData.truthScore.forecastStatus === "SPECULATIVE_ESTIMATE" 
              ? "⚠️ Speculative Estimate" 
              : metaData.truthScore.forecastStatus === "SYSTEM_FORECAST" 
                ? "🛡️ Verified System Forecast" 
                : "Empirical Truth Score"
            }
          </span>
          <span className={styles.truthScoreValue}>
            {metaData.truthScore.accuracy}%{" "}
            <span className={styles.truthScoreDetails}>
              {metaData.truthScore.forecastStatus
                ? `(Historical CV: ${metaData.truthScore.historicalAccuracy}%. ${metaData.truthScore.correct}/${metaData.truthScore.total} predictions correct)`
                : `(${metaData.truthScore.correct}/${metaData.truthScore.total} predictions matched reality)`
              }
            </span>
          </span>
        </div>
      )}

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
          <div className={styles.shiftsList}>
            {metaData.metaShifts?.map((shift: any, idx: number) => (
              <div key={idx} className={styles.shiftCard}>
                <h3 className={styles.shiftTheme}>{shift.theme}</h3>
                <p className={styles.shiftDescription}>{shift.description}</p>
                <div className={styles.shiftRoles}>
                  {shift.impactedRoles?.map((role: string) => (
                    <span key={role} className={styles.roleBadge}>{role}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === "synergies" && (
          <div className={styles.synergiesGrid}>
            
            <div className={styles.synergyCard}>
              <h2 className={styles.synergyCardTitleWinners}>
                Overall Synergistic Winners
              </h2>
              <div className={styles.synergyList}>
                {metaData.synergisticWinners?.map((winner: any, idx: number) => (
                  <div key={idx} className={styles.entityItemCard}>
                    <div className={styles.entityImageBg}>
                         <img 
                            src={getImageUrl(winner.entity)} 
                            alt="" 
                            className={styles.entityImage} 
                            onError={(e) => { e.currentTarget.style.display = 'none'; }}
                         />
                    </div>
                    <div className={styles.entityInfo}>
                        <div className={styles.entityTitleRow}>
                          <h4 className={styles.entityName}>
                            <Link href={`/hero/${winner.entity.replace(/[^a-z0-9]/gi, '_').toLowerCase()}`} className={styles.heroLink}>
                              {winner.entity}
                            </Link>
                            {winner.isCorrectPrediction !== undefined && (
                              <span className={winner.isCorrectPrediction ? styles.predictionVerifiedBadge : styles.predictionMismatchBadge}>
                                {winner.isCorrectPrediction ? `Verified Forecast (${winner.actualDelta})` : `Mismatch (${winner.actualDelta})`}
                              </span>
                            )}
                          </h4>
                          {winner.temporalAssessment && winner.temporalAssessment !== "N/A" && (
                              <span className={winner.temporalAssessment === "Net Gain" ? styles.gainBadge : styles.lossBadge}>
                              {winner.temporalAssessment}
                              </span>
                          )}
                        </div>
                        <p className={styles.entityDescription}>{winner.synergyExplanation}</p>
                        {winner.postMortem && (
                          <div className={styles.postMortemBlock}>
                            <strong style={{ color: "var(--color-rare)" }}>Post-Mortem Retrospective:</strong> {winner.postMortem}
                          </div>
                        )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className={styles.synergyCard}>
              <h2 className={styles.synergyCardTitleLosers}>
                Overall Synergistic Losers
              </h2>
              <div className={styles.synergyList}>
                {metaData.synergisticLosers?.map((loser: any, idx: number) => (
                  <div key={idx} className={styles.entityItemCard}>
                    <div className={styles.entityImageBg}>
                         <img 
                            src={getImageUrl(loser.entity)} 
                            alt="" 
                            className={styles.entityImage} 
                            onError={(e) => { e.currentTarget.style.display = 'none'; }}
                         />
                    </div>
                    <div className={styles.entityInfo}>
                        <div className={styles.entityTitleRow}>
                          <h4 className={styles.entityName}>
                            <Link href={`/hero/${loser.entity.replace(/[^a-z0-9]/gi, '_').toLowerCase()}`} className={styles.heroLink}>
                              {loser.entity}
                            </Link>
                            {loser.isCorrectPrediction !== undefined && (
                              <span className={loser.isCorrectPrediction ? styles.predictionVerifiedBadge : styles.predictionMismatchBadge}>
                                {loser.isCorrectPrediction ? `Verified Forecast (${loser.actualDelta})` : `Mismatch (${loser.actualDelta})`}
                              </span>
                            )}
                          </h4>
                        </div>
                        <p className={styles.entityDescription}>{loser.synergyExplanation}</p>
                        {loser.postMortem && (
                          <div className={styles.postMortemBlock}>
                            <strong style={{ color: "var(--color-rare)" }}>Post-Mortem Retrospective:</strong> {loser.postMortem}
                          </div>
                        )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === "roles" && (metaData.roleSpecificWinners || metaData.roleSpecificLosers) && (
          <div className={styles.synergiesGrid}>
            {["Carry", "Mid", "Offlane", "SoftSupport", "HardSupport"].map(role => {
              const winners = metaData.roleSpecificWinners ? metaData.roleSpecificWinners[role] : [];
              const losers = metaData.roleSpecificLosers ? metaData.roleSpecificLosers[role] : [];
              
              if ((!winners || winners.length === 0) && (!losers || losers.length === 0)) return null;
              
              const roleDisplay = role.replace(/([A-Z])/g, ' $1').trim();
              
              return (
                <div key={role} className={styles.roleCard}>
                  <h3 className={styles.roleTitle}>
                    {roleDisplay}
                  </h3>
                  
                  {winners && winners.length > 0 && (
                    <div style={{ marginBottom: "20px" }}>
                      <h4 className={styles.roleSectionWinnersTitle}>
                        <span className={styles.roleSectionDotWinners}></span>
                        Top Winners
                      </h4>
                      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                        {winners.map((winner: any, idx: number) => {
                          const key = `${role}-winner-${idx}`;
                          return (
                            <div key={idx}>
                              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                                <Link href={`/hero/${winner.hero.replace(/[^a-z0-9]/gi, '_').toLowerCase()}`} style={{ textDecoration: 'none' }}>
                                   <h5 className={styles.roleHeroName}>{winner.hero}</h5>
                                </Link>
                                {winner.temporalAssessment && winner.temporalAssessment !== "N/A" && (
                                  <span className={winner.temporalAssessment === "Net Gain" ? styles.roleHeroBadgeGain : styles.roleHeroBadgeLoss}>
                                    {winner.temporalAssessment}
                                  </span>
                                )}
                              </div>
                              <RenderExplanation text={winner.explanation} id={key} postMortem={winner.postMortem} />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {losers && losers.length > 0 && (
                    <div>
                      <h4 className={styles.roleSectionLosersTitle}>
                        <span className={styles.roleSectionDotLosers}></span>
                        Top Losers
                      </h4>
                      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                        {losers.map((loser: any, idx: number) => {
                          const key = `${role}-loser-${idx}`;
                          return (
                            <div key={idx}>
                              <Link href={`/hero/${loser.hero.replace(/[^a-z0-9]/gi, '_').toLowerCase()}`} style={{ textDecoration: 'none' }}>
                                 <h5 className={styles.roleHeroName}>{loser.hero}</h5>
                              </Link>
                              <RenderExplanation text={loser.explanation} id={key} postMortem={loser.postMortem} />
                            </div>
                          );
                        })}
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

