# ARCHITECTURE.md

## Purpose

This document describes the architecture of the Dota Patch Intelligence platform.

The goal of the project is to transform raw Dota 2 patch notes into structured, searchable, and understandable balance information for players.

---

# Core Problem

Official Dota patch notes provide detailed information but are difficult to consume due to their size and structure.

Players often want answers to questions such as:

* Which heroes were buffed?
* Which heroes were nerfed?
* Which items changed significantly?
* What systems were affected?
* How has the overall meta shifted?

This platform aims to answer those questions automatically.

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
classification: "nerf"
}

---

## 3. Explainable Analysis

Every classification should be traceable.

Users should be able to understand why a change was categorized as a buff, nerf, rework, or adjustment.

---

## 4. AI as an Enhancement Layer

AI should assist with classification and summarization.

AI should not be the sole source of truth.

Rule-based logic should be preferred where possible.

---

# High-Level System Architecture

Patch Source
↓
Ingestion Layer
↓
Parsing Engine
↓
Classification Engine
↓
Meta Analysis Engine
↓
Database
↓
API
↓
Frontend

---

# Components

## Frontend

Responsibilities:

* Display patch notes
* Display summaries
* Display hero/item changes
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
* Expose summaries
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
* Extract numerical changes

---

## Classification Engine

Responsibilities:

* Determine buff/nerf/rework status
* Assign confidence scores
* Explain classifications

---

## Meta Analysis Engine

Responsibilities:

* Identify overarching balance trends
* Generate patch summaries
* Detect systemic changes
* Infer potential meta shifts

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

Current Status: Draft v1
Last Updated: YYYY-MM-DD
