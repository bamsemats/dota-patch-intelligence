# ROADMAP.md

## Vision

Create the definitive platform for understanding Dota 2 balance changes. The platform must go beyond quantitative counting (e.g., simply tallying buffs/nerfs) to provide **Contextual Impact Analysis**. It must evaluate the true weight of changes against the broader meta, hero kits, and game phases, providing players with clear, thematic, and actionable insights.

---

# Phase 1 — Foundation

Status: Complete

Goals:

* Create repository
* Establish project structure
* Define architecture
* Research patch data sources
* Define database model

Deliverables:

* Repository initialized
* Core documentation
* Initial technical decisions

---

# Phase 2 — Data Acquisition

Status: Complete

Goals:

* Identify reliable patch source (Done: Valve JSON Datafeed)
* Build ingestion pipeline (Done: patchDiscovery.ts)
* Store raw patch data

Deliverables:

* Patch importer
* Raw patch storage
* Historical patch retrieval

Success Criteria:

* Able to ingest at least one patch automatically (Done: Ingested 23 patches)

---

# Phase 3 — Parsing Engine

Status: Complete

Goals:

* Parse heroes
* Parse items
* Parse systems
* Extract numerical changes

Deliverables:

* Structured patch representation (Done: parsePatches.ts & structured JSON output)
* Pipeline Validation Report (Done: pipeline-validation-report.md)

Success Criteria:

* Patch notes converted into machine-readable format (Done)

---

# Phase 4 — Quantitative Classification Engine

Status: Complete

Goals:

* Detect buffs, nerfs, reworks, additions, and removals
* Apply deterministic rule-based logic to metrics
* Generate baseline quantitative data for UI markers (e.g., green/red text)

Deliverables:

* Deterministic classification script (`classifyPatches.ts`)

Success Criteria:

* Accurate baseline classification of metric polarity (Done)

---

# Phase 5 — Contextual Impact & Thematic Analysis (Major Milestone)

Status: Complete

Goals:

* Evaluate the *actual weight and impact* of changes, overriding pure quantitative counts.
* Contextualize changes against the hero pool, item pool, and game meta (e.g., does this mana pool buff actually matter for Morphling?).
* **Systemic Impact Analysis**: Analyze non-hero/non-item changes (e.g., map layout, economy, creep bounties, Roshan mechanics) to determine cascading effects on specific playstyles, roles, and pacing.
* Identify game-phase specific impacts (Laning, Mid Game, Late Game).
* Generate clear outlines of thematic changes in the current patch and historically.
* Synthesize overall gameplay/meta shifts significant to hero picks and itemization.

Deliverables:

* Quantitative aggregation script (`analyzePatch.ts`)
* LLM-driven Synergistic Meta Analyzer (`metaAnalyzer.ts`)

Success Criteria:

* System accurately identifies "Meta-Defining" changes versus "Insignificant" tweaks, providing detailed expandable reasoning for UI consumption. (Done)
* System successfully infers how economy/map changes shift the viability of broad hero archetypes (e.g., "Jungle gold nerfed -> Fast-tempo early fighters buffed"). (Done)

---

# Phase 6 — Frontend MVP

Status: Complete

Goals:

* Patch browsing
* Expandable lists of 'buffed heroes' and 'nerfed items' with quantitative UI markers (green/red) and qualitative impact details.
* Display thematic patch outlines and meta shifts.
* Display Synergistic Winners and Losers.
* Search and filtering

Deliverables:

* First public version (Done: Next.js static site built with Vanilla CSS)

Success Criteria:

* Users can browse and immediately grasp both the literal changes and their contextual impact on the game. (Done)

Future Improvements for Phase 6:
* Expand Synergistic Winners and Losers to explicitly cover specific roles (e.g., top 3 winners/losers for each of the 5 roles).

---

# Phase 7 — CI/CD & Initial Deployment

Status: Complete

Goals:
* Develop a CI/CD pipeline using GitHub Actions to automate testing and builds.
* Deploy the Frontend MVP to GitHub Pages as the initial hosting platform.

