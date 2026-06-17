# Manual Patch Processing Workflow

Until the automation pipeline is fully operational, follow these steps in order when a new Dota 2 patch is released. Note: The automated **GitHub Action** now performs these steps every 6 hours.

## The One-Command Shortcut (Phase 20)
If you are on your local machine and want to run the entire sequence for a specific patch automatically:
```bash
# Example: npx tsx apps/scripts/automationPipeline.ts 7.42
npx tsx apps/scripts/automationPipeline.ts <version>
```

---

## Step-by-Step Breakdown

### Step 1: Discovery & Ingestion
First, identify the new patch and download the raw data from Valve.
```bash
# 1. Discover the latest patch version string
npm run patch:discovery

# 2. Update mappings (Important if new heroes or items were added)
npm run patch:mappings -- --force

# 3. Fetch the specific patch data (if discovery didn't download it automatically)
npx tsx apps/scripts/fetchSpecificPatch.ts <version>
```

### Step 2: Structural Processing
Convert the raw Valve JSON into our structured format.
```bash
# 4. Parse the raw notes into structured entities with originalSource preservation
npm run patch:parse

# 5. Classify changes using the tiered engine (includes PARTIALLY_CLASSIFIED estimates)
npm run patch:classify
```

### Step 3: Analytical Modeling
Calculate the strategic impacts and performance vectors.
```bash
# 6. Calculate 7-dimensional hero feature vectors
npm run patch:vectors

# 7. Generate impact scores stamped with ontology versions
npm run patch:impact -- <version> --full

# 8. Fetch winrate data (GLOBAL_BLEND includes Pro, Immortal, and Divine)
npm run patch:fetch-winrates <version>
```

### Step 4: Strategic Synthesis (LLM Phase)
Generate the narrative meta-analysis using the **Split-Prompt Architecture**.
```bash
# 9. Generate the AI meta-analysis (Hero/System Category Splitting)
npm run patch:meta -- <version>

# 10. Run the Surgical Fact-Checker (Removes hallucinations, keeps valid data)
npm run patch:meta-check

# 11. Run the Empirical Audit (Calculates Truth Scores against winrate deltas)
npx tsx apps/scripts/auditPredictions.ts
```

### Step 5: Archive & Database Update
Finalize the data and sync it to the production database.
```bash
# 12. Re-build the comprehensive hero and item history archives
npm run patch:generate-history

# 13. Backup and Seed the database
# This automatically runs a SQL backup dump before seeding
npm run db:seed
```

### Step 6: Frontend Deployment
```bash
# 14. Build and Export the static frontend
npm run build --prefix apps/frontend
```

---

## Workflow Summary Table

| Phase | Command | Responsibility |
| :--- | :--- | :--- |
| **Automation** | `patch:auto` | Orchestrates the entire 14-step sequence. |
| **Ingestion** | `patch:discovery` | Finds the new GID and downloads raw JSON. |
| **Parsing** | `patch:parse` | Preserves 100% raw source and cleans UI notes. |
| **Classification**| `patch:classify` | Assigns polarity and keyword-based estimates. |
| **Vectors** | `patch:vectors` | Updates the 7D identity trajectory. |
| **Intelligence** | `patch:meta` | Synthesizes narratives using split-prompts. |
| **Validation** | `patch:meta-check` | Surgically removes hallucinations. |
| **Auditing** | `auditPredictions` | Calculates Empirical Truth Scores. |
| **Finalization** | `db:seed` | Pushes validated intelligence to the live app. |
