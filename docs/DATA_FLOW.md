# DATA_FLOW.md - Comprehensive Pipeline Architecture

This document provides a low-level, step-by-step description of how data moves through the Dota Patch Intelligence system, from raw Valve JSON to the final interactive Frontend.

---

## 1. Data Ingestion Phase (The Raw Layer)

### 1.1 Discovery (`patchDiscovery.ts`)
*   **Trigger:** Manual or Scheduled.
*   **Source:** Valve's Steam News API (`/ISteamNews/GetNewsForApp/v2`).
*   **Process:** 
    *   Filters the news feed for titles matching patch patterns (e.g., "7.33", "7.41d").
    *   Identifies the unique `GID` (Global ID) for the news item.
    *   Extracts the version string from the title.
*   **Output:** Triggers the next stage if a new version is found.

### 1.2 Retrieval (`fetchSpecificPatch.ts`)
*   **Source:** Valve's Official Datafeed API (`https://www.dota2.com/datafeed/patchnotes?version=...`).
*   **Process:** 
    *   Requests the full JSON payload for a specific version.
    *   Downloads hero/item metadata if not cached.
*   **Data Types:** Raw JSON containing deeply nested arrays of `general_notes`, `item_updates`, and `hero_updates`.
*   **Storage:** `research-output/patches/[version]/data.json`.

---

## 2. Structural Parsing Phase (The Normalization Layer)

### 2.1 Normalization (`parsePatches.ts`)
*   **Input:** `research-output/patches/[version]/data.json`.
*   **Process:** 
    *   **Flattening:** Decomposes Valve's nested structure into a flat list of `StructuredChange` objects.
    *   **Entity Mapping:** Maps Valve's internal `ability_id` and `hero_id` to English names using `research-output/mappings/`.
    *   **Sub-Entity Extraction:** Separates the base entity (e.g., "Anti-Mage") from the specific ability being changed (e.g., "Mana Void").
    *   **Type Determination:** Assigns a `changeType` (ADDITION, REMOVAL, REWORK, ADJUSTMENT) based on the note's structure.
*   **Output:** `research-output/structured-patches/[version].json`.

---

## 3. Classification & Scoring Phase (The Intelligence Layer)

### 3.1 Classification (`classifyPatches.ts`)
*   **Input:** Structured patches.
*   **Logic:** Uses a **Tiered Classification Architecture**.
    1.  **Numeric Analysis:** Uses Regex to extract value shifts (e.g., "Damage increased from 10 to 20"). If the number goes up, it's a BUFF.
    2.  **Semantic Analysis:** Uses `SEMANTIC_ONTOLOGY.md` to match keywords (e.g., "Reduced cooldown" = BUFF).
    3.  **Fallback:** Marks unmatchable notes as `UNKNOWN` for manual review.
*   **Output:** `research-output/classified-patches/[version].json`.

### 3.2 Feature Vector Calculation (`calculateVectors.ts`)
*   **Logic:** Every change is mapped to one or more of 7 dimensions: `farming`, `mobility`, `survivability`, `teamfight`, `laning`, `siege`, `utility`.
*   **Transformation:** Each dimension is assigned a delta (e.g., +0.5 mobility).
*   **Output:** `research-output/feature-vectors/vectors-[version].json`.

### 3.3 Impact Scoring (`impactScorer.ts`)
*   **Logic:** Aggregates all changes for an entity into a single `ImpactScore` (-10 to +10).
*   **Weighting:** Uses `BALANCE_ONTOLOGY.md` to weight changes (e.g., a "Base Armor" buff is weighted higher than a "Late Game Talent" buff).
*   **Output:** `research-output/impact-scored-patches/[version].json`.

---

## 4. Synthesis & Grounding Phase (Phase 18 / Phase 15)

### 4.1 Factual Grounding (`backfillMeta.ts` + `herodata.json`)
*   **Context Injection:** For every patch, the system loads `research-output/mappings/herodata.json`.
*   **Reference Guide:** It identifies all heroes changed in the patch and builds a `FACTUAL_REFERENCE_GUIDE` (Attributes, Base Stats, Official Ability Names).
*   **Temporal Context:** It loads the `metaShifts` from the *previous* patch file to provide history.

### 4.2 LLM Meta Analysis (Gemini 2.5 Flash)
*   **Prompting:** Combines the Factual Guide, Previous Context, and Current Classified Changes into a single prompt.
*   **Constraint Engine:** Strict rules prohibit composite names (e.g., "Axe + Blink") and enforce single-entity entries.
*   **Relative Strength:** The LLM assigns a `temporalAssessment` (Net Gain / Recovery) to each winner.
*   **Output:** `research-output/meta-analysis/meta-[version].json`.

### 4.3 Programmatic Validation (`factChecker.ts`)
*   **Audit:** Scans the LLM output. 
*   **Verification:** Checks every entity name against official mappings. 
*   **Pattern Matching:** Rejects known hallucination patterns (e.g., "Morphling Intelligence Shift").
*   **Gatekeeping:** If errors are found, the analysis is discarded.

---

## 5. Persistence & Delivery Phase (The Presentation Layer)

### 5.1 Database Seeding (`seed.ts` + Prisma)
*   **Input:** All files in `research-output/`.
*   **Process:** 
    *   Upserts Patches, Entities, and Changes.
    *   Calculates "Global Rank" distributions for winrates.
    *   Links Meta-Analysis narratives to Patch IDs.
*   **Target:** Local PostgreSQL instance (`dota_patch_intel`).

### 5.2 Build-Time API (Fastify + `server.ts`)
*   **Trigger:** Part of the Next.js build process.
*   **Process:** Serves relational queries to the Next.js static generator.
*   **Resilience:** If the API fails, Next.js falls back to local JSON archives stored in the repository.

### 5.3 Static Frontend (Next.js + Vanilla CSS)
*   **Components:** 
    *   `HeroCard`: Renders 7D Feature Vectors and impact summaries.
    *   `WinrateHistogram`: Visualizes historical vs. live performance.
    *   `MetaSummary`: Displays thematic shifts and synergistic winners.
*   **Deployment:** GitHub Pages (Static export).

---

## 6. Data Entities & Types Reference

| Entity | Primary Data File | Key Responsibility |
| :--- | :--- | :--- |
| **Patch** | `data.json` | Versioning and release timeline. |
| **Change** | `structured.json` | The atomic balance adjustment. |
| **Vector** | `vectors.json` | 7D identity trajectory (farming, mobility, etc). |
| **Meta** | `meta.json` | Narrative synthesis and role analysis. |
| **Mapping** | `heroes.json` | Grounding and entity resolution. |