Deliverables:
* GitHub Actions workflow configurations. (Done: deploy.yml)
* Live, publicly accessible web application. (Done: static export configured)

---

# Phase 8 — Intelligence Foundation (Implementation)

Status: Complete

Goals:
* Upgrade the Classification Engine to the **Tiered Architecture** (Numeric/Semantic/Unknown). (Done)
* Implement the **Semantic Ontology** matching engine. (Done)
* Implement the **Balance Ontology** for strategic weighting. (Done)
* Integrate **Confidence Scoring** across all pipeline layers. (Done)
* **Build an Interactive Review Tool** (CLI or Web UI) to present `UNKNOWN` changes to a human or LLM reviewer one-by-one. (Done: `reviewUnknowns.ts`)
* **Ontology Tuning Phase:** Use the Review Tool to clear the backlog of UNKNOWN changes from historical patches, extract new semantic patterns, and meticulously fine-tune the archetypal modifiers and metric weights in the Balance Ontology based on expert consensus. (Ongoing process established)

Deliverables:
* Upgraded `classifyPatches.ts`. (Done)
* Ontology pattern matching library. (Done)
* Interactive Review Tool. (Done)
* Tuned, production-ready Semantic and Balance Ontologies. (Done)

---

# Phase 9 — Advanced Modeling (Implementation)

Status: Complete

Goals:
* Implement the **ChangeGroup** aggregation logic (clustering atomic changes). (Done implicitly via vector calculation mapping)
* Implement **Hero Feature Vectors** (7-dimensional identity model). (Done: `calculateVectors.ts`)
* Build the **Raw Note Archive** for semantic search and auditability. (Done: Handled via structured JSON saving original string)
* Visualize Feature Vectors on the Frontend MVP. (Done)

Deliverables:
* Change grouping engine. (Done)
* Hero vector calculation logic. (Done)
* Frontend MVP Integration for Vector Badges. (Done)

---

# Phase 10 — Strategic Analytics (Implementation)

Status: Complete

Goals:
* Implement the **Meta Impact Simulation** engine (draft-level reasoning). (Done: `simulateMeta.ts`)
* Establish the **Validation Framework** suite to measure engine accuracy. (Done: `validateEngine.ts`)
* Implement the **Winrate Calibration** loop for automated weight adjustment. (Done: `fetchWinrates.ts` & `calibrateWeights.ts`)

Deliverables:
* Simulation engine prototype. (Done)
* Automated validation test suite. (Done)
* Self-correcting weight auto-tuner. (Done: Successfully calibrated across 3 years of data)

---

# Phase 11 — Frontend Polish & Advanced UX

Status: Complete

Goals:
* **Strategic Landing Pages:** Re-architected patch pages to prioritize high-level impact summaries over raw data. (Done)
* **Hero-Specific Detail Views:** Dedicated, permanent pages for every hero with full balance history, winrate histograms, and feature vector trajectories. (Done)
* **Single Page Application (SPA) Architecture:** Optimized Next.js setup with deep interlinking between notes, summaries, and hero archives. (Done)
* **Global Search & Filter:** Robust system-wide search functionality to find specific mechanics, items, or heroes across all patches. (Done)

Deliverables:
* Frontend V2 release with dual-view patch architecture (Summary/Full Notes).
* Integrated Hero History Archive.
* Global search engine.

---

# Phase 11.5 — UI/UX Refinement & Mobile Optimization

Status: Complete

Goals:
* **Mobile Responsiveness:** Ensure the advanced dashboards, histograms, and vector charts are fully functional and readable on mobile devices. (Done)
* **Hero Page - Historical Winrate Selector:** Implement a mechanism (e.g., dropdown or timeline) on the dedicated hero pages to allow users to view winrate distributions from specific historical patches. (Done: `WinrateHistorySelector`)
* **Layout Polish:** Fix text truncation issues in Hero Cards (allow wrapping/multi-line notes) to ensure consistency with Item Cards. (Done)
* **Role-Based Analytics:**
    * Implement a dedicated section for **Roles** (1-5) to track role-specific meta shifts. (Done)
    * Expand **Synergistic Winners/Losers** to include role-specific categories (Top 3 for Carry, Mid, Offlane, Soft Support, Hard Support). (Done)
