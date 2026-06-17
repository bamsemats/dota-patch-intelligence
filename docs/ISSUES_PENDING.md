# Identified Issues — Resolved & Implemented

This document tracks architectural issues in the Dota Patch Intelligence pipeline that have been successfully designed and implemented.

---

### ISSUE-1: No Ontology Version Tracking Across Processed Outputs

**Status:** Implemented

**Problem**
Processed files carried no record of the ontology version used during their generation, making it impossible to programmatically identify which historical patches used outdated classification logic.

**Resolution**
*   Created `research-output/ontology/version.json` to act as the single source of truth for Semantic and Balance ontology versions.
*   Updated `classifyPatches.ts` and `impactScorer.ts` to attach these version stamps to JSON outputs.
*   Updated `seed.ts` and the Prisma schema to store `ontologyVersion`, `scorerVersion`, and `analysisVersion` natively in the PostgreSQL database, supporting auto-invalidation strategies.

---

### ISSUE-2: Classification Has No Partial Confidence State

**Status:** Implemented

**Problem**
The classification stage used a binary outcome: matched or `UNKNOWN`. Partial semantic matches lost all diagnostic signal.

**Resolution**
*   Introduced a `PARTIALLY_CLASSIFIED` state in `classifyPatches.ts`.
*   Implemented "Keyword Weighting": If a deterministic match fails, the system breaks ontology patterns into core keywords and scores the raw note based on hits.
*   Changes with keyword hits are assigned a 0.5 confidence score, saving the "Best Guess" tag for human review.
*   The UI (`HeroDetailModal.tsx` and `Legend.tsx`) now displays a "SYSTEM ESTIMATE" badge for these changes.

---

### ISSUE-3: Fact-Checker Uses All-or-Nothing Discard

**Status:** Implemented

**Problem**
The fact-checker discarded the entire meta-analysis if a single hallucinated name was detected, losing valid narrative insights due to minor errors.

**Resolution**
*   Refactored `factChecker.ts` to perform "Surgical Removal."
*   Invalid entities are now selectively filtered out of the Synergistic and Role arrays.
*   Implemented "Cross-Validation Discard": If a narrative summary explicitly mentions a hallucinated entity, that specific thematic paragraph is deleted, but the rest of the analysis is saved.
*   Files edited in this manner are saved with a `PARTIALLY_VALIDATED` state.

---

### ISSUE-4: Single Mega-Prompt for LLM Meta Analysis May Not Scale

**Status:** Implemented

**Problem**
Combining all changes into one massive prompt for major patches (like 7.33) led to context overflow, JSON cutoff errors, and increased hallucination rates.

**Resolution**
*   Refactored `backfillMeta.ts` to use a "Split-Prompt Architecture."
*   Large patches are automatically divided into Hero, Item, and General categories.
*   Each category is analyzed independently (retaining the previous patch context), and a final "Synthesis" pass combines the partial outputs into the top-level narrative.

---

### ISSUE-5: Raw Note Text Is Not Preserved in a Queryable Form

**Status:** Implemented

**Problem**
The original raw text string from Valve was not stored alongside its final semantic classification in the database, preventing historical text-based searches.

**Resolution**
*   Added an `originalSource` field to the `PatchChange` Prisma schema.
*   Updated `parsePatches.ts` to copy the 100% raw Valve string into this field, while preserving `rawNote` for the cleaned UI display text.
*   Updated `seed.ts` to populate this field in PostgreSQL, creating a permanent audit trail.

---

### ISSUE-6: Winrate Data Source and Calibration Status Is Undocumented

**Status:** Implemented

**Problem**
Winrate data source, update frequency, and integration with the calibration loop were undocumented and ambiguous.

**Resolution**
*   Updated `fetchOpenDotaWinrates.ts` to explicitly pull data for Pro, Immortal, and Divine brackets.
*   Calculated a new `GLOBAL_BLEND` metric (weighted average heavily favoring Pro picks).
*   Refactored `calibrateWeights.ts` to use this `GLOBAL_BLEND` as the sole empirical truth for auto-tuning the `balance_metrics.json` ontology.
