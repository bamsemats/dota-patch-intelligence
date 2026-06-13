# ARCHITECTURE.md

## 1. Overview
Dota Patch Intelligence is a full-stack analytical platform designed to decompose and evaluate the contextual impact of Dota 2 balance changes. It uses a **Tiered Classification Engine**, a **7-Dimensional Feature Vector Model**, and **LLM-driven Meta Analysis** to provide players and professional teams with actionable insights.

## 2. Technical Stack
*   **Monorepo Engine:** Node.js / TypeScript.
*   **Database:** PostgreSQL (local) with Prisma ORM.
*   **API:** Fastify (build-time data provider).
*   **Frontend:** Next.js (Static-to-Dynamic Hybrid) on GitHub Pages.
*   **Intelligence Layer:** Gemini 2.5 Flash / Claude 4 Sonnet.
*   **Data Sourcing:** Valve Official Datafeed + OpenDota (SQL & REST).

## 3. Data Pipeline (Phase 16)
1.  **Discovery:** `patchDiscovery.ts` monitors Valve's news feed for new patch GIDs.
2.  **Ingestion:** `fetchSpecificPatch.ts` retrieves the raw JSON datafeed for specific versions.
3.  **Parsing:** `parsePatches.ts` converts the nested Valve JSON into a flat, entity-based Change set.
4.  **Classification:** `classifyPatches.ts` identifies polarity (Buff/Nerf) and maps changes to the **Balance Ontology**.
5.  **Analytics:** `impactScorer.ts` and `calculateVectors.ts` compute the 7D feature trajectories and contextual impact scores.
6.  **Meta Analysis:** `backfillMeta.ts` (Gemini 2.5 Flash) synthesizes narrative themes and synergistic winners/losers.
7.  **Seeding:** `seed.ts` populates the PostgreSQL database for the frontend build process.

## 4. Analytical Pipeline

### Hybrid Winrate Engine (v2.3)
To ensure system longevity after the Stratz deprecation, the platform uses a two-tiered ingestion model:
1.  **Historical Baseline (SQL):** Uses OpenDota SQL Explorer to fetch aggregated "Professional Baseline" data (Lobby Type 1) for historical patches. This ensures 100% coverage even for minor patches through base-version fallback logic.
2.  **Live Tiered Data (REST):** Uses the OpenDota `/heroStats` API to fetch real-time, rank-bracketed (Herald through Divine) winrates for the current active patch.
3.  **UI Adaptivity:** The frontend dynamically toggles between a 7-column histogram (Live) and a single-metric "Pro Baseline" (Historical) based on data availability.

### Meta Analysis (Gemini 2.5 Flash)
Refactored to utilize the Google Gen AI SDK:
*   **Strategic Intuition:** Prioritizes "Archetypal Themes" and game tempo over individual change math.
*   **Temporal Grounding (Phase 15):** Injects meta shifts from the *previous* patch into the prompt context to identify recurring trends or corrective nerfs. Categorizes winners as "Net Gain" or "Recovery".
*   **Mechanical Truth-Grounding (Phase 18):** Uses a deterministic `FACTUAL_REFERENCE_GUIDE` injected into the prompt to anchor analysis in real hero attributes and ability names.
*   **Validation Layer:** A secondary `factChecker.ts` programmatic pass ensures all LLM-generated entities match official Valve mappings before the analysis is accepted.

### Winrate Calibration Engine
Automated script (`calibrateWeights.ts`) that compares real-world winrate shifts against calculated impact scores. If a hero's winrate moves in the opposite direction of our prediction, the system "nudges" the underlying ontology weights to improve future accuracy.

## 5. Deployment Model
The project uses a **"Static-to-Dynamic Hybrid"** architecture for GitHub Pages:
*   **Development:** Full relational DB and API available.
*   **Build-time:** Next.js fetches from the local Fastify API.
*   **Production:** A fully static distribution containing all patch and hero data is deployed.
*   **Resilience:** The frontend includes a local JSON fallback mechanism in `lib/localData.ts` to ensure build success even if the database is unreachable.
