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

# Open Decisions

The following decisions remain unresolved:

* Patch data source
* Hosting platform
* Authentication requirements
* AI provider
* Search implementation
* Caching strategy
* Deployment architecture

---

# Decision Guidelines

Before accepting a new decision:

1. Identify the problem.
2. Consider alternatives.
3. Document trade-offs.
4. Record the final rationale.

This document should be updated whenever a significant architectural decision is made.
