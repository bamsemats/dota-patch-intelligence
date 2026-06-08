# PARSER_DESIGN.md

## Purpose

This document describes how raw Dota 2 patch notes are transformed into structured data.

The parser is responsible for converting unstructured patch content into machine-readable entities that can later be classified and analyzed.

---

# Parsing Pipeline

Valve JSON Datafeed
↓
ID Resolution Mapping
↓
Content Normalization
↓
Change Decomposition
↓
Change Grouping
↓
Structured Output

---

# Stage 1: ID Resolution Mapping

Responsibilities:
* Pre-load numerical ID mappings for heroes, abilities, and items.
* Assign human-readable `entityName` and `subEntityName` during traversal.

---

# Stage 2: Content Normalization

Responsibilities:

* Remove HTML tags from string values
* Normalize whitespace
* Preserve semantic meaning

Examples:

`<b>Crystal Maiden</b>` becomes `Crystal Maiden`

---

# Stage 3: Change Decomposition

Convert individual patch note string entries into structured Change entities by extracting specific fields.

Identifies:
* Metric (e.g. "Mana cost")
* Change Type (e.g. "INCREASE", "DECREASE", "ADDITION")
* Old Value
* New Value

Example:

"Crystal Nova mana cost increased from 100 to 130."

Produces a Change record with:
`metric: "Mana cost"`, `changeType: "INCREASE"`, `oldValue: "100"`, `newValue: "130"`.

---

# Stage 5: Multi-Part Change Handling

Some patch notes contain multiple modifications in a single entry.

Example:

Crystal Nova

* Damage increased from 100 to 150
* Mana cost increased from 100 to 130

Result:

Two separate Change entities.

---

# Stage 6: Change Group Detection

Certain changes should be analyzed together.

Examples:

* Hero reworks
* Talent tree redesigns
* Facet redesigns

These changes should be associated with a ChangeGroup.

---

# Edge Cases

## Ambiguous Wording

Example:

"Improved interaction with X"

May require AI-assisted classification.

---

## New Mechanics

Example:

"Now grants an additional effect"

Could be:

* Buff
* Rework
* Feature Addition

Requires downstream classification.

---

## Nested Sections

Patch notes occasionally contain multiple levels of hierarchy.

Parser must preserve hierarchy where possible.

---

# Design Principles

1. Preserve source information.
2. Never discard raw text.
3. Keep parser deterministic.
4. Avoid AI usage inside parsing.
5. AI should operate after parsing has completed.

---

# Status

Draft v1
Last Updated: YYYY-MM-DD
