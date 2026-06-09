# Change Classification Architecture

This document describes the layered classification system used to interpret Dota 2 patch changes. The system ensures deterministic accuracy for known patterns while providing a robust mechanism for handling new or ambiguous changes.

## Change States

Every parsed change exists in one of four states, determining its path through the pipeline.

### State 1: NUMERIC

*   **Description:** Applies to changes with a clear, parsable old value and new value.
*   **Detection:** Regex-based identification of numeric deltas (e.g., "decreased from X to Y").
*   **Handling:** Fully structured and deterministic. No LLM involvement.
*   **Data Structure:**
    ```json
    {
      "state": "NUMERIC",
      "metric": "Mana Cost",
      "oldValue": "100",
      "newValue": "80",
      "polarity": "Buff"
    }
    ```
*   **Next Step:** Immediate storage and metadata aggregation.

### State 2: KNOWN_SEMANTIC

*   **Description:** Applies to non-numerical changes that match a pattern in the **Semantic Ontology**.
*   **Detection:** Exact or fuzzy string matching against defined ontology patterns.
*   **Handling:** Classified automatically using rule matching. No LLM involvement.
*   **Data Structure:**
    ```json
    {
      "state": "KNOWN_SEMANTIC",
      "semanticTag": "SPELL_IMMUNITY_INTERACTION",
      "rawNote": "Now pierces spell immunity",
      "polarity": "Buff"
    }
    ```
*   **Next Step:** Immediate storage; high confidence scoring (Certain/High).

### State 3: PARTIALLY_CLASSIFIED

*   **Description:** Changes that resemble known categories but contain ambiguity or minor variations.
*   **Detection:** Heuristic matching with low confidence scores.
*   **Handling:** An LLM may be used to propose a resolution.
*   **Data Structure:**
    ```json
    {
      "state": "PARTIALLY_CLASSIFIED",
      "proposedTag": "DISPEL_INTERACTION",
      "confidence": 0.65,
      "flaggedForReview": true
    }
    ```
*   **Next Step:** Routed to the Human Review Queue for confirmation.

### State 4: UNKNOWN

*   **Description:** Applies to changes the parser cannot recognize or classify.
*   **Detection:** Fallback state when all other matching fails.
*   **Handling:** Must be routed to the human review queue. An LLM may assist in proposing a classification, but human confirmation is mandatory.
*   **Next Step:** Permanent storage in the ontology once classified by a human.

## Human Review Queue

The review queue is a critical component for maintaining system trustworthiness and expanding the ontology. When changes fall into the `UNKNOWN` state, they must be processed to teach the system new semantic patterns.

### Interactive Review Tool

The project includes a CLI-based Interactive Review Tool to clear the backlog of `UNKNOWN` changes.

**How to Run:**
```bash
npm run patch:review
```

### Reviewer Workflow

1.  **Deduplication:** The tool automatically scans all processed patches and deduplicates identical `UNKNOWN` strings (e.g., if "now provides an aura" appears 10 times, you only review it once).
2.  **Presentation:** The tool displays the patch version, entity context (Hero/Item), and the highlighted raw string.
3.  **Actions:** You will be prompted to take one of four actions:
    *   `[m] Map to existing tag:` Displays a list of all current Semantic Ontology tags. You select the appropriate number and input the generic phrase to match (e.g., "now provides an aura"). This appends the new phrase to the existing tag.
    *   `[c] Create new tag:` Prompts you to define a brand new tag (e.g., `AURA_INTERACTION`), the matching phrase, the affected impact areas, and its default strategic weight (1-10).
    *   `[s] Skip:` Bypasses the change. Used for minor bug fixes or tooltip changes that have no strategic weight.
    *   `[q] Quit:` Saves progress and exits the tool.
4.  **Auto-Save & Re-Classification:** Upon making a choice, `research-output/ontology/semantic_tags.json` is updated immediately. After finishing a review session, you **must run** `npm run patch:classify` to re-process the historical data using your newly added rules.
