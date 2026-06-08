# ARCHITECTURE.md

## Purpose

This document describes the architecture of the Dota Patch Intelligence platform.

The goal of the project is to transform raw Dota 2 patch notes into structured, searchable, and understandable balance information for players.

---

# Core Problem

Official Dota patch notes provide detailed information but are difficult to consume due to their size and structure.

However, **quantitative counting of buffs and nerfs is insufficient** to understand a patch. A hero receiving a dozen minor numerical tweaks might be less impacted than a hero receiving one single, meta-defining mechanical change.

Players want answers to questions such as:
* Which heroes received *impactful* buffs or nerfs?
* How do changes affect specific game phases (Laning, Mid, Late)?
* What thematic gameplay systems were altered?
* How has the overall meta shifted regarding picks, lineups, and itemization?

This platform aims to answer those questions by combining deterministic structured parsing with deep, contextual AI impact analysis.

---

# Architectural Principles

## 1. Data First

The project is fundamentally a data processing platform.

The frontend exists to present processed data.

All business logic should live in backend services and shared packages.

---

## 2. Structured Data Over Raw Text

Raw patch notes should be converted into structured entities whenever possible.

Example:

Raw:

"Crystal Nova mana cost increased from 100 to 130."

Structured:

{
hero: "Crystal Maiden",
ability: "Crystal Nova",
classification: "nerf",
impactMagnitude: "low"
}

---

## 3. Explainable Analysis

Every classification should be traceable.

Users should be able to understand why a change was categorized as a buff, nerf, rework, or adjustment, and *why* its impact was scored a certain way.

---

## 4. AI for Contextual Impact Analysis

AI should not be used for basic string parsing where regex suffices.
AI **must** be used to evaluate the *contextual impact* of a change.
Rule-based logic handles the quantitative baseline (e.g., "Mana cost increased = Nerf"), while AI determines the qualitative weight (e.g., "Is this mana cost nerf actually significant for this hero's laning phase?").

---

# High-Level System Architecture

Patch Source
↓
Ingestion Layer
↓
Parsing Engine
↓
Quantitative Classification Engine
↓
Contextual Impact Engine (LLM)
↓
Meta Analysis Engine
↓
Database
↓
API
↓
Frontend

---

# Changes pipeline

Steam News → Discovery Layer → Valve JSON Datafeed API → ID Mapping Resolver → Structured Parser → Quantitative Classifications → Contextual Impact Scoring → Structured Changes

---

# Components

## Mappings Layer

Responsibilities:
* Fetch hero, ability, and item lists from Valve API.
* Build numerical ID to human-readable name mappings.
* Provide a consistent naming reference for the Parser.

## Frontend

Responsibilities:

* Display patch notes
* Display expandable lists of hero/item changes with UI markers for polarity (Buff/Nerf).
* Display qualitative impact details and phase-specific analysis.
* Display thematic patch summaries.
* Search and filtering
* Historical patch browsing

Technology:

* Next.js
* TypeScript
* CSS Modules (tentative)

---

## API

Responsibilities:

* Expose processed patch data
* Expose thematic summaries
* Expose hero/item endpoints
* Provide search capabilities

Technology:

* Node.js
* Fastify
* TypeScript

---

## Parser

Responsibilities:

* Convert raw patch notes into structured data
* Identify heroes
* Identify items
* Identify systems
* Extract numerical changes and metrics

---

## Quantitative Classification Engine

Responsibilities:

* Determine baseline buff/nerf/rework polarity based on metrics.
* Handle deterministic adjustments.

---

## Contextual Impact Engine (LLM)

Responsibilities:

* Ingest quantitatively classified changes.
* Evaluate the *magnitude* of the impact (e.g., Low, Medium, High, Meta-Defining).
* Determine game-phase relevance (Laning, Late Game).
* Generate expandable reasoning for the change's true weight in the current meta.

---

## Meta Analysis Engine

Responsibilities:

* Identify overarching, thematic balance trends.
* Generate high-level patch summaries.
* Detect systemic changes and infer meta shifts affecting lineups and itemization.

---

## Database

Responsibilities:

* Store patches
* Store parsed changes
* Store classifications
* Store generated summaries

Technology:

* PostgreSQL

---

# Future Considerations

Potential future additions:

* User accounts
* Saved hero tracking
* Patch comparisons
* Meta trend analytics
* AI-generated patch reviews
* Public API

---

# Status

Current Status: Draft v1.1
Last Updated: 2026-06-08