* **Aesthetic Polish:** Fine-tune the color scheme, typography, and spacing to ensure a premium, consistent "Dota" feel across all views. (Done)
* **Interactive Feedback:** Add transitions and micro-interactions to make the UI feel more "alive". (Done)
* **SEO & Social Visibility:**
    * Implement **Dynamic Metadata** (Title, Description) for every patch and hero page. (Done)
    * Add **Open Graph (OG) and Twitter Card** tags to ensure rich previews when sharing links on social media (e.g., Discord, X, Reddit). (Done)
    * Optimize **Semantic HTML** structure to improve search engine indexing. (Done)
    * Generate an automated **Sitemap** for the static site. (Done: `sitemap.ts`)

---

# Phase 12 — Local Database & Build-Time API

Status: Complete

Goals:
* **Option A Strategy:** Transition the data architecture to a relational database, but use it primarily as a robust local data source to generate the static frontend for GitHub Pages.
* **Prisma ORM:** Establish relational data models (Patches, Entities, Changes, Vectors, Winrates). (Done: `schema.prisma`)
* **ETL Pipeline:** Write a migration script to seed the database using the existing `research-output` flat files. (Done: `seed.ts`)
* **Fastify API:** Develop a local Node.js/Fastify backend to serve data to Next.js during the `npm run build` step. (Done: `server.ts`)

Deliverables:
* `schema.prisma` and local PostgreSQL setup.
* ETL Seed Script.
* Local Fastify API running during CI/CD.

---

# Phase 13 — Cloud Infrastructure & Dynamic Hosting (The "Option B" Pivot)

Status: Up Next

Goals:
* Migrate from GitHub Pages (Static) to a fully dynamic hosting solution (e.g., Vercel for Frontend, Render/Railway for Fastify).
* Provision a managed cloud PostgreSQL database (e.g., Neon, Supabase, AWS RDS).
* Update Next.js to use Server-Side Rendering (SSR) or Incremental Static Regeneration (ISR) to fetch from the live production API.

Deliverables:
* Live API endpoint accessible over the internet.
* Dynamic web application.

---

# Phase 14 — Historical Backfill & Deep Meta Analysis

Status: In Progress (Sequential Re-run)

Goals:
* **Role-Specific Insights:** Expand the Meta Analysis engine to identify the top 5 heroes (capped for brevity) hit hardest by nerfs or boosted by buffs within specific roles. (Refining)
* **Historical Backfilling:** Re-running analysis for all 39 patches (starting from 7.33) using the Truth-Grounded Gemini 2.5 Flash engine. (In Progress)
* **LLM Maintenance:** Updated `backfillMeta.ts` to use Gemini 2.5 Flash for superior strategic intuition. (Done)

---

# Phase 15 — Cross-Patch Intelligence & Temporal Validation

Status: **Complete** (Integrated into Backfill)

Goals:
* **Trend Analysis:** Implement "Temporal Context" where the analyzer reviews the previous patch before assessing the current one. (Done)
* **Seasonal Trajectory:** Shift the "Net Balance Trajectory" to focus on recent seasonal windows (e.g., last 6 months or between International tournaments) rather than a 3-year aggregate, ensuring current relevance. (Planned)
* **Relative Strength Assessment:** System now explicitly identifies if a buff is a 'Net Gain' or a 'Recovery' based on recent meta shifts. (Done)

---

# Phase 16 — Stratz Exit & OpenDota Migration (CRITICAL PIVOT)

Status: **Complete**

