# Semantic Ontology

The Semantic Ontology is the system's knowledge base for interpreting non-numerical gameplay changes. It maps common text patterns and phrases found in Dota 2 patch notes to standardized strategic tags.

## Purpose

The primary goal of the ontology is to enable high-accuracy, deterministic classification of complex gameplay changes without relying on Large Language Models (LLMs) for every entry. By building a robust library of known phrases, the system can automatically identify high-impact changes (e.g., Spell Immunity piercing) and assign consistent metadata.

The ontology grows over time as new patterns are encountered, reviewed by humans, and added to the library.

## Structure of an Ontology Entry

Each entry in the ontology defines a semantic tag and the patterns that trigger it.

```json
{
  "tag": "SPELL_IMMUNITY_INTERACTION",
  "matchPatterns": [
    "now pierces spell immunity",
    "no longer pierces spell immunity",
    "pierces magic immunity"
  ],
  "impactAreas": ["teamfight", "late_game", "carry_matchups"],
  "defaultWeight": 9
}
```

## Initial Tag Library

| Tag Name | Example Match Patterns | Impact Areas | Default Weight |
|---|---|---|---|
| **SPELL_IMMUNITY_INTERACTION** | "now pierces spell immunity", "no longer pierces spell immunity" | teamfight, late_game, carry_matchups | 9 |
| **TARGETING_RULE_CHANGE** | "can now target", "no longer targets", "now affects" | laning, teamfight | 6 |
| **ROSHAN_INTERACTION** | "now affects Roshan", "damage increased against Roshan" | objectives, late_game | 7 |
| **VISION_INTERACTION** | "now grants vision", "vision radius increased", "reveals invisible" | ganking, map_control | 5 |
| **ILLUSION_INTERACTION** | "illusions now", "outgoing damage increased for illusions" | farming, pushing | 7 |
| **DISPEL_INTERACTION** | "can be dispelled", "no longer dispellable", "applies a basic dispel" | survivability, debuff_management | 8 |
| **LINKEN_INTERACTION** | "now blocked by Linken's Sphere", "now pops Linken's" | ganking, single_target_impact | 6 |
| **COOLDOWN_RESET_INTERACTION** | "cooldown is reset by", "no longer reset by" | spell_frequency, power_spikes | 8 |
| **SUMMON_INTERACTION** | "summons now", "damage to summons increased" | pushing, farming | 6 |
| **AURA_INTERACTION** | "now provides an aura", "aura radius increased" | teamfight, deathball | 7 |
| **DAMAGE_TYPE_CHANGE** | "damage type changed to", "now deals pure damage" | scaling, counter_play | 8 |
| **CAST_WHILE_DISABLED** | "can be cast while stunned", "can be cast while disabled" | survivability, initiation_recovery | 9 |

## Ontology Maintenance

### Adding New Entries

The ontology is a living document. New entries and patterns are added through the following process:

1.  **Unknown Detection:** A change is classified as `UNKNOWN` by the parser.
2.  **Human Review:** A domain expert reviews the change in the Human Review Queue.
3.  **Pattern Extraction:** If the change represents a new, repeatable concept, the reviewer extracts the matching phrase.
4.  **Versioned Update:** The entry is added to the ontology, tagged with the version of the patch it was first encountered in.

### Periodic Review

The ontology should be reviewed once every six months to ensure that match patterns remain relevant and that weights are still aligned with the current meta-philosophy.
