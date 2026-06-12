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

Status: In Progress (High-Fidelity Re-run)

Goals:
* **Role-Specific Losers:** Expand the Meta Analysis engine to identify the heroes hit hardest by nerfs within specific roles. (Done)
* **High-Fidelity Grounding:** Enforce strict "Zero Hallucination" rules regarding item-hero synergies (e.g., no Gleipnir on PA) and mechanical interactions. (Done)
* **Historical Backfilling:** Re-run analysis for all 35 patches using Claude 4 Sonnet with high-fidelity constraints. (Done: Initial Re-run)
* **Intuitive Meta Correction (TODO):** Re-run the meta-analysis for all patches using **Gemini 2.5 Flash** (once quota resets) to restore the "Strategic Intuition" and thematic depth that Gemini captures better than Claude, while keeping the high-fidelity grounding rules. (See `docs/GEMINI_META_PLAN.md`)
* **LLM Maintenance:** Update the model string in `backfillMeta.ts` to a newer stable version (e.g., `claude-3-7-sonnet-latest`) before the June 15th, 2026 deprecation of `claude-sonnet-4-20250514`.
* **CI/CD Build Robustness:** Refactored the frontend to use a local JSON fallback during the Next.js `npm run build` process, ensuring successful GitHub Pages deployment even when the API is offline. (Done)

---

# Phase 15 — Cross-Patch Intelligence & Temporal Validation

Status: Up Next (CRITICAL)

Goals:
* **Trend Analysis:** Implement "Temporal Context" where the analyzer reviews the previous patch before assessing the current one.
* **Relative Strength Assessment:** Determine if a current buff is a net gain or just a partial recovery from a recent major nerf (e.g., Illusion strategies in 7.41b vs 7.41d).
* **Automated Fact-Checking:** Develop a validation layer that flags nonsensical LLM synergies against a deterministic mechanical rulebook.

---

# Phase 16 — Advanced Resilience & Data Sourcing

Status: Future

Goals:
* **Multi-Source Winrate Aggregation:** Integrate **OpenDota API** as a secondary source to fill Stratz data gaps.
* **Live Data Fallback:** Implement a "Live Period" fetcher that pulls current global hero stats to represent the most recent patch when explicit versioned snapshots are not yet available.
* **Version Aliasing:** Build an automated mapping table to "alias" minor sub-patches (e.g., 7.41c) to their parent versions (7.41) to ensure the UI is never empty.
* **Official API Exploration:** Investigate the feasibility of a lightweight "Match Scraper" using the official Valve Web API (`GetMatchHistory`) to calculate real-time winrates for the very latest revisions.

---

# Phase 17 — Cloud Infrastructure & Dynamic Hosting (The "Option B" Pivot)

---

# Definition of Success

A user should be able to open a patch page and understand the major impacts of the patch within a few minutes without reading the full official patch notes.
