# Phase 18: Mechanical Truth-Grounded Intelligence

## Overview
To eliminate LLM hallucinations (e.g., "Morphling Intelligence form") and hyperbolic claims, we are implementing a rigorous validation and grounding layer. This ensures that the strategically intuitive insights of Gemini 2.5 Flash are bound by the deterministic reality of Dota 2's game mechanics.

## 1. Grounding via Context Injection (RAG-lite)
Instead of relying on the LLM's pre-trained knowledge, we will dynamically inject "Factual Anchors" into the prompt for every hero mentioned in the patch.

**Mechanism:**
*   For each patch, identify the changed heroes.
*   Lookup their `herodata.json` (attributes, primary attribute, movement speed, etc.) and `abilities.json` (actual skill names, damage types, cooldowns).
*   Prepend a `FACTUAL_REFERENCE_GUIDE` to the prompt:
    ```markdown
    ### FACTUAL_REFERENCE_GUIDE (Morphling)
    - Primary Attribute: Agility
    - Base Attributes: STR 22, AGI 24, INT 19
    - Abilities: Waveform, Adaptive Strike (Agility), Adaptive Strike (Strength), Attribute Shift (Agility Gain), Attribute Shift (Strength Shift), Morph.
    - REJECT: Any mention of "Intelligence Form" or "Intelligence Shift".
    ```

## 2. The "Rules Lawyer" Validation Agent
A secondary LLM pass specifically designed to find errors.

**Prompt Strategy:**
*   **Role:** You are a pedantic Dota 2 rules lawyer. 
*   **Task:** Review the following Meta Analysis for mechanical inaccuracies.
*   **Checklist:**
    1.  Does every hero mentioned have the abilities attributed to them?
    2.  Are the primary attributes correct?
    3.  Is the "guaranteed kill" claim mathematically plausible given the damage numbers?
*   **Output:** A list of `REJECTIONS` that force a regeneration of the primary analysis.

## 3. Deterministic Fact-Checking Script
A code-based validation layer (`factChecker.ts`).

**Logic:**
*   Parse the LLM's JSON output.
*   Regex-match hero and ability names against our `mappings/` directory.
*   If the LLM mentions "Intelligence Shift" for Morphling, the script flags a `CRITICAL_ERROR` because "Intelligence Shift" does not exist in the official entity mapping.
*   Fail the build/seed process if critical factual errors are detected.

## 4. Linguistic Sanitization
To prevent "Marketing Speak" (e.g., "This buff guarantees a 60% winrate"), we implement a probability filter.

*   **Rule:** Any claim of "Guaranteed", "Infinite", or "Broken" must be flagged.
*   **Correction:** Re-write to "Significantly improves potential", "Greatly scales", or "High-impact synergy".

## Implementation Plan
1.  [ ] Create `apps/scripts/factChecker.ts`.
2.  [ ] Update `backfillMeta.ts` to include `herodata` injection.
3.  [ ] Implement the secondary "Rules Lawyer" pass in the pipeline.
4.  [ ] Re-run all 38 patches through the Truth-Grounded pipeline.
