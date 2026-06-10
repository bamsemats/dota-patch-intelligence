# Winrate Calibration

The Winrate Calibration system uses external real-world match data to validate and improve the accuracy of the platform's impact scoring and meta simulation models.

## Data Sources

The system ingests hero-level statistics from third-party APIs (e.g., Stratz, OpenDota, or Dotabuff).

**Data Collected per Patch:**
*   **Hero Winrate:** Percentage of games won.
*   **Hero Pickrate:** Frequency of the hero being selected.
*   **Hero Banrate:** Frequency of the hero being banned.

## Methodology

The core logic of calibration is to compare the system's **Predicted Impact** against the **Observed Performance Shift**.

1.  **Prediction Snapshot:** Upon patch release, the system records its predicted Net Impact Score and Meta Simulation winners/losers.
2.  **Observation Window:** The system waits for a statistically significant number of games (typically 7–14 days post-patch).
3.  **Delta Comparison:** The system calculates the change in winrate (ΔWinrate) compared to the previous patch and aligns it with the predicted impact score.

### Example Calibration Cycle

| Hero | System Predicted Impact | Observed ΔWinrate | Result |
|---|---|---|---|
| **Earthshaker** | +7 (Major Winner) | +2.1% | **Matched** |
| **Juggernaut** | -4 (Moderate Loser) | -1.3% | **Matched** |
| **Anti-Mage** | +5 (Significant Winner) | -0.5% | **Mismatched** |

## Weight Adjustment Loop

When a **Mismatch** is detected (e.g., system predicted a buff but winrate dropped), the system triggers a calibration alert.

*   **Diagnostic Query:** Which specific change to the hero contributed most to the high predicted score?
*   **Weight Recalibration:** If the mismatch is consistent across multiple heroes sharing a specific metric (e.g., all heroes with "Base Armor" buffs performed worse than expected), the system flags that metric's weight in the **Balance Ontology** for adjustment.

## Caveats & Constraints

Winrate shifts are not purely driven by numerical balance changes. The system must account for:
*   **Pro Play Influence:** Professional meta trends can drive pickrates and winrates regardless of direct hero changes.
*   **Synergy Shifts:** A hero might perform better simply because their core items were buffed, not because they were directly touched.
*   **Skill Floor/Ceiling:** Some buffs take weeks for the general player base to learn and exploit effectively.

---

## Workflow & Commands

The calibration loop is executed via CLI scripts that pull data and compare it against our models.

### 1. Setup API Credentials
The data fetcher relies on the Stratz GraphQL API. You must create a `.env` file in the root directory containing your token:
```env
STRATZ_API_KEY=your_stratz_default_token
```

### 2. Fetch Winrate Data
Run the fetcher to pull winrate statistics across all 7 pub brackets (Herald through Divine). This script features built-in rate-limiting to respect the Stratz Default Token quotas.
```bash
npm run patch:fetch-winrates
```
*Output: `research-output/calibration-data/winrates-[patch].json`*

### 3. Run Calibration (Auto-Tuner)
*(Note: This script will be developed as the final step of Phase 10)*
Run the auto-tuner to compare the observed winrate shifts against our calculated Feature Vector deltas. It will propose adjustments to the `balance_metrics.json` ontology weights using mathematical gradient descent to minimize the error margin between predictions and reality.
```bash
npm run patch:calibrate
```
