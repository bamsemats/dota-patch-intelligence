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

export async function loadBalanceOntology() {
    try {
        const data = await readFile(ONTOLOGY_PATH, "utf8");
        return JSON.parse(data);
    } catch (e) {
        console.error("Could not load balance ontology.");
        return { metrics: {} };
    }
}

export function calculateHeroDelta(heroName: string, changes: any[], balanceOntology: any): HeroVectorDelta {
    const vectorDelta: FeatureVector = {
        farming: 0, mobility: 0, survivability: 0, teamfight: 0, laning: 0, siege: 0, utility: 0
    };

    for (const change of changes) {
        const polarity = change.classification.classificationType;
        let multiplier = 0;
        if (polarity === "Buff") multiplier = 1;
        if (polarity === "Nerf") multiplier = -1;
        if (multiplier === 0) continue; // Skip adjustments and reworks for pure numerical deltas

        let weightObj = change.classification.strategicWeight;
        let weight = 5; // fallback
        
        if (typeof weightObj === "number") {
            weight = weightObj;
        } else if (typeof weightObj === "object" && weightObj !== null) {
            // Default to Divine bracket for MVP vector calculations
            weight = weightObj["Divine"] || 5;
        }

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

const HEROES_PATH = path.resolve("research-output", "mappings", "heroes.json");
const COUNTERS_PATH = path.resolve("research-output", "mappings", "hero_counters.json");
const AFFINITY_PATH = path.resolve("research-output", "mappings", "item_hero_affinity.json");

async function loadAffinityMap() {
    try {
        const raw = await readFile(AFFINITY_PATH, "utf8");
        return JSON.parse(raw);
    } catch (e) {
        console.warn("[Warning] Could not load item affinity map. Using empty map.");
        return {};
    }
}

async function loadCountersMap() {
    try {
        const raw = await readFile(COUNTERS_PATH, "utf8");
        return JSON.parse(raw);
    } catch (e) {
        console.warn("[Warning] Could not load hero counters map. Using empty map.");
        return {};
    }
}

async function loadHeroesList() {
    try {
        const raw = await readFile(HEROES_PATH, "utf8");
        return Object.values(JSON.parse(raw)) as string[];
    } catch (e) {
        console.error("Could not load heroes list.");
        return [];
    }
}

export async function processPatch(
    filePath: string,
    balanceOntology: any,
    heroesList: string[],
    countersMap: any,
    affinityMap: any
) {
    const data = JSON.parse(await readFile(filePath, "utf8"));
    const version = data.version;

    const heroChanges = new Map<string, any[]>();
    for (const change of data.changes) {
        if (change.category === "hero") {
            if (!heroChanges.has(change.entityName)) heroChanges.set(change.entityName, []);
            heroChanges.get(change.entityName)!.push(change);
        }
    }

    // Calculate direct vector deltas for items in the patch
    const itemChanges = new Map<string, any[]>();
    for (const change of data.changes) {
        if (change.category === "item") {
            if (!itemChanges.has(change.entityName)) itemChanges.set(change.entityName, []);
            itemChanges.get(change.entityName)!.push(change);
        }
    }

    const itemDeltas = new Map<string, FeatureVector>();
    for (const itemName of Object.keys(affinityMap)) {
        const changes = itemChanges.get(itemName) || [];
        const delta = calculateHeroDelta(itemName, changes, balanceOntology);
        itemDeltas.set(itemName, delta.vectorDelta);
    }

    // 1. Calculate direct vector deltas for all heroes in the roster
    const directDeltas = new Map<string, FeatureVector>();
    const directScores = new Map<string, number>();

    for (const heroName of heroesList) {
        const changes = heroChanges.get(heroName) || [];
        const delta = calculateHeroDelta(heroName, changes, balanceOntology);
        directDeltas.set(heroName, delta.vectorDelta);

        // Sum the dimensions to get the overall direct score
        const score = delta.vectorDelta.farming +
                      delta.vectorDelta.mobility +
                      delta.vectorDelta.survivability +
                      delta.vectorDelta.teamfight +
                      delta.vectorDelta.laning +
                      delta.vectorDelta.siege +
                      delta.vectorDelta.utility;
        directScores.set(heroName, score);
    }

    // Load coefficients from ontology if present, else default
    const C = balanceOntology.rippleCoefficients?.counter ?? -0.15;
    const S = balanceOntology.rippleCoefficients?.partner ?? 0.15;

    const vectorDeltas: HeroVectorDelta[] = [];

    // 2. Calculate ripple effects and combine
    for (const heroName of heroesList) {
        const directVector = directDeltas.get(heroName)!;
        const combinedVector = { ...directVector };

        // Apply item affinity ripple effects
        for (const [itemName, heroes] of Object.entries(affinityMap)) {
            if (Array.isArray(heroes) && heroes.includes(heroName)) {
                const itemDelta = itemDeltas.get(itemName);
                if (itemDelta) {
                    const ITEM_RIPPLE_FACTOR = 0.20;
                    for (const dim in combinedVector) {
                        const d = dim as keyof FeatureVector;
                        combinedVector[d] += itemDelta[d] * ITEM_RIPPLE_FACTOR;
                    }
                }
            }
        }

        const relationship = countersMap[heroName];
        if (relationship) {
            // Apply counter ripple effects: buffing a counter reduces our laning and survivability
            if (Array.isArray(relationship.counters)) {
                for (const counterHero of relationship.counters) {
                    const counterScore = directScores.get(counterHero) || 0;
                    if (counterScore !== 0) {
                        const ripple = counterScore * C;
                        combinedVector.survivability += 0.5 * ripple;
                        combinedVector.laning += 0.5 * ripple;
                    }
                }
            }

            // Apply partner ripple effects: buffing a partner improves our teamfight and utility
            if (Array.isArray(relationship.partners)) {
                for (const partnerHero of relationship.partners) {
                    const partnerScore = directScores.get(partnerHero) || 0;
                    if (partnerScore !== 0) {
                        const ripple = partnerScore * S;
                        combinedVector.teamfight += 0.5 * ripple;
                        combinedVector.utility += 0.5 * ripple;
                    }
                }
            }
        }

        // Only keep heroes that actually had a non-zero vector shift (direct or rippled)
        const hasNonZero = Object.values(combinedVector).some(v => Math.abs(v) >= 0.01);
        if (hasNonZero) {
            // We need to re-identify significant shifts on the combined vector
            const significantShifts: string[] = [];
            for (const [dim, val] of Object.entries(combinedVector)) {
                if (val >= 10) significantShifts.push(`Major Buff to ${dim} (+${val.toFixed(1)})`);
                if (val <= -10) significantShifts.push(`Major Nerf to ${dim} (${val.toFixed(1)})`);
            }

            // Round values to 2 decimal places for clean JSON
            const roundedVector: FeatureVector = {
                farming: parseFloat(combinedVector.farming.toFixed(2)),
                mobility: parseFloat(combinedVector.mobility.toFixed(2)),
                survivability: parseFloat(combinedVector.survivability.toFixed(2)),
                teamfight: parseFloat(combinedVector.teamfight.toFixed(2)),
                laning: parseFloat(combinedVector.laning.toFixed(2)),
                siege: parseFloat(combinedVector.siege.toFixed(2)),
                utility: parseFloat(combinedVector.utility.toFixed(2))
            };

            vectorDeltas.push({
                heroName,
                patch: version,
                vectorDelta: roundedVector,
                significantShifts
            });
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
    const heroesList = await loadHeroesList();
    const countersMap = await loadCountersMap();
    const affinityMap = await loadAffinityMap();
    
    const files = await readdir(INPUT_DIR);
    console.log(`[Vector Calc] Found ${files.length} patches to process.`);

    for (const file of files) {
        if (!file.endsWith(".json")) continue;
        console.log(`[Vector Calc] Processing ${file}...`);
        
        const result = await processPatch(
            path.join(INPUT_DIR, file),
            balanceOntology,
            heroesList,
            countersMap,
            affinityMap
        );
        
        await writeFile(
            path.join(OUTPUT_DIR, `vectors-${result.version}.json`),
            JSON.stringify(result, null, 2),
            "utf8"
        );
    }
    console.log(`\n[Summary] Successfully calculated Feature Vector Deltas.`);
}

if (require.main === module) {
    main().catch(console.error);
}