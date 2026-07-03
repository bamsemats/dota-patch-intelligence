# Dota 2 Patch Intelligence

**Advanced contextual analytics for Dota 2 patch notes.**

Dota 2 Patch Intelligence is a high-fidelity data pipeline and visualization platform that transforms raw Dota 2 patch notes into machine-readable insights. It goes beyond simple quantitative changes to provide **Contextual Impact Analysis**, identifying synergistic meta shifts and evaluating how balance tweaks actually affect the competitive landscape.

---

## 🚀 Key Features

*   **Synergistic Meta Analysis:** Multi-LLM hybrid engine (Gemini 2.5 Flash) that identifies how systemic changes (economy, map) synergize with hero buffs to shift the meta.
*   **Net Balance Trajectory:** Tracks the cumulative power shifts of heroes across 7 strategic dimensions (Farming, Mobility, Teamfight, etc.) since patch 7.33, formatted to prevent floating-point drift.
*   **Item-Hero Affinity Mapping:** Propagates 20% of direct item vector shifts as secondary ripples to associated heroes' feature vectors, modeling indirect item buffs/nerfs.
*   **Human Classification Overrides:** Dedicated override registry (`manual_overrides.json`) allowing manual human review and polarity correction for complex notes.
*   **Empirical Truth Scores & Safe Tuning**: A built-in validation layer that compares AI predictions against actual post-patch winrate shifts, backed by an automated safe regression gate that rejects calibrations that degrade prediction accuracy.
*   **Global Hero & Item Rosters:** Dedicated, searchable directories (`/heroes`, `/items`) with stylish backgrounds and cumulative balance trajectories.
*   **Temporal Intelligence:** The analysis engine considers previous patch states to determine if current changes are amplifying or correcting recent meta trends.
*   **Zero-Touch Automation:** A fully automated CI/CD pipeline that detects new patches, processes them, and deploys updates to the web without manual intervention.

---

## 🏗️ Architecture (v2.6)

The system uses a **Static-to-Dynamic Hybrid** architecture, combining the power of a relational database with the cost-efficiency of static hosting.

1.  **Ingestion Layer:** Discovers patches via Valve's official JSON datafeed and OpenDota SQL Explorer, grounded in Git-tracked classified patch files to prevent duplicate runs.
2.  **Intelligence Engine:** A tiered classification pipeline (Deterministic -> Semantic -> Overrides -> AI) that models balance changes into structured facts with **Partial Confidence** tagging.
3.  **Modeling Layer:** Calculates 7-dimensional **Hero Feature Vectors** (including **Item Affinity Ripples**), aggregates **Cumulative Balance Histories**, and tracks **Ontology Versions**.
4.  **Meta Analysis Layer:** A **Split-Prompt** LLM architecture that synthesizes high-level themes with **Temporal Context** and **Mechanical Grounding**.
5.  **Validation Layer:** A **Surgical Fact-Checker** that audits LLM outputs and calculates **Empirical Truth Scores** against post-patch winrate deltas, with bracket-specific auditing options.
6.  **Autopilot Calibration Gate:** An automated safety regression loop that tests weight calibrations against historical patch sets and blocks calibrations that lower predictive accuracy.
7.  **Frontend:** A **Next.js** application optimized for **Static Site Generation (SSG)** with local-file failbacks for CI/CD robustness.

---

## 🛠️ Data Pipeline & CLI

The project operates as a multi-stage CLI-driven pipeline:

### Core Pipeline
For a step-by-step guide on how to process a new patch, see [Manual Patch Workflow](docs/MANUAL_PATCH_WORKFLOW.md).

1.  **Automation:** `npm run patch:auto -- <version>` — Triggers the unified orchestrator script.
2.  **Discovery:** `npm run patch:discovery` — Fetches raw data from Valve.
3.  **Parsing:** `npm run patch:parse` — Decomposes raw notes into structured facts with `originalSource` preservation.
4.  **Classification:** `npm run patch:classify` — Assigns polarity and confidence (System Estimates) and applies human overrides.
5.  **Intelligence:** `npm run patch:meta -- <version>` — Generates high-fidelity strategic summaries.
6.  **Audit:** `npm run patch:audit [--bracket=Divine]` — Calculates Empirical Truth Scores based on winrate deltas (supports duplicate patch comparisons bypass and ranking brackets selection).
7.  **Safe Calibrate:** `npm run patch:calibrate-safe` — Executes the auto-tuner and regression checks metrics weights.

### Database & Serving
8.  **Seed Database:** `npm run db:seed` — Syncs all JSON intelligence into the local PostgreSQL database.
9.  **Backup DB:** `npm run db:backup` — Creates a Docker-aware SQL dump.
10. **Start API:** `npm run dev --prefix apps/api` — Starts the Fastify server.
11. **Start UI:** `npm run dev --prefix apps/frontend` — Starts the Next.js dev server.

---

## 💻 Tech Stack

*   **Frontend:** Next.js (Static Export), TypeScript, Vanilla CSS (CSS Modules).
*   **API:** Fastify, Prisma ORM, PostgreSQL (via Docker).
*   **Intelligence:** Google Gen AI (Gemini 2.5), Valve Datafeed, OpenDota SQL.
*   **Deployment:** GitHub Actions, GitHub Pages.

---

## 📊 Data Flow

```mermaid
graph TD
    subgraph "Data Acquisition"
        A[Steam News] --> B[Valve JSON Datafeed]
        B --> C[ID Mapping Resolver]
        D1[OpenDota SQL] --> W[Winrate Snapshots]
        D2[OpenDota REST] --> W
    end

    subgraph "Intelligence Engine"
        C --> D[Structured Parser]
        D --> E[Tiered Classification]
        E --> F[Balance Ontology Weighting]
        F --> G[Hero Feature Vectors]
    end

    subgraph "Historical Layer"
        G --> H[Cumulative Hero Trajectories]
        W --> H
        H --> I[Prisma / PostgreSQL]
    end

    subgraph "Strategic Analysis"
        I --> J[Meta Analysis Engine]
        J --> K[Gemini 2.5]
        K --> L[Context-Aware Meta Reports]
    end

    subgraph "Frontend Presentation"
        L --> M[Next.js Static Generation]
        M --> N[Patch Intelligence Landing]
        M --> O[Hero Balance Archives]
        M --> P[Global Semantic Search]
    end
```

---

## 🗺️ Roadmap Status

- **Phases 1-13**: [COMPLETE] Foundation, Ingestion, Parsing, Vectors, Winrates, UI/UX, Local DB & API.
- **Phase 14**: [COMPLETE] Historical Backfill (Gemini 2.5 Truth-Grounded Re-run).
- **Phase 15**: [COMPLETE] Cross-Patch Trend Validation & Temporal Intelligence.
- **Phase 16**: [COMPLETE] Stratz Exit & OpenDota Migration.
- **Phase 18**: [COMPLETE] Mechanical Truth-Grounded Intelligence (Surgical Fact-Checking & Prompt Splitting).
- **Phase 19**: [COMPLETE] Empirical Meta Validation & Algorithm Tuning (Truth Scores).
- **Phase 20**: [COMPLETE] Zero-Touch Automation & CI/CD Pipeline.
- **Phase 17**: [FUTURE] Advanced Resilience & Data Sourcing.

---

## ⚖️ License
ISC License
