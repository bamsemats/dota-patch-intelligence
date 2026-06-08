# Hero Feature Vectors

Hero Feature Vectors represent every hero as a set of scored strategic dimensions. Rather than just tracking "Buffs" and "Nerfs", the system tracks how a hero's functional capabilities evolve across patches.

## Purpose

The feature vector system allows the platform to quantify a hero's strategic role. It enables advanced queries like "Which heroes have become significantly more mobile over the last 2 years?" and provides the numerical foundation for **Meta Simulation**.

## Dimensions

Each hero is defined by seven core dimensions. Dimensions are scored from **0 to 100**. These scores represent relative strength within the hero's own kit (Identity) rather than absolute power rankings against other heroes.

| Dimension | Description |
|---|---|
| **Farming** | Ability to clear creeps, ancient stacks, and accelerate net worth. |
| **Mobility** | Movement speed, blink/leap abilities, and global presence. |
| **Survivability** | Effective HP, armor, magic resistance, and escape mechanics. |
| **Teamfight** | AoE damage, large-scale crowd control, and coordination impact. |
| **Laning** | Ability to trade hits, secure last hits, and survive the early game. |
| **Siege** | Building damage, tower pressure, and objective taking. |
| **Utility** | Buffs for allies, debuffs for enemies, and unique utility (e.g., vision). |

## Vector Modification

Individual patch changes apply deltas (±) to these dimensions based on the **Balance Ontology**.

### Mapping Logic (Examples)

*   **"Blink mana cost reduced"**
    *   Primary: `mobility` +3
    *   Secondary: `farming` +2 (enables faster rotations between camps)
*   **"Stun duration increased"**
    *   Primary: `teamfight` +4
    *   Secondary: `laning` +2
*   **"Base armor reduced"**
    *   Primary: `survivability` -3
    *   Secondary: `laning` -2

Deltas are calculated by combining the change type (Increase/Decrease) with the metric's base weight and the hero's specific archetypes.

## Tracking Identity Shift

The system stores a snapshot of every hero's feature vector for every patch version.

### Hero Identity Shift (HIS) Analysis

By comparing a hero's current vector to their vector from 12 months ago, the system can detect "Strategic Drift." 

**Example Scenario:**
A series of minor nerfs to a hero's laning stats and buffs to their late-game scaling may result in a **HIS Alert**: *"Hero Identity Shift detected: [Hero Name] is transitioning from a Lane Dominator to a Late-Game Scaler."*
