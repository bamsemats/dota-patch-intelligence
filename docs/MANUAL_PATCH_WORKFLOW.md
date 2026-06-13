# Manual Patch Processing Workflow

Until the automation pipeline is fully operational, follow these steps in order when a new Dota 2 patch is released.

## Step 1: Discovery & Ingestion
First, identify the new patch and download the raw data from Valve.
```bash
# 1. Discover the latest patch version string
npm run patch:discovery

# 2. Update mappings (Important if new heroes or items were added)
npm run patch:mappings -- --force

# 3. Fetch the specific patch data (if discovery didn't download it automatically)
# Replace <version> with the discovered version (e.g., 7.42)
npx tsx apps/scripts/fetchSpecificPatch.ts <version>
```

## Step 2: Structural Processing
Convert the raw Valve JSON into our structured format.
```bash
# 4. Parse the raw notes into structured entities
npm run patch:parse

# 5. Classify changes (Buff/Nerf) using the tiered engine
npm run patch:classify
```

## Step 3: Analytical Modeling
Calculate the strategic impacts and performance vectors.
```bash
# 6. Calculate 7-dimensional hero feature vectors
npm run patch:vectors

# 7. Generate impact scores based on the Balance Ontology
npm run patch:impact

# 8. Fetch initial winrate data (Note: May require 24-48h for stabilization)
npm run patch:fetch-winrates
```

## Step 4: Strategic Synthesis (LLM Phase)
Generate the narrative meta-analysis using truth-grounded intelligence.
```bash
# 9. Generate the AI meta-analysis
# Ensure GEMINI_API_KEY is set and you have quota
npm run patch:meta -- <version>

# 10. Run the factual validation audit
npm run patch:meta-check
```

## Step 5: Archive & Database Update
Finalize the data and sync it to the production database.
```bash
# 11. Re-build the comprehensive hero history archives
npm run patch:generate-history

# 12. Backup and Seed the database
# This will automatically run a SQL backup before overwriting
npm run db:seed
```

## Step 6: Frontend Deployment
If you are deploying to GitHub Pages, trigger the static build.
```bash
# 13. Build the static frontend
npm run build --prefix apps/frontend
```

---

## Workflow Summary Table

| Phase | Command | Responsibility |
| :--- | :--- | :--- |
| **Ingestion** | `patch:discovery` | Finds the new GID and downloads raw JSON. |
| **Parsing** | `patch:parse` | Normalizes Valve's nested JSON structure. |
| **Classification**| `patch:classify` | Assigns polarity (Buff/Nerf/Rework). |
| **Vectors** | `patch:vectors` | Updates the 7D identity of heroes. |
| **Intelligence** | `patch:meta` | Synthesizes narrative and role winners. |
| **Validation** | `patch:meta-check` | Audits the LLM for entity accuracy. |
| **Finalization** | `db:seed` | Pushes all intelligence to the live app. |
