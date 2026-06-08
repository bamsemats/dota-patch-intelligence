# DATA_MODEL.md

## Purpose

This document defines the core domain entities used throughout the Dota Patch Intelligence platform.

The goal is to establish a consistent understanding of the data before database schemas, APIs, and frontend components are implemented.

This document describes business concepts, not database tables.

---

# API connectivity

To fetch Dota 2 patch notes programmatically, we use the official **Valve Datafeed API**:
*   **Patch Notes**: `https://www.dota2.com/datafeed/patchnotes?version={version}&language=english`
*   **Hero List**: `https://www.dota2.com/datafeed/herolist?language=english`
*   **Hero Details (Abilities/Talents)**: `https://www.dota2.com/datafeed/herodata?language=english&hero_id={id}`
*   **Item List**: `https://www.dota2.com/datafeed/itemlist?language=english`

---

# Example code

This is an example of how to fetch data content of the latest five (5) news items 
from the Steam Web API:

```typescript
// Define type safety for the Valve Steam News payload
interface SteamNewsItem {
  gid: string;
  title: string;
  url: string;
  is_external_url: boolean;
  author: string;
  contents: string; // The patch notes text (often contains BBCode/HTML)
  feedlabel: string;
  date: number;
  feedname: string;
  feed_type: number;
  appid: number;
}

interface SteamNewsResponse {
  appnews: {
    appid: number;
    newsitems: SteamNewsItem[];
    count: number;
  };
}

async function getDotaPatchNotes(count: number = 5): Promise<SteamNewsItem[]> {
  const appId = 570; // Dota 2 App ID
  const url = `https://steampowered.com${appId}&count=${count}&maxlength=5000&format=json`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    const data: SteamNewsResponse = await response.json();
    
    // Filter down to patches if necessary, or return the raw news list
    return data.appnews.newsitems;
  } catch (error) {
    console.error("Failed to fetch patch data:", error);
    return [];
  }
}

// Example Usage:
getDotaPatchNotes(3).then((patches) => {
  patches.forEach((patch) => {
    console.log(`[${new Date(patch.date * 1000).toLocaleDateString()}] ${patch.title}`);
    console.log(`Link: ${patch.url}\n`);
  });
});

