# DATA_MODEL.md

## Purpose

This document defines the core domain entities used throughout the Dota Patch Intelligence platform.

The goal is to establish a consistent understanding of the data before database schemas, APIs, and frontend components are implemented.

This document describes business concepts, not database tables.

---

# API connectivity

To fetch Dota 2 patch notes programmatically, we can use the *Steam Web API*'s **GetNewsForApp** endpoint or third-party platforms like the OpenDota API. 
Valve publishes official updates and changelogs directly to their news feed.

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
  const url = `https://steampowered.com{appId}&count=${count}&maxlength=5000&format=json`;

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
"releaseDate": "2026-01-01"
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

# Change

Represents a single balance or gameplay change.

This is the most important entity in the system.

Examples:

* Crystal Nova mana cost increased
* Black King Bar cooldown reduced
* Roshan now drops an additional item

Fields:

* id
* patchId
* sectionId
* targetType
* targetId
* rawText
* normalizedText
* changeType
* confidenceScore

Example:

{
"targetType": "Hero",
"changeType": "Nerf"
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
* Facet
* Neutral Item
* Economy
* Map
* Roshan
* Tormentor
* General System

---

# Confidence Scores

All AI-assisted classifications should include confidence values.

Range:

0.00 - 1.00

Examples:

1.00 = Deterministic rule match

0.95 = Very likely

0.75 = Moderate confidence

0.50 = Uncertain

Values below 0.50 should generally be reviewed.

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
PatchSection
Change
Classification
Hero
Ability
Item
GameSystem
MetaSummary
MetaShift

Everything else is considered future expansion.
