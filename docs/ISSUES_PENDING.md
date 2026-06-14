# Identified Issues — Pending Discussion

This document tracks identified architectural issues in the Dota Patch Intelligence pipeline that require design decisions before implementation begins.

---

### ISSUE-1: No Ontology Version Tracking Across Processed Outputs

**Status:** Pending Discussion

**Problem**
The current pipeline processes each patch once and stores the resulting JSON output. The Semantic Ontology and Balance Ontology are expected to evolve as new tags are added and weights are calibrated. Currently, processed files carry no record of the ontology version used during their generation (Steps 4-6). This makes it impossible to programmatically identify which historical patches are using outdated classification logic or require re-scoring following an ontology update.

**Proposed Direction**
Attach version stamps to every processed output file at the classification and scoring stages. Maintain a lightweight versioning record for both ontologies. Implement a mechanism (either via script or database flag) to compare stored patch metadata against the current system version to identify and selectively re-process outdated data.

**Implications for This Project**
This would require updates to the JSON schemas for classified and impact-scored patches. The database schema would need new fields to track these versions. Upstream classification logic would need to import and attach the current version string.

**Open Questions**
*   How should ontology versioning be handled (e.g., Semantic Versioning vs. simple integers)?
*   Should re-processing be fully automated upon detecting a version mismatch, or triggered manually?
*   Where is the "Source of Truth" for the current system version best stored?

**Priority Suggestion**
Tier 2: Essential for long-term data integrity as the system's analytical ruleset matures.

---

### ISSUE-2: Classification Has No Partial Confidence State

**Status:** Pending Discussion

**Problem**
The classification stage (Step 4, `classifyPatches.ts`) currently uses a binary outcome: a note is either matched to a semantic tag or relegated to `UNKNOWN`. Notes that partially match a pattern (e.g., mentions of "Illusion" without enough context to confirm a specific interaction type) lose all diagnostic signal. The human review tool (`reviewUnknowns.ts`) presents these as blank entries, providing no assistance to the reviewer.

**Proposed Direction**
Introduce a `PARTIALLY_CLASSIFIED` state. When a match is detected but falls below a set confidence threshold, store the change with its "best-guess" tag, a confidence score, and a flag for human confirmation. The human review queue should surface this candidate tag to the user for faster verification or correction.

**Implications for This Project**
This change affects `classifyPatches.ts` and the `StructuredChange` type. The human review tool and the database schema must be updated to handle and display confidence scores and partial states.

**Open Questions**
*   What metrics or heuristics should define the confidence threshold?
*   Should the LLM be used to resolve partial matches before they reach human review?
*   How does this state affect downstream feature vector and impact score calculations (should partial data be included in the math)?

**Priority Suggestion**
Tier 3: Improves developer efficiency and classification accuracy but is not a blocker for core functionality.

---

### ISSUE-3: Fact-Checker Uses All-or-Nothing Discard

**Status:** Pending Discussion

**Problem**
The fact-checker (Step 9, `factChecker.ts`) validates LLM output against official entity mappings and currently discards the entire meta-analysis if a single hallucinated name is detected. This results in the loss of valid thematic summaries and narrative insights due to a single minor naming error (e.g., one typo in a "Winners" list). There is no granular logging indicating exactly what caused a discard.

**Proposed Direction**
Investigate a "partial-acceptance" mode where the system removes invalid individual entries while retaining the valid portions of the analysis. The stored record should be flagged as "partially validated," and the discard log must record specific rejected entries for debugging.

**Implications for This Project**
This would require more complex logic in `factChecker.ts` to surgically edit JSON outputs. The `MetaAnalysis` database table may need a validation state flag. Downstream frontend components would need to handle cases where lists might be empty or filtered.

**Open Questions**
*   Is it safe to retain a thematic summary if one of the heroes it mentions was a hallucination?
*   Which specific fields (e.g., synergistic winners vs. role-specific lists) are safe for partial validation?
*   How should "partially validated" data be represented to the end-user in the UI?

