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

Status: In Progress

Goals:

* Patch browsing
* Expandable lists of 'buffed heroes' and 'nerfed items' with quantitative UI markers (green/red) and qualitative impact details.
* Display thematic patch outlines and meta shifts.
* Display Synergistic Winners and Losers.
* Search and filtering

Deliverables:

* First public version

Success Criteria:

* Users can browse and immediately grasp both the literal changes and their contextual impact on the game.

Future Improvements for Phase 6:
* Expand Synergistic Winners and Losers to explicitly cover specific roles (e.g., top 3 winners/losers for each of the 5 roles).

---

# Phase 7 — CI/CD & Initial Deployment

Status: Planned

Goals:
* Develop a CI/CD pipeline using GitHub Actions to automate testing and builds.
* Deploy the Frontend MVP to GitHub Pages as the initial hosting platform.

Deliverables:
* GitHub Actions workflow configurations.
* Live, publicly accessible web application.

---

# Phase 8 — Backend API & Database Migration

Status: Future

Goals:
* Transition the data architecture from local static JSON files (`research-output`) to a relational PostgreSQL database.
* Develop a robust backend API (Node.js/Fastify) to serve patch data dynamically to the frontend.
* Establish data models and schemas using an ORM (e.g., Prisma or Drizzle).

Deliverables:
* Database schema implementation.
* Deployed REST/GraphQL API.

---

# Phase 9 — Historical Analytics

Status: Future

Potential Features:

* Hero balance history and trajectory
* Item history
* Patch comparisons
* Long-term thematic trend analysis

---

# Phase 10 — Automation Pipeline

Status: Future

Goals:
* Automated patch detection system (Steam polling/webhooks)
* Trigger full ingestion pipeline (discover → map → parse → classify → impact score → database insertion)
* Automated notifications (e.g., Discord, Email) when a new patch is processed

Deliverables:
* Scheduled cron job or webhook listener
* End-to-end automation script

---

# Phase 11 — Advanced Features

Status: Future

Potential Features:

* User accounts
* Personalized hero tracking
* Public API
* Community features

---

# Definition of Success

A user should be able to open a patch page and understand the major impacts of the patch within a few minutes without reading the full official patch notes.
