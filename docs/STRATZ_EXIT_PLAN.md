# Stratz Exit Strategy: OpenDota Migration Plan

## Context
Stratz has discontinued development of their website and API. To ensure the long-term sustainability and data accuracy of the Dota Patch Intelligence platform, we must immediately pivot away from all Stratz dependencies.

## Target Architecture: OpenDota & Self-Reliance
OpenDota is an open-source alternative with a long-standing commitment to the community. It provides a REST API and a public Data Explorer (SQL) that can serve as a full replacement for our winrate and hero stats needs.

## Phase 1: Ingestion Refactoring (Immediate)
1.  **Refactor Winrate Fetcher**: Create `apps/scripts/fetchOpenDotaWinrates.ts`.
    -   Target endpoint: `https://api.opendota.com/api/heroStats`.
    -   OpenDota provides current winrates across all rank tiers (Herald to Immortal).
2.  **Refactor Patch Mappings**: Create `apps/scripts/fetchOpenDotaPatches.ts`.
    -   Target endpoint: `https://api.opendota.com/api/constants/patch`.
    -   This will replace `stratz_patches.json` with a more stable OpenDota-based mapping.

## Phase 2: Historical Backfill Refactoring
1.  **OpenDota Data Explorer**: Use OpenDota's SQL Explorer to fetch historical winrate snapshots for patches where the REST API lags.
2.  **Unified Entity Resolution**: Shift all ID mapping (Heroes, Abilities, Items) exclusively to Valve's official datafeed or OpenDota constants, removing Stratz-specific IDs.

## Phase 3: Total Decoupling (Cleanup)
1.  **Remove STRATZ_API_KEY**: Deprecate from `.env`.
2.  **Delete Stratz Scripts**: Remove `fetchStratzPatches.ts`, `backfillWinrates.ts` (the Stratz version).
3.  **Update Documentation**: Standardize on OpenDota as the primary third-party data source.

## Progress Tracking
- [x] Research OpenDota `/heroStats` schema.
- [x] Implement `fetchOpenDotaWinrates.ts`.
- [x] Implement `fetchOpenDotaPatches.ts`.
- [/] Perform full historical re-sync with OpenDota data. (Ongoing - 7.41 series complete)
- [x] Update `ROADMAP.md` and `DECISIONS.md`.
