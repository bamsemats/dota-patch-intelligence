# Pipeline Validation Report (Phase 0 Spike)

## Overview
This report validates the end-to-end ingestion and parsing pipeline for Dota 2 patch notes (versions 7.36 through 7.41d).

**Execution Date:** 2026-06-08
**Data Source:** Valve JSON Datafeed API
**Patches Analyzed:** 23
**Total Extracted Changes:** 7747

## Parsing Performance (Regex Accuracy)
Before recent improvements, the parser defaulted to `ADJUSTMENT` for 35.2% of all changes. After adding new regex patterns to capture "replaced with" (Reworks), "now also/grants" (Additions), and complex scaling formats, the unclassified rate was significantly reduced.

### Classification Breakdown:
1. **ADJUSTMENT:** 1904 (24.6%) - *Down from 35.2%*
2. **DECREASED:** 1868 (24.1%)
3. **INCREASED:** 1803 (23.3%)
4. **ADDITION:** 635 (8.2%)
5. **REWORK:** 621 (8.0%) - *Previously 0%*
6. **REMOVAL:** 589 (7.6%)
7. **RESCALE:** 327 (4.2%)

## Completeness & Integrity
- **Heroes:** Successfully mapped all 127 active heroes.
- **Abilities & Talents:** Parsed over 1,700 abilities and talents, linking them directly to numerical IDs from the Valve API.
- **Items:** Extracted all item changes accurately, separating `items` from `neutral_items`.
- **General Notes:** Captured broad mechanic changes (e.g., Map, Economy) while preserving hierarchical `indent_level` data.

## Current Limitations & Future Work
While the parsing accuracy is high for an MVP, the remaining 24.6% of `ADJUSTMENT` classifications mostly represent complex, multi-sentence gameplay changes (e.g., "Pudge covers himself with a layer of flesh that blocks 8/14/20/26 damage of any type taken from any source for 5/6/7/8s"). 

These highly qualitative changes are poor targets for standard regex extraction and represent the ideal use-case for the Phase 4 **Classification Engine**, which will employ LLMs to semantically analyze these remaining adjustments.

## Conclusion
The data acquisition (Phase 2) and parsing engine (Phase 3) are stable and produce reliable, structured datasets. The pipeline is ready for downstream analytical consumption.
