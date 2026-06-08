# Change Grouping

The Change Grouping system aggregates individual atomic changes into higher-level strategic summaries. This allows the system to present a cohesive narrative of a patch's impact rather than just a list of disconnected facts.

## Aggregation Hierarchy

The system organizes changes into a four-tier hierarchy:

1.  **Change:** An atomic balance adjustment (e.g., "+2 Base Armor").
2.  **Hero/Item Change Set:** All atomic changes belonging to a specific entity (e.g., all 5 changes to Anti-Mage in 7.42).
3.  **Hero/Item Summary:** A synthesized qualitative interpretation of the entity's change set.
4.  **Patch Summary:** A top-level meta analysis synthesized from all change sets and systemic shifts.

## Data Structure: ChangeGroup

```json
{
  "id": "cg_8821",
  "patchId": "7.42",
  "targetId": "hero_1",
  "title": "Anti-Mage Laning Buff",
  "description": "Base armor and health regen increases significantly improve early laning sustain.",
  "groupType": "Major Buff Package",
  "confidence": 0.88,
  "changes": ["ch_1", "ch_2", "ch_5"]
}
```

## Confidence Aggregation

Confidence scores are aggregated upward through the hierarchy using a **Weighted Average** model:
*   `NUMERIC` changes contribute 1.0 confidence.
*   `KNOWN_SEMANTIC` changes contribute based on their ontology weight.
*   The final confidence of a `Hero Summary` is the average of its constituent changes, weighted by their strategic significance (defined in the Balance Ontology).

## Rework Handling

A "Rework" is triggered when a hero's kit undergoes fundamental mechanical changes. 

**Rework Criteria:**
*   3 or more ability-level semantic changes in a single patch.
*   OR an explicit "REPLACED" change type detected in an ability note.

When a rework is detected, the individual atomic changes are still stored, but the `Hero Summary` is flagged as a **Rework Package**. This informs the LLM and the frontend that the hero's identity has shifted significantly, and pure "Buff/Nerf" counting may be misleading.

## Net Impact Scoring

The Net Impact Score is a single numerical value representing the total "weight" of changes for an entity.

### Calculation Methodology:
1.  **Base Score:** Each change is assigned a base polarity (+1 for Buff, -1 for Nerf).
2.  **Strategic Weighting:** The polarity is multiplied by the metric's weight from the **Balance Ontology** (e.g., Ultimate cooldown reduction is worth more than a Talent damage buff).
3.  **Archetype Multiplier:** Weights are further modified by hero archetypes (e.g., Mana pool buffs are weighted higher for high-frequency spellcasters).

**Formula:** `Net Score = Sum(Polarity * StrategicWeight * ArchetypeMultiplier)`

This score allows the frontend to rank "Biggest Winners" and "Biggest Losers" based on strategic reality rather than raw change counts.
