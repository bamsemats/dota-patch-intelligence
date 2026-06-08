# Validation Framework

This document describes the formal evaluation framework for assessing the quality and accuracy of the Dota Patch Intelligence system's outputs.

## Classification Accuracy

The system's ability to correctly classify individual changes (Buff, Nerf, Rework, etc.) is the foundation of its reliability.

### Gold-Standard Dataset

A "gold-standard dataset" is a curated collection of historical patch changes that have been manually reviewed and verified by high-level players or domain experts. This dataset serves as the ground truth for evaluation.

**Ground-Truth Record Structure:**

```json
{
  "patch": "7.41d",
  "change": "Mana Cost decreased from 65 to 60",
  "expectedClassification": "Buff",
  "expectedMetric": "Mana Cost",
  "expectedChangeType": "DECREASED",
  "expectedMagnitude": "Low"
}
```

### Maintenance

*   **Building the Dataset:** On every major patch, a sample of changes from each category (Hero, Item, General) and state (Numeric, Semantic) should be added to the gold-standard dataset.
*   **Expert Review:** High-MMR players should periodicially review a random sample of the system's classifications to identify misclassifications and update the ground truth.

### Evaluation Metrics

The following metrics are tracked per classification type and across the entire system:

*   **Precision:** Of all changes the system classified as "Buff", how many were actually "Buffs"?
*   **Recall:** Of all actual "Buffs" in the patch, how many did the system correctly identify?
*   **F1 Score:** The harmonic mean of Precision and Recall, providing a balanced measure of accuracy.

### Performance Thresholds

A classification engine version is considered "Production-Ready" only if it meets the following minimum thresholds:

| Metric | Minimum Threshold |
|---|---|
| Overall Precision | 90% |
| Overall Recall | 85% |
| Numeric Precision | 98% |
| Semantic Precision (Known) | 92% |

## Meta Analysis Quality

Meta analysis involves qualitative synthesis and is harder to measure than discrete classification.

### Human Review Approach

Meta summaries are evaluated through periodic "Blind Reviews" where experts score generated summaries without knowing which engine version produced them.

### Scoring Rubric (1–5)

| Score | Criteria |
|---|---|
| 5 - Excellent | Identifies all major synergistic shifts; logic is sound; reasoning is strategic (e.g. mentions game phase impact). |
| 4 - Good | Correctly identifies major trends; reasoning is clear but lacks deep strategic nuances. |
| 3 - Fair | Captures the literal "Winners and Losers" but misses the deeper "Why" or synergistic effects. |
| 2 - Poor | Contains logical inconsistencies or fails to identify a major systemic shift (e.g. ignored a gold change). |
| 1 - Failure | Factually incorrect; hallucinates changes; reasoning is non-strategic or nonsensical. |

### Expert Reference Samples

A collection of "Perfect Analyses" (scored 5) should be maintained as a reference for both human reviewers and for potential future few-shot prompting or fine-tuning.

## Ongoing Evaluation

### Schedule

*   **Per-Patch Validation:** A subset of the gold-standard dataset relevant to similar mechanics should be run against every new patch ingestion.
*   **Engine Updates:** Any change to the parser regex, ontology rules, or LLM prompts must trigger a full run of the validation suite.

### Recording Results

Validation results must be recorded in a `research-output/validation-logs/` directory, timestamped and linked to specific engine versions. This allows for tracking improvement or regression over time.