```

---

# Core Domain Model

Patch  
├── Sections  
├── Changes  
├── Meta Summary  
└── Analysis Results  

---

# Patch

Represents a single Dota 2 patch release.

Example:

* 7.39
* 7.38b
* 7.37d

Fields:

* id
* patchNumber
* title
* releaseDate
* sourceUrl
* rawContent
* createdAt
* updatedAt

Example:

{  
"patchNumber": "7.39",  
"patchVersion": {  
"major": 7,  
"minor": 39,  
"revision": null  
}  
}

---

# PatchSection

Represents a logical section within a patch.

Examples:

* Heroes
* Items
* Neutral Items
* Economy
* Map
* General Updates

Fields:

* id
* patchId
* title
* orderIndex

Example:

{
"title": "Heroes"
}

--- 

# PatchVersion

Represents a normalized version of a patch number.

Purpose:

Patch identifiers cannot reliably be sorted using string comparison.

Example:

7.37
7.37a
7.37b
7.38
7.38a

Lexicographic ordering produces incorrect results.

PatchVersion provides a normalized representation for ordering and comparison.

Fields:

- major
- minor
- revision

Examples:

7.37
{
"major": 7,
"minor": 37,
"revision": null
}

7.37d
{
"major": 7,
"minor": 37,
"revision": "d"
}

Comparison Rules:

7.37
<
7.37a
<
7.37b
<
7.37d
<
7.38

---

# Change

Represents a single balance or gameplay change.

This is the most important entity in the system.

Fields:

- id
- patchVersion
- category ("hero" | "item" | "neutral" | "general")
- entityName (e.g., "Crystal Maiden")
- subEntityName (e.g., "Crystal Nova")
- rawNote (Original string)
- indentLevel (Preserves hierarchy)
- metric (e.g., "Mana Cost", "Base Damage")
- changeType ("INCREASE" | "DECREASE" | "RESCALE" | "REWORK" | "ADDITION" | "REMOVAL" | "ADJUSTMENT")
- oldValue (e.g., "100")
- newValue (e.g., "130")
- metadata (entityId, subEntityId)

Example:

{
  "category": "hero",
  "entityName": "Anti-Mage",
  "subEntityName": "Blink",
  "metric": "Mana Cost",
  "changeType": "DECREASE",
  "oldValue": "65",
  "newValue": "60"
}

---

# Classification

Represents the system's interpretation of a change.

A single change may generate multiple classifications.

Example:

Raw Change:

"Mana cost increased from 100 to 130."

Classifications:

* Nerf
* Resource Cost Increase

Fields:

* id
* changeId
* classificationType
* confidenceScore
* reasoning
* impactMagnitude ("Low" | "Medium" | "High" | "Meta-Defining")
* impactedPhases (e.g., ["Laning", "Mid Game"])


Classification is the authoritative source of truth for all
interpretation of a change, combining quantitative polarity (Buff/Nerf) with contextual impact scoring.

A single Change may generate multiple Classifications.

Examples:

Change:

Mana cost increased.

Classifications:

- Nerf
- Resource Cost Increase
- impactMagnitude: "Medium"
- impactedPhases: ["Laning"]

---

# PatchSource

Represents where patch data originates.

Types:

- SteamNews (Discovery layer)
- ValveDatafeed (Canonical structured source)

Fields:

- type
- url
- reliabilityScore

---

# PatchCanonicalDocument

Represents the official structured patch page from dota2.com.

Fields:

- version
- url
- htmlContent
- sections
- fetchedAt

---

# Hero

Represents a Dota hero.

Fields:

* id
* heroName
* internalName
* primaryAttribute

Example:

{
"heroName": "Crystal Maiden"
}

---

# Ability

Represents a hero ability.

Fields:

* id
* heroId
* abilityName

Example:

{
"abilityName": "Crystal Nova"
}

---

# Item

Represents a Dota item.

Fields:

* id
* itemName
* itemCategory

Examples:

* Black King Bar
* Blink Dagger
* Pipe of Insight

---

# GameSystem

Represents non-hero and non-item gameplay systems.

Examples:

* Economy
* Experience
* Map
* Roshan
* Tormentor
* Neutral Creeps
* Outposts

Fields:

* id
* systemName
* category

---

# Talent

Represents a hero talent.

Talents are distinct from abilities and frequently receive
independent balance changes.

Fields:

- id
- heroId
- level
- talentName

Examples:

+200 Health

+25 Movement Speed

---

# ChangeGroup

Represents a collection of related changes that should be
interpreted together.

Purpose:

Many hero reworks consist of numerous individual changes
which are only meaningful as a group.

Examples:

- Hero Rework
- Facet Rework
- Talent Tree Rework
- Item Redesign

Fields:

- id
- patchId
- title
- description
- groupType

Group Types:

- Rework
- Major Buff Package
- Major Nerf Package
- Feature Introduction
- Feature Removal

Example:

{  
"title": "Tinker Rework",  
"groupType": "Rework"  
}

---

# MetaSummary

Represents a high-level interpretation of a patch.

Examples:

* Teamfight compositions weakened
* Magic damage reduced overall
* Laning phase slowed down

Fields:

* id
* patchId
* summaryType
* title
* description
* confidenceScore

Example:

{  
"title": "Magic Damage Weakened"  
}

---

# ImpactCategory

Represents strategic categories affected by changes.

Examples:

* Laning
* Farming
* Team Fighting
* Mobility
* Survivability
* Magic Damage
* Physical Damage
* Crowd Control

Fields:

* id
* categoryName

---

# MetaShift

Represents a broader gameplay trend inferred from multiple changes.

Examples:

* Tank Meta Strengthened
* Greedier Drafts Encouraged
* Faster Games Expected

Fields:

* id
* patchId
* title
* description
* confidenceScore
* supportingChanges

---

# AnalysisResult

Represents generated analysis content.

Examples:

* Hero summary
* Item summary
* Patch summary
* Meta summary

Fields:

* id
* patchId
* analysisType
* content
* generatedAt

---

# Classification Types

Current supported values:

* Buff
* Nerf
* Rework
* Adjustment
* New
* Removed

Future additions may include:

* Indirect Buff
* Indirect Nerf
* Bug Fix
* Quality Of Life

---

# Target Types

Current supported values:

* Hero
* Ability
* Item
* Talent
* Neutral Item
* Economy
* Map
* Roshan
* Tormentor
* General System

---

# Confidence Scores

Confidence scoring is a first-class concept in the Dota Patch Intelligence platform. A confidence score must be attached to every classification, meta summary, and meta shift.

## Confidence Levels

| Level | Range | Meaning | Display Treatment |
|---|---|---|---|
| **Certain** | 0.95–1.00 | Deterministic rule match (e.g. Numeric) | No qualifier |
| **High** | 0.80–0.94 | Strong signal, minor ambiguity | "Likely" |
| **Moderate** | 0.60–0.79 | Reasonable inference | "Probably" |
| **Low** | 0.40–0.59 | Speculative / Heuristic | "Possibly" |
| **Insufficient** | 0.00–0.39 | Unreliable | Flag for review; do not display |

---

# Data Integrity Principles

## Fact vs. Inference Separation

To maintain system trustworthiness, facts (what changed) and inferences (what it means) are stored separately and never allowed to overwrite one another.

### Pipeline Layers

The system follows a strict hierarchical layer model. No layer may modify or replace data from a layer above it.

1.  **Patch Data:** Raw ingested content from Valve (Source of Truth).
2.  **Structured Facts:** Parsed, deterministic data (Entities, Metrics, Values).
3.  **Classifications:** Buff/Nerf/Rework labels with confidence scores.
4.  **Interpretations:** Contextual meaning (e.g., "This hurts laning sustain").
5.  **Meta Conclusions:** Patch-level reasoning and trend analysis.

# Raw Note Archive

The Raw Note Archive is a permanent repository of every original patch note string ingested by the system.

## Purpose

By storing raw strings alongside their structured counterparts, the system enables:
*   **Semantic Search:** Finding all historical changes related to a specific keyword or phrase.
*   **Retrospective Classification:** Re-running the parser or LLM logic on old data as the system's intelligence improves.
*   **Auditability:** Allowing users to see the exact original text that led to a specific interpretation.

## Data Structure: RawNoteRecord

```json
{
  "hero": "Anti-Mage",
  "ability": "Mana Void",
  "patch": "7.42",
  "rawNote": "Now pierces spell immunity",
  "classificationState": "KNOWN_SEMANTIC",
  "semanticTag": "SPELL_IMMUNITY_INTERACTION"
}
```

## Example Queries Enabled
*   "Show every time Valve modified spell immunity interactions."
*   "Show every hero that gained BKB-piercing effects in the last year."
*   "Find all historical changes similar to [provided note text]."
*   "Show all changes classified as UNKNOWN across the last 10 patches."

---

# Future Data Opportunities

Potential future entities:

* Match Statistics
* Hero Win Rates
* Hero Pick Rates
* Professional Match Data
* User Accounts
* User Hero Tracking
* Patch Comparisons

These are intentionally excluded from the initial MVP.

---

# Current Scope

MVP Scope:

Patch
PatchVersion
PatchSection
Change
ChangeGroup
Classification
Hero
Ability
Talent
Item
GameSystem
MetaSummary
MetaShift

Everything else is considered future expansion.
