// apps/scripts/metaAnalyzer.ts

import { mkdir, writeFile, readFile, readdir } from "node:fs/promises";
import * as path from "node:path";
import { GoogleGenAI, Type } from "@google/genai";

require('dotenv').config();
const INPUT_DIR = path.resolve("research-output", "classified-patches");
const OUTPUT_DIR = path.resolve("research-output", "meta-analysis");

const hasApiKey = !!process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;

if (!hasApiKey) {
    console.warn("[Warning] GEMINI_API_KEY is not set. Running in MOCK mode.");
} else {
    ai = new GoogleGenAI({});
}

const SYSTEM_PROMPT = `You are an elite Dota 2 analyst (9,000+ MMR). I am providing you with the complete structured data for a single patch. Your task is to identify the overarching meta shifts and strategic implications.

CRITICAL INSTRUCTION: Do not just aggregate hero changes. You MUST look for **relational synergies**. 
- If jungle gold or XP changes, actively look for heroes who received mobility or wave-clear buffs (or nerfs).
- If a support item is buffed, look for supports whose stats were also altered.
- Look for cascading effects where a system change (like map layout or Roshan) combined with a specific hero tweak results in a massive shift in viability.

ROLE-SPECIFIC ANALYSIS: You must identify the top 3 winners for each of the 5 roles (Carry, Mid, Offlane, Soft Support, Hard Support). These should be heroes whose specific changes synergize most strongly with the broader patch adjustments for that role.

Your output must be a highly analytical breakdown of the patch's true impact.`;

const responseSchema = {
    type: Type.OBJECT,
    properties: {
        metaShifts: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    theme: { type: Type.STRING, description: "A short title for the shift, e.g., 'Return of the Zoo Meta' or 'Slower Early Game'." },
                    description: { type: Type.STRING, description: "A detailed paragraph explaining what mechanics changed to cause this shift." },
                    impactedRoles: { type: Type.ARRAY, items: { type: Type.STRING }, description: "e.g., ['Pos 1 Carry', 'Pos 4 Support']" }
                },
                required: ["theme", "description", "impactedRoles"]
            },
            description: "The 3-5 biggest overarching thematic changes to the game."
        },
        synergisticWinners: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    entity: { type: Type.STRING, description: "Hero, Item, or Playstyle name." },
                    synergyExplanation: { type: Type.STRING, description: "Explain HOW the specific buffs to this entity interact with broader systemic/item changes to create an outsized positive impact." }
                },
                required: ["entity", "synergyExplanation"]
            },
            description: "OVERALL entities that disproportionately benefit from the COMBINATION of systemic and specific changes."
        },
        roleSpecificWinners: {
            type: Type.OBJECT,
            properties: {
                Carry: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { hero: { type: Type.STRING }, explanation: { type: Type.STRING } }, required: ["hero", "explanation"] } },
                Mid: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { hero: { type: Type.STRING }, explanation: { type: Type.STRING } }, required: ["hero", "explanation"] } },
                Offlane: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { hero: { type: Type.STRING }, explanation: { type: Type.STRING } }, required: ["hero", "explanation"] } },
                SoftSupport: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { hero: { type: Type.STRING }, explanation: { type: Type.STRING } }, required: ["hero", "explanation"] } },
                HardSupport: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { hero: { type: Type.STRING }, explanation: { type: Type.STRING } }, required: ["hero", "explanation"] } }
            },
            required: ["Carry", "Mid", "Offlane", "SoftSupport", "HardSupport"]
        },
        synergisticLosers: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    entity: { type: Type.STRING, description: "Hero, Item, or Playstyle name." },
                    synergyExplanation: { type: Type.STRING, description: "Explain HOW the combination of nerfs and systemic changes disproportionately hurt this entity." }
                },
                required: ["entity", "synergyExplanation"]
            },
            description: "Entities disproportionately hurt by combined changes."
        }
    },
    required: ["metaShifts", "synergisticWinners", "roleSpecificWinners", "synergisticLosers"]
};

async function generateMetaAnalysis(patchData: any, retries = 4, backoff = 10000): Promise<any> {
    // Stringify the entire structured patch.
    // To save tokens slightly, we can remove the deeply nested 'classification' reasonings and just keep the Type
    const simplifiedData = {
        version: patchData.version,
        changes: patchData.changes.map((c: any) => ({
            category: c.category,
            entityName: c.entityName,
            subEntityName: c.subEntityName,
            note: c.rawNote,
            polarity: c.classification?.classificationType || "Unknown"
        }))
    };

    const payloadString = JSON.stringify(simplifiedData);
    
    if (!ai) {
        return {
            metaShifts: [
                {
                    theme: "Mock Meta Shift",
                    description: "This is a mock description because no API key is present.",
                    impactedRoles: ["All"]
                }
            ],
            synergisticWinners: [{ entity: "Mock Winner", synergyExplanation: "Mock synergy." }],
            synergisticLosers: [{ entity: "Mock Loser", synergyExplanation: "Mock synergy." }]
        };
    }

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Analyze this Dota 2 patch:\n\n${payloadString}`,
            config: {
                systemInstruction: SYSTEM_PROMPT,
                responseMimeType: "application/json",
                responseSchema: responseSchema,
                temperature: 0.3, 
            }
        });

        if (response.text) {
             return JSON.parse(response.text);
        }
        return null;
    } catch (error: any) {
        if (retries > 0 && error.status && (error.status === 429 || error.status === 503 || error.status >= 500)) {
            console.warn(`[LLM] API Error (Status: ${error.status}). Retrying in ${backoff / 1000}s...`);
            await new Promise(resolve => setTimeout(resolve, backoff));
            return generateMetaAnalysis(patchData, retries - 1, backoff * 2);
        }
        console.error(`[LLM] Meta Analysis failed after retries:`, error.message || error);
        return null;
    }
}

async function main() {
    await mkdir(OUTPUT_DIR, { recursive: true });
    
    const targetVersion = process.argv[2] || "7.41d";
    const filePath = path.join(INPUT_DIR, `${targetVersion}.json`);
    
    console.log(`[Meta Analyzer] Loading patch ${targetVersion} data...`);
    const data = JSON.parse(await readFile(filePath, "utf8"));
    
    console.log(`[Meta Analyzer] Requesting Synergistic Meta Analysis from LLM... (This may take a moment)`);
    const analysis = await generateMetaAnalysis(data);

    if (analysis) {
        const outPath = path.join(OUTPUT_DIR, `meta-${targetVersion}.json`);
        await writeFile(outPath, JSON.stringify(analysis, null, 2), "utf8");
        console.log(`\n[Success] Meta analysis saved to ${outPath}`);
        
        console.log(`\n=== META SHIFTS ===`);
        analysis.metaShifts.forEach((shift: any) => {
            console.log(`* ${shift.theme} (${shift.impactedRoles.join(", ")})`);
            console.log(`  ${shift.description}`);
        });

        console.log(`\n=== SYNERGISTIC WINNERS ===`);
        analysis.synergisticWinners.forEach((w: any) => {
            console.log(`* ${w.entity}: ${w.synergyExplanation}`);
        });

        console.log(`\n=== SYNERGISTIC LOSERS ===`);
        analysis.synergisticLosers.forEach((l: any) => {
            console.log(`* ${l.entity}: ${l.synergyExplanation}`);
        });
    } else {
        console.error("[Error] Could not generate meta analysis.");
    }
}

main().catch(console.error);