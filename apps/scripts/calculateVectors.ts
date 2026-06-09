// apps/scripts/calculateVectors.ts

import { mkdir, writeFile, readFile, readdir } from "node:fs/promises";
import * as path from "node:path";

const INPUT_DIR = path.resolve("research-output", "classified-patches");
const OUTPUT_DIR = path.resolve("research-output", "feature-vectors");
const ONTOLOGY_PATH = path.resolve("research-output", "ontology", "balance_metrics.json");

interface FeatureVector {
    farming: number;
    mobility: number;
    survivability: number;
    teamfight: number;
    laning: number;
    siege: number;
    utility: number;
}

interface HeroVectorDelta {
    heroName: string;
    patch: string;
    vectorDelta: FeatureVector;
    significantShifts: string[];
}

// Mapping of gameplay areas (from balance ontology) to our 7 core feature dimensions
const DIMENSION_MAP: Record<string, keyof FeatureVector> = {
    "farm_speed": "farming",
    "farming": "farming",
    "mobility": "mobility",
    "map_rotations": "mobility",
    "escape": "mobility",
    "physical_survivability": "survivability",
    "tankiness": "survivability",
    "debuff_management": "survivability",
    "initiation_recovery": "survivability",
    "teamfight_frequency": "teamfight",
    "teamfight_reliability": "teamfight",
    "ultimate_impact": "teamfight",
    "crowd_control": "teamfight",
    "deathball": "teamfight",
    "lane_sustain": "laning",
    "lane_trading": "laning",
    "last_hitting": "laning",
    "objectives": "siege",
    "pushing": "siege",
    "objective_damage": "siege",
    "positioning": "utility",
    "safety": "utility",
    "pick_off_potential": "utility",
    "ganking": "utility",
    "map_control": "utility",
    "single_target_impact": "utility",
    "spell_frequency": "utility",
    "power_spikes": "utility",
    "scaling": "utility",
    "counter_play": "utility",
    "late_game_scaling": "farming", // simplified mapping
    "physical_dps": "teamfight", // simplified mapping
    "buff_uptime": "utility",
    "overall_power": "teamfight", // simplified mapping
    "mana_pool": "utility"
};

async function loadBalanceOntology() {
    try {
        const data = await readFile(ONTOLOGY_PATH, "utf8");
        return JSON.parse(data);
    } catch (e) {
        console.error("Could not load balance ontology.");
        return { metrics: {} };
    }
}

function calculateHeroDelta(heroName: string, changes: any[], balanceOntology: any): HeroVectorDelta {
    const vectorDelta: FeatureVector = {
        farming: 0, mobility: 0, survivability: 0, teamfight: 0, laning: 0, siege: 0, utility: 0
    };

    for (const change of changes) {
        const polarity = change.classification.classificationType;
        let multiplier = 0;
        if (polarity === "Buff") multiplier = 1;
        if (polarity === "Nerf") multiplier = -1;
        if (multiplier === 0) continue; // Skip adjustments and reworks for pure numerical deltas

        const weight = change.classification.strategicWeight || 5;
        const metricStr = (change.metric || "").toLowerCase();
        
        let areas: string[] = [];

        // Try to get mapped areas from balance ontology if it's a numeric change
        if (change.classification.state === "NUMERIC" && balanceOntology.metrics[metricStr]) {
            areas = balanceOntology.metrics[metricStr].affects;
        } 
        // If semantic, the ontology defines the impact areas, but our classify script currently
        // doesn't inject them directly into the classified output. 
        // For MVP vector calculation, we will rely primarily on the numeric mappings.

        for (const area of areas) {
            const dimension = DIMENSION_MAP[area];
            if (dimension) {
                // Apply the delta. In a full system, we'd multiply by archetype modifiers here.
                vectorDelta[dimension] += (weight * multiplier);
            }
        }
    }

    // Identify significant shifts
    const significantShifts: string[] = [];
    for (const [dim, val] of Object.entries(vectorDelta)) {
        if (val >= 10) significantShifts.push(`Major Buff to ${dim} (+${val})`);
        if (val <= -10) significantShifts.push(`Major Nerf to ${dim} (${val})`);
    }

    return {
        heroName,
        patch: "", // set later
        vectorDelta,
        significantShifts
    };
}

async function processPatch(filePath: string, balanceOntology: any) {
    const data = JSON.parse(await readFile(filePath, "utf8"));
    const version = data.version;

    const heroChanges = new Map<string, any[]>();
    for (const change of data.changes) {
        if (change.category === "hero") {
            if (!heroChanges.has(change.entityName)) heroChanges.set(change.entityName, []);
            heroChanges.get(change.entityName)!.push(change);
        }
    }

    const vectorDeltas: HeroVectorDelta[] = [];
    for (const [heroName, changes] of heroChanges.entries()) {
        const delta = calculateHeroDelta(heroName, changes, balanceOntology);
        delta.patch = version;
        
        // Only keep heroes that actually had a non-zero vector shift
        if (Object.values(delta.vectorDelta).some(v => v !== 0)) {
            vectorDeltas.push(delta);
        }
    }

    return {
        version,
        vectorDeltas
    };
}

async function main() {
    await mkdir(OUTPUT_DIR, { recursive: true });
    const balanceOntology = await loadBalanceOntology();
    
    const files = await readdir(INPUT_DIR);
    console.log(`[Vector Calc] Found ${files.length} patches to process.`);

    for (const file of files) {
        if (!file.endsWith(".json")) continue;
        console.log(`[Vector Calc] Processing ${file}...`);
        
        const result = await processPatch(path.join(INPUT_DIR, file), balanceOntology);
        
        await writeFile(
            path.join(OUTPUT_DIR, `vectors-${result.version}.json`),
            JSON.stringify(result, null, 2),
            "utf8"
        );
    }
    console.log(`\n[Summary] Successfully calculated Feature Vector Deltas.`);
}

main().catch(console.error);