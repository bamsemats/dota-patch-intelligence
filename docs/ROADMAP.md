# ROADMAP.md

## Vision

Create the best platform for understanding Dota 2 balance changes and patch impacts.

---

# Phase 1 — Foundation

Status: Planned

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

Status: Planned

Goals:

* Identify reliable patch source
* Build ingestion pipeline
* Store raw patch data

Deliverables:

* Patch importer
* Raw patch storage
* Historical patch retrieval

Success Criteria:

* Able to ingest at least one patch automatically

---

# Phase 3 — Parsing Engine

Status: Planned

Goals:

* Parse heroes
* Parse items
* Parse systems
* Extract numerical changes

Deliverables:

* Structured patch representation

Success Criteria:

* Patch notes converted into machine-readable format

---

# Phase 4 — Classification Engine

Status: Planned

Goals:

* Detect buffs
* Detect nerfs
* Detect reworks
* Detect removals
* Generate confidence scores

Deliverables:

* Classification package

Success Criteria:

* Accurate classification of common patch changes

---

# Phase 5 — Meta Analysis

Status: Planned

Goals:

* Summarize patch impacts
* Detect broader balance trends
* Identify strategic implications

Deliverables:

* Meta summary generator

Success Criteria:

* Produce useful patch summaries automatically

---

# Phase 6 — Frontend MVP

Status: Planned

Goals:

* Patch browsing
* Patch summaries
* Hero changes
* Item changes
* Search and filtering

Deliverables:

* First public version

Success Criteria:

* Users can browse and understand patch changes more easily than through official notes

---

# Phase 7 — Historical Analytics

Status: Future

Potential Features:

* Hero balance history
* Item history
* Patch comparisons
* Long-term trend analysis

---

# Phase 8 — Advanced Features

Status: Future

Potential Features:

* User accounts
* Personalized hero tracking
* Email notifications
* Public API
* Community features

---

# Definition of Success

A user should be able to open a patch page and understand the major impacts of the patch within a few minutes without reading the full official patch notes.