**Priority Suggestion**
Tier 2: Crucial for reducing manual re-runs and maximizing the utility of expensive LLM calls.

---

### ISSUE-4: Single Mega-Prompt for LLM Meta Analysis May Not Scale

**Status:** Pending Discussion

**Problem**
Step 8 currently combines the factual reference guide, previous patch context, and all classified changes into one massive prompt for Gemini 2.5 Flash. For major "letter" patches (e.g., 7.33), the context size can lead to inconsistent formatting, violations of entity precision rules, and increased hallucination rates. Validating a single monolithic response is more difficult for the fact-checker.

**Proposed Direction**
Investigate decomposing the meta-analysis into smaller, category-specific prompts (Hero changes, Item changes, Systemic changes). Each sub-prompt would have its own focused factual guide and its own fact-checking pass. A final synthesis step would then aggregate these validated sub-components into the top-level narrative.

**Implications for This Project**
This would significantly increase the number of LLM calls per patch, potentially hitting quota limits faster. It would require a major refactor of `backfillMeta.ts` and potentially change how `MetaAnalysis` objects are structured before synthesis.

**Open Questions**
*   Does the benefit of accuracy outweigh the increased cost and latency of multiple LLM calls?
*   How can we ensure the final synthesis doesn't lose the "Strategic Intuition" gained from seeing the full patch context at once?
*   What is the maximum context size the current engine can safely handle before splitting is mandatory?

**Priority Suggestion**
Tier 3: Important for scaling to massive patches but manageable for minor updates.

---

### ISSUE-5: Raw Note Text Is Not Preserved in a Queryable Form

**Status:** Pending Discussion

**Problem**
The pipeline progressively transforms raw note text into structured objects. While intermediate JSON files exist, the original raw text string is not stored alongside its final semantic classification in the PostgreSQL database in a queryable format. This prevents the system from performing historical text-based searches or identifying patterns across years of changes to specific mechanics (e.g., "Show all changes mentioning 'Break'").

**Proposed Direction**
Ensure that `seed.ts` writes the original raw note string, the final semantic tag, and the classification state to a dedicated table or field in the database. This creates a permanent, queryable audit trail of how the system interpreted Valve's original text.

**Implications for This Project**
This requires a minor database schema update to `PatchChange`. It adds a small amount of storage overhead to the PostgreSQL instance but provides significant value for ontology development and "Search by Mechanic" features.

**Open Questions**
*   Should the raw text be stored in the main `PatchChange` table or a separate `ChangeArchive` table to keep the primary indexes lean?
*   Do we need to store the raw HTML version or only a sanitized text version?

**Priority Suggestion**
Tier 1: Cheap to implement now, but extremely expensive and difficult to backfill later if data is lost.

---

### ISSUE-6: Winrate Data Source and Calibration Status Is Undocumented

**Status:** Pending Discussion

**Problem**
`seed.ts` is documented as calculating rank distributions, but there is no clear record of the winrate data's source, its update frequency, or its current integration with the calibration loop. The `WINRATE_CALIBRATION.md` file suggests integration is a future task, creating ambiguity about whether current winrate displays are static snapshots or live data.

**Proposed Direction**
Document the actual current state of winrate data in `ROADMAP.md` and the calibration documentation. Clearly state the current source (manually-sourced vs. API-driven) and the current refresh policy. Define the path for connecting this data to the automated weight calibration loop.

**Implications for This Project**
This is primarily a documentation task, but it surfaces technical gaps in `fetchOpenDotaWinrates.ts` and `calibrateWeights.ts`. It may impact how users interpret "Impact Scores" in the UI if they don't know the data's recency.

**Open Questions**
*   What is the official policy for updating winrates for historical patches versus the current active patch?
*   Is the current Professional Baseline data sufficient for calibration, or do we need tiered rank data?
*   How do we handle winrate volatility in the first 48 hours of a new patch release?

**Priority Suggestion**
Tier 1: Eliminates technical debt and prevents confusion during algorithmic refinement.
