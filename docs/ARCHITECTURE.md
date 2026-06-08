# ARCHITECTURE.md

## Purpose

This document describes the architecture of the Dota Patch Intelligence platform.

The goal of the project is to transform raw Dota 2 patch notes into structured, searchable, and understandable balance information for players.

---

# Core Problem

Official Dota patch notes provide detailed information but are difficult to consume due to their size and structure.

However, **quantitative counting of buffs and nerfs is insufficient** to understand a patch. A hero receiving a dozen minor numerical tweaks might be less impacted than a hero receiving one single, meta-defining mechanical change.

Players want answers to questions such as:
* Which heroes received *impactful* buffs or nerfs?
* How do changes affect specific game phases (Laning, Mid, Late)?
* What thematic gameplay systems were altered?
* How has the overall meta shifted regarding picks, lineups, and itemization?

This platform aims to answer those questions by combining deterministic structured parsing with deep, contextual AI impact analysis.

---

# Architectural Principles

## 1. Data First

The project is fundamentally a data processing platform.

The frontend exists to present processed data.

All business logic should live in backend services and shared packages.

---

## 2. Structured Data Over Raw Text

Raw patch notes should be converted into structured entities whenever possible.

Example:

Raw:

"Crystal Nova mana cost increased from 100 to 130."

Structured:

{
hero: "Crystal Maiden",
ability: "Crystal Nova",
classification: "nerf",
impactMagnitude: "low"
}

---

## 3. Explainable Analysis

Every classification should be traceable.

Users should be able to understand why a change was categorized as a buff, nerf, rework, or adjustment, and *why* its impact was scored a certain way.

---

## 4. AI for Contextual Impact Analysis

AI should not be used for basic string parsing where regex suffices.
AI **must** be used to evaluate the *contextual impact* of a change.
Rule-based logic handles the quantitative baseline (e.g., "Mana cost increased = Nerf"), while AI determines the qualitative weight (e.g., "Is this mana cost nerf actually significant for this hero's laning phase?").

---

# High-Level System Architecture

Patch Source (Steam/Valve)
↓
Ingestion Layer (Datafeed JSON)
↓
Parsing & Normalization
↓
Tiered Classification Engine (Deterministic + Semantic)
↓
Impact Scoring (Balance Ontology + Archetypes)
↓
Modeling Layer (Hero Feature Vectors)
↓
Meta Simulation & Analysis
↓
Strategic Summary (LLM Narrative)
↓
Database → API → Frontend

---

# Changes pipeline

Steam News → Discovery Layer → Valve JSON Datafeed API → ID Mapping Resolver → Structured Parser → Tiered Classifications (Numeric/Semantic) → Strategic Weighting (Balance Ontology) → Vector Modification (Hero Feature Vectors) → Meta Simulation → Meta Conclusions

---

# Core Architectural Components

## 1. Tiered Classification Engine
Ensures data integrity by separating deterministic facts from qualitative inferences.
*   **Numeric:** 100% deterministic (e.g., Mana 100 → 80).
*   **Semantic:** Rule-based matching against the **Semantic Ontology**.
*   **Manual/Review:** Human-in-the-loop for unknown patterns.

## 2. Ontology Layers
The knowledge base of the system.
*   **Semantic Ontology:** Maps text patterns to gameplay tags (e.g., "Pierces Spell Immunity").
*   **Balance Ontology:** Maps mechanics to strategic concepts (e.g., "Movement Speed" → "Mobility") and defines impact weights.

## 3. Modeling Layer (Hero Feature Vectors)
Quantifies a hero's strategic identity across 7 dimensions (Farming, Mobility, etc.). Patch changes modify these vectors, enabling the tracking of "Hero Identity Shift" over time.

## 4. Meta Simulation Engine
The highest intelligence layer. Reasons about patch changes at a draft and strategy level, identifying synergistic winners and losers where multiple small changes coalesce into a major meta shift.

---

# Documentation Map & Index

This architecture is supported by the following detailed design and specification documents:

### Core Data & Specs
*   [DATA_MODEL.md](./DATA_MODEL.md): Primary entity definitions and integrity principles.
*   [DECISIONS.md](./DECISIONS.md): Record of architectural pivots and technical choices.
*   [VALIDATION.md](./VALIDATION.md): Evaluation framework for accuracy and quality control.

### Parser & Classification
*   [PARSER_DESIGN.md](./PARSER_DESIGN.md): Logic for converting raw Valve JSON to structured facts.
*   [CLASSIFICATION_ARCHITECTURE.md](./CLASSIFICATION_ARCHITECTURE.md): The 4-state tiered classification system.
*   [SEMANTIC_ONTOLOGY.md](./SEMANTIC_ONTOLOGY.md): Library of text patterns and gameplay tags.

### Intelligence & Analytics
*   [BALANCE_ONTOLOGY.md](./BALANCE_ONTOLOGY.md): Strategic weighting of mechanics and hero archetypes.
*   [CHANGE_GROUPING.md](./CHANGE_GROUPING.md): Aggregation of atomic changes into hero/patch summaries.
*   [HERO_FEATURE_VECTORS.md](./HERO_FEATURE_VECTORS.md): The 7-dimensional functional hero model.
*   [HISTORICAL_ANALYTICS.md](./HISTORICAL_ANALYTICS.md): Framework for tracking trajectories and power-creep.
*   [META_SIMULATION.md](./META_SIMULATION.md): Draft-level reasoning and synergistic analysis.
*   [WINRATE_CALIBRATION.md](./WINRATE_CALIBRATION.md): Real-world validation loop using external match data.

### Automation
*   [AUTOMATION_PIPELINE.md](./AUTOMATION_PIPELINE.md): Design for the future end-to-end auto-processing flow.

---

# Status

Current Status: Architecture Finalized (v2.0)
Last Updated: 2026-06-08
