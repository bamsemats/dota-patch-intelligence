// apps/scripts/simulateMeta.ts

import { mkdir, writeFile, readFile, readdir } from "node:fs/promises";
import * as path from "node:path";
import { GoogleGenAI, Type } from "@google/genai";

require('dotenv').config();

const CLASSIFIED_DIR = path.resolve("research-output", "classified-patches");
const VECTORS_DIR = path.resolve("research-output", "feature-vectors");
const OUTPUT_DIR = path.resolve("research-output", "meta-simulation");

const hasApiKey = !!process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;

if (!hasApiKey) {
    console.warn("[Warning] GEMINI_API_KEY is not set. Running in MOCK mode.");
} else {
    ai = new GoogleGenAI({});
}

const SYSTEM_PROMPT = `You are a world-class Dota 2 drafter and strategic analyst (TI-winner level).
Your task is to run a Meta Impact Simulation for a given patch.

I will provide you with:
1. Systemic Changes (Map, Economy, Mechanics)
2. Item Utility Shifts
3. Hero Feature Vector Deltas (Mathematical shifts in their strategic dimensions)

You need to analyze these inputs and predict how the meta will shift, and which specific heroes will become the top draft picks (Winners) and which will fall out of the meta (Losers).
Do not just look at hero vectors in isolation. Combine them with the systemic and item changes. For example, if farming is nerfed systemically, heroes with positive mobility and teamfight vectors might be the true winners.

Return your analysis as a structured JSON object.`;

const responseSchema = {
    type: Type.OBJECT,
    properties: {
        metaDirection: {
            type: Type.STRING,
            description: "A 1-2 sentence high-level summary of the new meta direction (e.g., 'Fast-tempo pushing and aura stacking')."
        },
        predictedWinners: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "Top 3-5 heroes predicted to dominate the new meta."
        },
        predictedLosers: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "Top 3-5 heroes predicted to fall out of favor."
        },
        confidence: {
            type: Type.NUMBER,
            description: "Your confidence score in this prediction from 0.0 to 1.0."
        },
        reasoning: {
            type: Type.STRING,
            description: "Detailed strategic reasoning explaining the complex synergies that led to these predictions."
        }
    },
    required: ["metaDirection", "predictedWinners", "predictedLosers", "confidence", "reasoning"]
};

async function simulatePatch(version: string, retries = 4, backoff = 10000): Promise<any> {
    const classifiedPath = path.join(CLASSIFIED_DIR, `${version}.json`);
    const vectorPath = path.join(VECTORS_DIR, `vectors-${version}.json`);

    let classifiedData, vectorData;

    try {
        classifiedData = JSON.parse(await readFile(classifiedPath, "utf8"));
        vectorData = JSON.parse(await readFile(vectorPath, "utf8"));
    } catch (e) {
        console.error(`[Simulation] Could not load required data for patch ${version}.`);
        return null;
    }

    // Extract General and Item changes
    const generalChanges = classifiedData.changes.filter((c: any) => c.category === "general").map((c: any) => c.rawNote);
    const itemChanges = classifiedData.changes.filter((c: any) => c.category === "item" || c.category === "neutral").map((c: any) => `[${c.entityName}] ${c.rawNote}`);

    // Extract Hero Vectors (only those with significant shifts to save context)
    const heroVectors = vectorData.vectorDeltas.filter((v: any) => v.significantShifts.length > 0).map((v: any) => {
        return `[${v.heroName}]: ${v.significantShifts.join(", ")}`;
    });

    const payload = {
        version,
        generalChanges,
        itemChanges,
        significantHeroShifts: heroVectors
    };

    if (!ai) {
        return {
            patch: version,
            metaDirection: "[MOCK] Meta favors tanky initiators.",
            predictedWinners: ["Axe", "Tidehunter", "Centaur Warrunner"],
            predictedLosers: ["Puck", "Storm Spirit", "Queen of Pain"],
            confidence: 0.5,
            reasoning: "[MOCK] Without an API key, this is a simulated response based on mock data."
        };
    }

    console.log(`[Simulation] Requesting Draft Simulation from LLM...`);
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Simulate the meta impact for this patch data:\n\n${JSON.stringify(payload)}`,
            config: {
                systemInstruction: SYSTEM_PROMPT,
                responseMimeType: "application/json",
                responseSchema: responseSchema,
                temperature: 0.4, // Slight creativity for strategic theorycrafting
            }
        });

        if (response.text) {
             const result = JSON.parse(response.text);
             result.patch = version;
             return result;
        }
        return null;
    } catch (error: any) {
        if (retries > 0 && error.status && (error.status === 429 || error.status === 503 || error.status >= 500)) {
            console.warn(`[LLM] API Error (Status: ${error.status}). Retrying in ${backoff / 1000}s...`);
            await new Promise(resolve => setTimeout(resolve, backoff));
            return simulatePatch(version, retries - 1, backoff * 2);
        }
        console.error(`[LLM] Meta Simulation failed after retries:`, error.message || error);
        return null;
    }
}

async function main() {
    await mkdir(OUTPUT_DIR, { recursive: true });
    
    const targetVersion = process.argv[2] || "7.41d";
    
    console.log(`[Simulation] Starting Meta Impact Simulation for ${targetVersion}...`);
    const simulation = await simulatePatch(targetVersion);

    if (simulation) {
        const outPath = path.join(OUTPUT_DIR, `simulation-${targetVersion}.json`);
        await writeFile(outPath, JSON.stringify(simulation, null, 2), "utf8");
        console.log(`\n[Success] Simulation saved to ${outPath}`);
        
        console.log(`\n=== META DIRECTION ===`);
        console.log(`${simulation.metaDirection} (Confidence: ${simulation.confidence})`);

        console.log(`\n=== PREDICTED WINNERS ===`);
        console.log(simulation.predictedWinners.join(", "));

        console.log(`\n=== PREDICTED LOSERS ===`);
        console.log(simulation.predictedLosers.join(", "));

        console.log(`\n=== REASONING ===`);
        console.log(simulation.reasoning);

    } else {
        console.error("[Error] Could not generate simulation.");
    }
}

main().catch(console.error);