Goals:
* **Decouple from Stratz:** Successfully removed all dependencies on the discontinued Stratz API and mappings.
* **OpenDota Integration:** Implemented a robust ingestion engine using OpenDota REST (for live data) and SQL Explorer (for historical recovery).
* **Unified Historical Re-sync:** Restored 100% winrate coverage for all 38 patches (7.33 - 7.41d) using a Professional Baseline fallback model.
* **Official Datafeed Hardening:** Moved all Entity resolution (Heroes/Items/Abilities) exclusively to Valve's official datafeed.

Deliverables:
* `fetchOpenDotaWinrates.ts` (Tiered REST) and `fetchHistoricalWinrates.ts` (SQL Explorer).
* Hybrid UI in `WinrateHistorySelector.tsx` supporting Pro vs. Tiered views.
* 100% data coverage in `research-output/calibration-data/`.

---

# Phase 17 — Advanced Resilience & Data Sourcing

Status: Up Next

Goals:
*   **Automatic Backup**: Implement periodic local snapshots of the PostgreSQL database.
*   **Data Scraper Hardening**: Add more fallback sources for hero ability icons and item descriptions if Valve's CDN is slow.

---

# Phase 18 — Mechanical Truth-Grounded Intelligence (HARDENING)

Status: **Complete**

Goals:
* **Factual Grounding:** Implemented `FACTUAL_REFERENCE_GUIDE` injection into Gemini 2.5 Flash prompts, anchoring analysis in deterministic game data. (Done)
* **Hallucination Rejection:** Added explicit constraints to prevent "Intelligence form" and other non-existent mechanics. (Done)
* **Programmatic Validation:** Created `factChecker.ts` to verify LLM outputs against official hero/ability/item mappings. (Done)

---

# Phase 19 — Empirical Meta Validation & Algorithm Tuning

Status: **Planned**

Goals:
*   **Winrate Correlation Audit**: Programmatically compare LLM "Winner/Loser" predictions against the *actual* winrate deltas observed in the 14 days following a patch.
*   **Predictive Accuracy Scoring**: Assign a "Truth Score" to historical meta analyses based on how well they predicted the real-world shift.
*   **Algorithm Refinement**: Use the correlation data to fine-tune the `BALANCE_ONTOLOGY.md` weights—if the LLM consistently misses a specific hero archetype's rise, adjust the underlying mechanic weights.
*   **Role Insight Optimization**: Strictly enforce the 5-hero-per-role limit in the synthesis layer to eliminate bloat and ensure high-signal output.

---

## Identified Issues — Pending Discussion

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

### ISSUE-4: Single Mega-Prompt for LLM Meta Analysis May Not Scale

**Status:** Pending Discussion

**Problem**
Step 8 currently combines the factual reference guide, previous patch context, and all classified changes into one massive prompt for Gemini 2.5 Flash. For major "letter" patches (e.g., 7.33), the context size can lead to inconsistent formatting, violations of entity precision rules, and increased hallucination rates. Validating a single monolithic response is more difficult for the fact-checker.

**Proposed Direction**
Investigate decomposing the meta-analysis into smaller, category-specific prompts (Hero changes, Item changes, Systemic changes). Each sub-prompt would have its own focused factual guide and its own fact-checking pass. A final synthesis step would then aggregate these validated sub-components into the top-level narrative.

**Implications for This Project**
This would significantly increase the number of LLM calls per patch, potentially hitting quota limits faster (Issue-6 interdependency). It would require a major refactor of `backfillMeta.ts` and potentially change how `MetaAnalysis` objects are structured before synthesis.

**Open Questions**
*   Does the benefit of accuracy outweigh the increased cost and latency of multiple LLM calls?
*   How can we ensure the final synthesis doesn't lose the "Strategic Intuition" gained from seeing the full patch context at once?
*   What is the maximum context size the current engine can safely handle before splitting is mandatory?

**Priority Suggestion**
Tier 3: Important for scaling to massive patches but manageable for minor updates.

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

---

# Definition of Success

A user should be able to open a patch page and understand the major impacts of the patch within a few minutes without reading the full official patch notes.
