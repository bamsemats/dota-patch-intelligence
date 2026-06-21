# Winrate Calibration

The Winrate Calibration system uses external real-world match data to validate and improve the accuracy of the platform's impact scoring and meta simulation models.

## Data Sources

The system ingests hero-level statistics exclusively from the **OpenDota API** (REST and SQL Explorer).

**Data Collected per Patch:**
*   **Tiered Winrates:** Across all 8 standard brackets (Herald to Immortal).
*   **Professional Winrates:** Tracked separately to isolate high-level competitive trends.
*   **GLOBAL_BLEND:** A custom calculated metric that heavily weights Pro match data alongside Divine and Immortal tier data.

## Methodology

The core logic of calibration is to compare the system's **Predicted Impact** against the **Observed Performance Shift**.

1.  **Prediction Snapshot:** Upon patch release, the system records its predicted Net Score Delta.
2.  **Observation Window:** The system waits for a statistically significant number of games (typically 7–14 days post-patch) to capture stabilized data.
3.  **Delta Comparison:** The `calibrateWeights.ts` script runs an auto-tuning algorithm that exclusively uses the **GLOBAL_BLEND** metric.

### Auto-Tuning Logic (v5)

The auto-tuner operates on strict mismatch thresholds:
*   **Prediction Mismatch:** If the system predicts a strong positive impact (Score >= +5) but the `GLOBAL_BLEND` winrate *drops* by more than 1% (Δ <= -0.01).
*   **Prediction Mismatch:** If the system predicts a strong negative impact (Score <= -5) but the `GLOBAL_BLEND` winrate *increases* by more than 1% (Δ >= +0.01).

When a mismatch occurs, the script automatically reduces the weight of the specific metrics that contributed to the incorrect score by a `NUDGE_FACTOR` (0.5), updating the `balance_metrics.json` ontology directly.

### Example Calibration Cycle

| Hero | System Predicted Impact | Observed ΔWinrate | Result |
|---|---|---|---|
| **Earthshaker** | +7.5 (Winner) | +2.1% | **Matched** |
| **Juggernaut** | -4.0 (Loser) | -1.3% | **Matched** |
| **Anti-Mage** | +6.0 (Winner) | -0.5% | **Mismatched (Triggers Weight Reduction)** |

## Letter Patch Aggregation Strategy

Because external data providers like OpenDota primarily track match data under the major number patch version (e.g., `7.40`) rather than individual lettered sub-patches (`7.40a`, `7.40b`, `7.40c`, `7.40d`), the system employs a hybrid aggregation strategy for winrate calibration:

1. **Granular Predictions**: System predictions (e.g., impact scoring, feature vectors, role insights) are calculated at the level of specific letter patches. This ensures that minor balance tweaks are represented individually.
2. **Empirical Aggregation**:
   - **Winrate Fallback**: When fetching historical winrate data, if a letter patch query returns `0` matches (common in SQL Explorer queries), the pipeline falls back to fetching the base number version (e.g., `winrates-7.40a.json` will contain the match statistics for `7.40`).
   - **Tuning Alignment**: The auto-tuner compares predicted deltas for a hero in a letter patch against the winrate shifts observed for the base patch version.

This approach ensures 100% data coverage for calibration and validation while preserving the granular history of the balance change logs.

## Caveats & Constraints

Winrate shifts are not purely driven by numerical balance changes. The system must account for:
*   **Pro Play Influence:** Professional meta trends can drive pickrates and winrates regardless of direct hero changes.
*   **Synergy Shifts:** A hero might perform better simply because their core items were buffed, not because they were directly touched.
*   **Skill Floor/Ceiling:** Some buffs take weeks for the general player base to learn and exploit effectively.

---

## Workflow & Commands

The calibration loop is executed via CLI scripts that pull data and compare it against our models.

### 1. Data Fetching (OpenDota)
The data fetcher leverages the OpenDota REST API to pull current winrate statistics across all rank brackets, extracting the `GLOBAL_BLEND`.
```bash
npm run patch:fetch-winrates [patchVersion]
```
*Output: `research-output/calibration-data/winrates-[patch].json`*

### 2. Run Calibration (Auto-Tuner)
Run the auto-tuner to compare the observed winrate shifts against our calculated Feature Vector deltas. It will propose adjustments to the `balance_metrics.json` ontology weights to minimize the error margin between predictions and reality.
```bash
npm run patch:calibrate
```
