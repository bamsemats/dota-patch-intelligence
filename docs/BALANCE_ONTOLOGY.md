# Balance Ontology

The Balance Ontology defines the strategic meaning of Dota 2 game mechanics. It maps specific parsed metrics (e.g., "Movement Speed") to broader gameplay concepts and assigns weights representing their general impact on the game.

## Calibration Methodology (Strategic Balancing)

The initial weights and archetype modifiers in the system are prototype placeholders (e.g., uniform `1.5` multipliers) used to validate the calculation pipeline. To ensure the system accurately represents true gameplay impact across different roles and heroes, the weights must undergo a rigorous, strategic calibration phase.

### Calibration Strategy:
1.  **Expert Consensus Baseline:** Base metric weights (1-10) and archetype modifiers must be initially set using high-MMR domain knowledge. For example, a `carry` archetype will receive a heavy modifier (`1.8`) for *Attack Speed*, while a `support` receives a lower modifier (`0.8`) but a high modifier (`2.0`) for *Disable Duration*.
2.  **Relative Normalization:** Weights must be balanced against each other to prevent systemic skew. If "Armor" is weighted too heavily across all archetypes, every patch will incorrectly look like a "Tank Meta."
3.  **Empirical Feedback Loop:** Once the Winrate Calibration system (Phase 10) is operational, the weights will be continually adjusted based on observed data. If the system predicts a hero will win due to a "Base Damage" buff, but the hero's winrate remains static, the weight of "Base Damage" for that specific archetype will be automatically reduced.
4.  **Continuous Review:** As the game's fundamental mechanics evolve (e.g., the introduction of Facets or new attributes), the ontology must be manually audited using the Interactive Review Tool to ensure the weights still align with the current meta-philosophy.

## Metric → Gameplay Concept Mapping

Each trackable metric is mapped to one or more gameplay areas it affects.

| Metric | Gameplay Area(s) Affected |
|---|---|
| **Mana Cost** | lane_sustain, spell_frequency, farm_speed |
| **Cooldown** | teamfight_frequency, gank_frequency, farming_speed |
| **Cast Range** | positioning, safety, pick_off_potential |
| **Armor** | physical_survivability, lane_trading |
| **Movement Speed** | mobility, map_rotations, escape |
| **HP / HP Regen** | lane_sustain, tankiness |
| **Attack Damage** | last_hitting, physical_dps, farming |
| **Attack Speed** | physical_dps, farming, objective_damage |
| **Ultimate Cooldown** | ultimate_impact, teamfight_tempo |
| **Disable Duration** | crowd_control, pick_off_potential |
| **AoE Radius** | teamfight_reliability, zoning |
| **Stat Gain (Str/Agi/Int)** | late_game_scaling, survivability |

## Impact Weights (Per-Bracket)

The impact of a mechanic is highly dependent on the skill level of the players. A cast-point reduction might be meta-defining for players who react in milliseconds, but irrelevant in lower-skill games. 

To account for this, the Balance Ontology does not use flat weights. Instead, every metric is assigned a specific weight (1-10) across the **7 Standard Pub Brackets**:
1. Herald
2. Guardian
3. Crusader
4. Archon
5. Legend
6. Ancient
7. Divine

*(Note: Professional match calibration is treated as a separate, future advanced feature due to its unique meta environment).*

These weights represent the *general* strategic significance of a typical change to that metric within that specific skill tier.

| Metric Group | Default Weight |
|---|---|
| Ultimate Mechanic Changes | 10 |
| Scepter / Shard Reworks | 9 |
| Disable Durations | 8 |
| Stat Gains (per level) | 8 |
| Base Damage / Armor | 7 |
| Regular Ability Cooldowns | 6 |
| Mana Costs | 5 |
| Talent Tree Adjustments | 4 |

## Hero Archetype Layer

The impact of a change is not uniform across all heroes. The Balance Ontology uses **Archetypes** to modify impact weights based on a hero's strategic role.

### Initial Archetype List
*   **Core:** carry, initiator, tank, ganker, pusher, split_pusher, lane_dominator.
*   **Utility:** support, nuker, disabler, mana_burner, summon_based, aura_carrier.

### Archetype Modifiers
Archetypes apply multipliers to metric weights.

**Example Logic:**
*   **Hero: Anti-Mage** (Archetypes: `carry`, `mobility`)
*   **Change:** "Blink Mana Cost reduced"
*   **Base Weight (Mana Cost):** 5
*   **Modifier:** `carry` (+1), `mobility` (+2)
*   **Final Strategic Weight:** 8

This ensures that a mana buff for Anti-Mage (who relies on spamming Blink to farm) is weighted more heavily than a mana buff for a hero who rarely uses spells to accelerate.
