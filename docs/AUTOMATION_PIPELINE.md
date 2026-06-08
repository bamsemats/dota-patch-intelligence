# Automation Pipeline

This document describes the design for the automated patch detection and processing pipeline.

**Note:** This is a future-phase component. Implementation should not begin until the core database, public deployment, and validation framework are operational.

## Pipeline Sequence

The pipeline executes a linear sequence of tasks triggered by a new patch discovery.

```
Steam News Poller
  ↓
Detect new patch version
  ↓
Fetch Valve data feed
  ↓
Run parser
  ↓
Run classification engine
  ↓
Run semantic ontology matching
  ↓
Route unknowns to human review queue
  ↓
Run balance ontology scoring
  ↓
Run meta simulation
  ↓
Run LLM narrative generation
  ↓
Store results to database
  ↓
Invalidate cache
  ↓
Notify external systems (Discord/Email)
  ↓
Publish
```

## Step Details

### 1. Steam News Poller
*   **Responsibility:** Periodically check the Steam News API for new Dota 2 announcements.
*   **Input:** AppID 570, News Feed.
*   **Output:** `patchVersion` string (e.g., "7.42").
*   **Fail-safe:** Log error; retry in 1 hour.

### 2. Valve Data Feed Fetcher
*   **Responsibility:** Fetch the high-fidelity structured JSON for the specific version.
*   **Input:** `patchVersion`.
*   **Output:** Raw JSON payload.
*   **Fail-safe:** Halt pipeline; notify administrator of potential API change.

### 3. Transformation & Extraction (Parser + Classification)
*   **Responsibility:** Convert raw JSON into structured facts and deterministic classifications.
*   **Input:** Raw JSON payload.
*   **Output:** `StructuredChange` entities.

### 4. Semantic & Strategic Scoring
*   **Responsibility:** Apply the **Semantic Ontology** and **Balance Ontology** to calculate net impact scores and feature vector deltas.
*   **Output:** Scored Change Groups and Hero Vector Deltas.

### 5. Meta Simulation & Narrative Generation
*   **Responsibility:** Run the draft-level simulation and use the LLM to generate readable summaries.
*   **Input:** Full set of scored changes.
*   **Output:** `MetaSummary`, `MetaShift`, and synthesized hero narratives.
*   **Fail-safe:** Use a "Basic Summary" template if the LLM call fails.

### 6. Storage & Distribution
*   **Responsibility:** Persist all layers to the database and trigger cache invalidation for the frontend.
*   **Fail-safe:** Use database transactions; rollback on failure to prevent partial patch ingestion.
