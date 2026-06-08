# Balance Ontology

The Balance Ontology defines the strategic meaning of Dota 2 game mechanics. It maps specific parsed metrics (e.g., "Movement Speed") to broader gameplay concepts and assigns weights representing their general impact on the game.

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

## Impact Weights

Default impact weights are assigned to metrics on a scale of 1 (Low) to 10 (Critical). These weights represent the *general* strategic significance of a typical change to that metric.

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
