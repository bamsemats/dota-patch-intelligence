# Meta Impact Simulation

Meta Impact Simulation is the platform's highest level of intelligence. It reasons about patch changes at a strategic and draft level, simulating how multiple individual changes coalesce into broad meta shifts.

## Strategy-Level Grouping

Rather than analyzing heroes or items in isolation, the system identifies clusters of changes that affect a specific **Strategic Archetype**.

**Example:**
If jungle items, aura items, and summoning heroes are all buffed in the same patch, the system groups these into a **Strategy Cluster**: *"Summon and Aura Stacking strategies were collectively strengthened."*

## Predicted Winners and Losers

The simulation produces a ranked list of predicted meta winners and losers for every patch. These predictions are derived from three sources:

1.  **Hero Feature Vector Deltas:** Aggregated mobility, farming, and teamfight shifts across the entire hero pool.
2.  **Item Utility Shifts:** Item changes that disproportionately affect specific hero archetypes (e.g., support item buffs benefiting 'disabler' archetypes).
3.  **Systemic Changes:** Economy, Map, and Mechanic changes that alter the pace or style of the game.

### Simulation Result Structure

```json
{
  "patch": "7.42",
  "metaDirection": "Tank and initiation compositions strengthened",
  "predictedWinners": ["Centaur Warrunner", "Tidehunter", "Axe"],
  "predictedLosers": ["Puck", "Storm Spirit", "Leshrac"],
  "confidence": 0.71,
  "reasoning": "Combined changes reduce viability of mobile spellcasters while increasing value for front-line initiators due to armor and magic resist buffs."
}
```

## Calibration Over Time

To maintain accuracy, the simulation is self-correcting.

### Feedback Loop:
1.  **Prediction:** The system generates its Meta Impact Simulation upon patch ingestion.
2.  **Observation:** After 7–14 days, the system ingests external winrate and pickrate data (e.g., from Stratz or OpenDota).
3.  **Comparison:** The system compares predicted "Winners/Losers" against actual performance shifts.
4.  **Weight Adjustment:** If the system predicted a hero to improve but they declined, it flags the relevant **Balance Ontology** weights for review or automated adjustment.
