// apps/scripts/impactScorer.ts

import { mkdir, writeFile, readFile, readdir } from "node:fs/promises";
import * as path from "node:path";
import { GoogleGenAI, Type } from "@google/genai";

require('dotenv').config();
const INPUT_DIR = path.resolve("research-output", "classified-patches");
const OUTPUT_DIR = path.resolve("research-output", "impact-scored-patches");

// Check for API key and determine if we are running in mock mode
const hasApiKey = !!process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;

if (!hasApiKey) {
    console.warn("[Warning] GEMINI_API_KEY is not set. Running in MOCK mode. The LLM responses will be simulated.");
} else {
    ai = new GoogleGenAI({});
}

const SYSTEM_PROMPT = `You are a professional Dota 2 analyst (9,000+ MMR). Your goal is to evaluate patch changes for competitive and high-level pub impact. Do not simply summarize the changes; you must synthesize their strategic weight.

Evaluation Constraints:
- Laning Phase: Weight base stat changes (Damage, Armor, MS, Regen) very heavily. +2 base damage is often meta-defining for last hitting.
- Mid/Late Game: Weight cooldowns, percentage-based scaling, and BKB-piercing mechanics heavily. Flat mana/damage buffs matter less here.
- Reworks: Focus on how the hero's teamfight role or farming speed has shifted.
- Impact Magnitude: Only assign 'Meta-Defining' to changes that will drastically alter pick/ban rates or core item builds. Most changes are 'Low' or 'Medium'.`;

const responseSchema = {
    type: Type.OBJECT,
    properties: {
        impactMagnitude: {
            type: Type.STRING,
            enum: ["Low", "Medium", "High", "Meta-Defining"],
            description: "The overall weight and significance of these changes."
        },
        impactedPhases: {
            type: Type.ARRAY,
            items: {
                type: Type.STRING,
                enum: ["Laning", "Mid Game", "Late Game", "All Phases", "None"]
            },
            description: "The phases of the game most affected by these changes."
        },
        reasoning: {
            type: Type.STRING,
            description: "A 2-3 sentence expert explanation of why these changes matter and how they alter the entity's playstyle or viability."
        }
    },
    required: ["impactMagnitude", "impactedPhases", "reasoning"]
};

async function scoreEntityBatch(entityName: string, changes: any[], retries = 4, backoff = 10000): Promise<any> {
    const changesText = changes.map(c => `- [${c.subEntityName || 'Base'}] ${c.rawNote} (Base Classification: ${c.classification.classificationType})`).join('\n');
    
    if (!ai) {
        // Mock Response
        return {
            impactMagnitude: "Medium",
            impactedPhases: ["Mid Game"],
            reasoning: `[MOCK] Synthesized analysis for ${entityName} based on ${changes.length} changes. The aggregate impact shifts their viability slightly.`
        };
    }

    const prompt = `Analyze the following patch changes for ${entityName}:\n\n${changesText}`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                systemInstruction: SYSTEM_PROMPT,
                responseMimeType: "application/json",
                responseSchema: responseSchema,
                temperature: 0.2, // Keep it analytical and grounded
            }
        });

        if (response.text) {
             return JSON.parse(response.text);
        }
        return null;
    } catch (error: any) {
        if (retries > 0 && error.status && (error.status === 429 || error.status === 503 || error.status >= 500)) {
            console.warn(`[LLM] Rate limit or server error for ${entityName} (Status: ${error.status}). Retrying in ${backoff / 1000}s...`);
            await new Promise(resolve => setTimeout(resolve, backoff));
            return scoreEntityBatch(entityName, changes, retries - 1, backoff * 2);
        }
        console.error(`[LLM] Failed to score ${entityName} after retries:`, error.message || error);
        return null;
    }
}

async function scorePatch(filePath: string) {
    const data = JSON.parse(await readFile(filePath, "utf8"));
    const version = data.version;

    // Group changes by entity (Heroes only for this prototype to save API calls)
    const heroGroups = new Map<string, any[]>();
    
    for (const change of data.changes) {
        if (change.category === "hero") {
            const name = change.entityName;
            if (!heroGroups.has(name)) heroGroups.set(name, []);
            heroGroups.get(name)!.push(change);
        }
    }

    const scoredHeroes: Record<string, any> = {};

    console.log(`[Impact Scorer] Found ${heroGroups.size} heroes to score in patch ${version}...`);
    const isFullRun = process.argv.includes("--full");
    if (!isFullRun) {
        console.log(`[Impact Scorer] Running in PROTOTYPE mode. Only scoring the first 3 heroes to avoid API limits. Use --full to process all.`);
    }

    let count = 0;
    // @ts-ignore
    for (const [heroName, changes] of heroGroups.entries()) {
        if (!isFullRun && count >= 3) {
            console.log(`[Impact Scorer] Stopping at 3 heroes (Prototype Mode).`);
            break;
        }

        count++;
        console.log(`[${count}/${isFullRun ? heroGroups.size : '3 (Max)'}] Scoring ${heroName}...`);

        // Skip heroes with only very minor adjustments to save API calls in prototype
        if (changes.length === 1 && changes[0].classification.classificationType === "Adjustment") {
             scoredHeroes[heroName] = { impactMagnitude: "Low", impactedPhases: ["None"], reasoning: "Minor adjustment." };
             continue;
        }

        const score = await scoreEntityBatch(heroName, changes);
        if (score) {
            scoredHeroes[heroName] = {
                ...score,
                changes: changes // attach original changes
            };
        } else {
             scoredHeroes[heroName] = { impactMagnitude: "Unknown", impactedPhases: [], reasoning: "Failed to score.", changes };
        }

        // Simple rate limiting to respect free tier quotas (approx 15 RPM max)
        await new Promise(resolve => setTimeout(resolve, 4000));
    }

    return {
        schemaVersion: "2.0-scored",
        version: version,
        scoredHeroes
    };
}

async function main() {
    await mkdir(OUTPUT_DIR, { recursive: true });
    
    const targetVersion = process.argv[2] || "7.41d"; // Default to a small recent patch for testing
    const fileToProcess = path.join(INPUT_DIR, `${targetVersion}.json`);
    
    console.log(`[Impact Scorer] Initiating contextual impact scoring for ${targetVersion}...`);
    
    const scoredData = await scorePatch(fileToProcess);
    
    await writeFile(
        path.join(OUTPUT_DIR, `${targetVersion}-scored.json`),
        JSON.stringify(scoredData, null, 2),
        "utf8"
    );

    console.log(`\n[Summary] Successfully scored and saved impact data for ${targetVersion}.`);
}

main().catch(error => {
    console.error("[Error] Fatal error in impact scorer:", error);
    process.exit(1);
});