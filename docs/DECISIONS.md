# DECISIONS.md

This document records important architectural and technical decisions made throughout the project.

---

# Template

Date:
Status:
Decision:
Reasoning:
Alternatives Considered:

---

# 2026-06-07

Status:
Accepted

Decision:
Use a monorepo structure.

Reasoning:
Frontend, API, parser, classifier, and shared types are closely related and benefit from being developed together.

Alternatives Considered:

* Multiple repositories

---

# 2026-06-07

Status:
Accepted

Decision:
Use TypeScript across the project.

Reasoning:
Provides type safety, shared models, and consistency between frontend and backend.

Alternatives Considered:

* JavaScript
* Mixed TypeScript/Python architecture

---

# 2026-06-07

Status:
Accepted

Decision:
Use PostgreSQL as primary database.

Reasoning:
Patch data is highly relational and benefits from structured querying.

Alternatives Considered:

* MongoDB
* SQLite

---

# 2026-06-07

Status:
Accepted

Decision:
Use AI as a supporting analysis layer rather than the primary source of classification.

Reasoning:
Rule-based logic is more predictable and explainable.

AI should augment classification where deterministic logic is insufficient.

Alternatives Considered:

* Fully AI-driven classification

---

# 2026-06-08

Status:
Accepted

Decision:
Classification is owned by the Classification entity.

Reasoning:
A single change may generate multiple interpretations.

The Change entity stores only a denormalized primaryClassification
for convenience.

Classification remains the source of truth.

---

# 2026-06-08

Status:
Accepted

Decision:
Introduce ChangeGroup as a first-class domain entity.

Reasoning:
Many balance updates are only meaningful when interpreted
collectively.

Grouping improves analysis, display, and future meta reasoning.

---

# 2026-06-08

Status:
Accepted

Decision:
Pivot from HTML scraping to using Valve's official JSON Datafeed API for patch notes, and implement deep structured decomposition for the Change entity.

Reasoning:
Valve provides a highly structured, undocumented JSON datafeed API (`/datafeed/patchnotes`, `/datafeed/herodata`, etc.) which completely eliminates the fragility and complexity of DOM scraping. This allows the parser to focus on ID resolution (mapping `ability_id` to ability names) and regex-based string decomposition (extracting metrics, change types, and old/new values from notes) to create a highly structured dataset suitable for programmatic meta-analysis.

Alternatives Considered:
* Continuing with HTML DOM scraping (rejected due to fragility and lack of explicit entity IDs).

---

# 2026-06-08

Status:
Accepted

Decision:
Use a "Single-Prompt Synergistic" approach for LLM Meta Analysis rather than per-hero batching.

Reasoning:
1. **API Rate Limiting:** The free tier of the Gemini API (and most LLMs) has strict quotas (e.g., 5 RPM, 20 RPD). Sending 127 individual hero requests per patch halts development and production automation.
2. **Relational Synergy:** Evaluating heroes in isolation completely misses the core philosophy of Contextual Impact Analysis. A hero buff combined with an economy/jungle buff creates an exponential synergy that an LLM cannot detect if it doesn't see both changes simultaneously. 
By sending the entire simplified JSON structure of a patch (Systemic + Items + Heroes) in a single request, we use only 1 API call per patch and leverage the 1M+ token context window to allow the LLM to find these relational synergies.

Alternatives Considered:
* Per-hero LLM scoring (rejected due to API quotas and context blindness).

# 2026-06-08

Status:
Accepted

Decision:
Use Vanilla CSS / CSS Modules for frontend styling; DO NOT use Tailwind CSS.

Reasoning:
The user explicitly mandated the use of standard `.css` files over utility-first frameworks like Tailwind. This encourages a clean separation of concerns, semantic class names, and allows for the easy integration of a specific, Dota 2-inspired color palette (e.g., Epic `#B812F9`, Common `#2BAB01`).

Alternatives Considered:
* Tailwind CSS (Explicitly rejected by user).

# 2026-06-08

Status:
Accepted

Decision:
LLMs function exclusively as the final narrative and synthesis layer; they are not the primary source of truth for classification or reasoning.

Permitted Use Cases:
*   Generating human-readable patch summaries from pre-computed structured data.
*   Synthesizing hero and meta narratives from calculated feature vector deltas.
*   Proposing classifications for `UNKNOWN` semantic changes (human confirmation required).
*   Generating editorial content and thematic patch reports.

Prohibited Use Cases:
*   Deterministic numeric classification (must use parser rules).
*   Known semantic classification (must use the Semantic Ontology).
*   Modifying or overriding stored structured facts.
*   Performing high-scale analysis without pre-computed structured inputs.

Reasoning:
The structured balance knowledge graph (Ontologies + Feature Vectors) is the core asset of the platform. LLMs should be treated as "Prose Generators" that receive pre-processed facts and produce readable summaries. This ensures maximum consistency, auditability, and cost-efficiency. Running reasoning through generative inference is too speculative and expensive for a core data pipeline.

---

# 2026-06-12

Status:
Accepted

Decision:
Enforce "Mechanical Fidelity" and "Temporal Context" in Meta Analysis.

Reasoning:
To prevent LLM hallucinations (e.g., suggesting nonsensical item builds or procs), the analyzer must be restricted by a "Professional Coach" framework. Furthermore, to provide true intelligence, it must assess changes *relative* to the recent patch history, acknowledging when a buff is merely a correction for a recent nerf.

# 2026-06-11

Status:
Accepted

Decision:
Pivot to a "Static-to-Dynamic" Hybrid Architecture.

Reasoning:
To maintain the cost-efficiency of GitHub Pages while leveraging the power of a relational database, the system will use a local PostgreSQL/Prisma/Fastify stack during development and build-time. The Next.js frontend will fetch all required data from the local API during the `npm run build` process to generate a fully static, optimized distribution.

Alternatives Considered:
*   Fully dynamic SSR (too expensive for early-stage hosting).
*   Pure flat-file architecture (lacks querying power and data integrity).

# 2026-06-12

Status:
Accepted

Decision:
Enforce "Mechanical Fidelity" and "Temporal Context" in Meta Analysis.

Reasoning:
To prevent LLM hallucinations (e.g., suggesting nonsensical item builds or procs), the analyzer must be restricted by a "Professional Coach" framework. Furthermore, to provide true intelligence, it must assess changes *relative* to the recent patch history, acknowledging when a buff is merely a correction for a recent nerf.

# 2026-06-11

Status:
Accepted

Decision:
Implement a "Dual-Write" strategy for long-running backfills.

Reasoning:
Historical analysis results must be saved to both the `research-output/` file system (as a permanent, portable archive) and the `MetaAnalysis` database table (for immediate frontend consumption). This ensures data durability and immediate feature availability.

---

# Open Decisions

The following decisions remain unresolved:

* Hosting platform for the "Option B" pivot (Cloud Database).
* Authentication requirements (if user accounts are added in Phase 16).
* AI provider selection for production (currently testing with Gemini-2.5-Flash).
* Caching strategy for live cloud API.

---

# Decision Guidelines

Before accepting a new decision:

1. Identify the problem.
2. Consider alternatives.
3. Document trade-offs.
4. Record the final rationale.

This document should be updated whenever a significant architectural decision is made.
