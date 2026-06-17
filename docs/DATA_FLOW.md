# DATA_FLOW.md - Comprehensive Pipeline Architecture

This document provides a low-level, step-by-step description of how data moves through the Dota Patch Intelligence system, from raw Valve JSON to the final interactive Frontend.

---

## 1. Data Ingestion Phase (The Raw Layer)

### 1.1 Discovery (`patchDiscovery.ts`)
*   **Trigger:** Automated cron job (every 6h) or manual CLI.
*   **Source:** Valve's Steam News API (`/ISteamNews/GetNewsForApp/v2`).
*   **Process:** 
    *   Filters the news feed for titles matching patch patterns (e.g., "7.33", "7.41d").
    *   Identifies the unique `GID` (Global ID) for the news item.
    *   **Output:** Returns a specific `NEW_PATCH=version` string to trigger the CI/CD pipeline.

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
    *   **Data Preservation:** Maps the 100% raw Valve string to `originalSource` (ISSUE-5) while cleaning the `rawNote` for display.
    *   **Entity Mapping:** Maps Valve's internal `ability_id` and `hero_id` to English names using `research-output/mappings/`.
    *   **Sub-Entity Extraction:** Separates the base entity (e.g., "Anti-Mage") from the specific ability being changed (e.g., "Mana Void").
    *   **Type Determination:** Assigns a `changeType` (ADDITION, REMOVAL, REWORK, ADJUSTMENT) based on the note's structure.
*   **Output:** `research-output/structured-patches/[version].json`.

---

## 3. Classification & Scoring Phase (The Intelligence Layer)

### 3.1 Classification (`classifyPatches.ts`)
*   **Input:** Structured patches.
*   **Logic:** Uses a **Tiered Classification Architecture**.
    1.  **Numeric Analysis:** Uses Regex to extract value shifts. If the number goes up, it's a BUFF.
    2.  **Semantic Analysis:** Uses `SEMANTIC_ONTOLOGY.md` to match exact keyword patterns.
    3.  **Partial Match Heuristic:** Keyword-based scoring for `PARTIALLY_CLASSIFIED` state (ISSUE-2).
*   **Versioning:** Stamps the output with the current `ontologyVersion` (ISSUE-1).
*   **Output:** `research-output/classified-patches/[version].json`.

### 3.2 Feature Vector Calculation (`calculateVectors.ts`)
*   **Logic:** Every change is mapped to one or more of 7 dimensions: `farming`, `mobility`, `survivability`, `teamfight`, `laning`, `siege`, `utility`.
*   **Transformation:** Each dimension is assigned a delta (e.g., +0.5 mobility).
*   **Output:** `research-output/feature-vectors/vectors-[version].json`.

### 3.3 Impact Scoring (`impactScorer.ts`)
*   **Logic:** Aggregates all changes for an entity into a single `ImpactScore` (-10 to +10).
*   **Weighting:** Uses `BALANCE_ONTOLOGY.md` to weight changes.
*   **Versioning:** Stamps output with `scorerVersion` (ISSUE-1).
*   **Output:** `research-output/impact-scored-patches/[version].json`.

---

## 4. Synthesis & Grounding Phase (Phase 18 / Phase 15 / Phase 19)

### 4.1 Factual Grounding (`backfillMeta.ts` + `herodata.json`)
*   **Context Injection:** For every patch, the system loads `research-output/mappings/herodata.json`.
*   **Reference Guide:** It identifies all heroes changed in the patch and builds a `FACTUAL_REFERENCE_GUIDE` (Attributes, Base Stats, Official Ability Names).
*   **Temporal Context:** It loads the `metaShifts` from the *previous* patch file to provide history.

### 4.2 LLM Meta Analysis (Gemini 2.5 Flash)
*   **Split-Prompt Architecture:** Large patches are categorized and analyzed via separate sub-prompts (Heroes vs. Items/Systems) to prevent context overflow (ISSUE-4).
*   **Synthesis Pass:** Combines validated category outputs into the final meta narrative.
*   **Relative Strength:** The LLM assigns a `temporalAssessment` (Net Gain / Recovery) to each winner.
*   **Output:** `research-output/meta-analysis/meta-[version].json`.

### 4.3 Programmatic Validation (`factChecker.ts` & `auditPredictions.ts`)
*   **Surgical Audit:** Scans LLM output and filters out specific hallucinated entities and their referencing narrative paragraphs (ISSUE-3).
*   **Empirical Audit:** Compares predictions against historical `GLOBAL_BLEND` deltas to calculate the **Truth Score** (ISSUE-19).

---

## 5. Persistence & Delivery Phase (The Presentation Layer)

### 5.1 Orchestration (`automationPipeline.ts`)
*   **Role:** Unified orchestrator that strings together all data ingestion, processing, and generation commands sequentially.
*   **Safety:** Triggers `db:backup` before any database modifications.

### 5.2 Database Seeding (`seed.ts` + Prisma)
*   **Input:** All files in `research-output/`.
*   **Process:** 
    *   Upserts Patches, Entities, and Changes.
    *   Syncs ontology, scorer, and analysis versions to the relational tables.
*   **Target:** Local PostgreSQL instance (`dota_patch_intel`).

### 5.3 Static Frontend (Next.js + Vanilla CSS)
*   **Deployment:** GitHub Pages (Fully automated zero-touch updates).
*   **Directory Views:** New `/heroes` and `/items` rosters with stylish backgrounds.
