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

The review queue is a critical component for maintaining system trustworthiness and expanding the ontology.

### Review Record Structure

```json
{
  "id": "rev_9921",
  "patch": "7.42",
  "rawNote": "Illusions now inherit the owner's attack speed penalty",
  "proposedClassification": "Nerf",
  "proposedTag": "ILLUSION_INTERACTION",
  "status": "Pending"
}
```

### Reviewer Workflow

1.  **Presentation:** The reviewer is shown the raw note, the hero/item context, and any LLM-proposed tags.
2.  **Action:**
    *   **Confirm:** Accept the proposed classification.
    *   **Edit:** Manually assign a different tag or polarity.
    *   **Discard:** Flag as non-gameplay/unimportant change.
3.  **Storage:** Once confirmed, the result is stored permanently. If a new pattern is identified, it is added to the **Semantic Ontology** to ensure future instances are handled as `KNOWN_SEMANTIC`.
