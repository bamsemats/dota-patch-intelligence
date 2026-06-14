// apps/scripts/metaAnalyzer.ts

import { mkdir, writeFile, readFile, readdir, access } from "node:fs/promises";
import * as path from "node:path";
import { GoogleGenAI, Type } from "@google/genai";

require('dotenv').config();
const INPUT_DIR = path.resolve("research-output", "classified-patches");
const OUTPUT_DIR = path.resolve("research-output", "meta-analysis");

const hasApiKey = !!process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;

const MAPPINGS_DIR = path.resolve("research-output", "mappings");

if (!hasApiKey) {
    console.warn("[Warning] GEMINI_API_KEY is not set. Running in MOCK mode.");
} else {
    ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY
    });
}

function getAttr(attrId: number): string {
    switch (attrId) {
        case 0: return "Strength";
        case 1: return "Agility";
        case 2: return "Intelligence";
        case 3: return "Universal";
        default: return "Unknown";
    }
}

const SYSTEM_PROMPT = `You are a world-class Dota 2 strategist and analyst for a professional Tier 1 team. Your goal is to provide high-fidelity meta insights that capture the "Strategic Intuition" of the game.

CRITICAL MECHANICAL ACCURACY RULES:
1. **Entity Precision:** The "entity" and "hero" fields MUST contain exactly ONE official name (e.g., "Axe", "Blink Dagger", "Berserker's Call"). NEVER use composite names, archetypes, or descriptions (e.g., REJECT "Axe + Blink", "Universal Heroes", "Magic Damage Mids").
2. **Role Insight Capping:** You MUST identify exactly 3 to 5 heroes for each role in the "Winners" and "Losers" sections. Do NOT exceed 5 heroes per role.
3. **Item-Hero Affinity:** NEVER suggest a synergy between a hero and an item they do not realistically build in high-level (9k+ MMR) play.
4. **Mechanical Validity:** Do not hallucinate interactions. Only claim a synergy if the mechanics actually work together.
5. **Role Purity:** When identifying Role Winners/Losers, ensure the explanation is specific to *how they play that role*.
6. **Temporal Context & Relative Strength:** You will be provided with the "Meta Shifts" of the previous patch. 
    - **Net Gain:** A hero or strategy is stronger than its long-term average due to these changes.
    - **Recovery:** A hero is being buffed, but it is primarily a partial restoration after a massive nerf in a recent patch. It may not be "back" yet.
    - You MUST explicitly label winners as either "Net Gain" or "Recovery".

STRATEGIC INTUITION & ARCHETYPAL THEMES:
- Prioritize identifying "Archetypal Themes" (e.g., "The Return of the Deathball", "The Greedy Support Meta", "Vision Control Domination", "The Death of the Hard Carry").
- Look for how systemic changes (economy, map, runes, Roshan) shift the *tempo* of the game and which hero archetypes thrive in that tempo.
- Instead of just item-math, explain the *strategic why* behind a hero's rise or fall (e.g., "The nerf to lane XP makes roaming Pos 4s more valuable, benefiting heroes like Earthshaker").
- Identify relational synergies: If a Support item is buffed, look for Supports whose kit also improved.

Your output must be a professional, intuitive breakdown that a professional coach would use to prepare a team for a major tournament.`;

const responseSchema = {
    type: Type.OBJECT,
    properties: {
        metaShifts: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    theme: { type: Type.STRING },
                    description: { type: Type.STRING },
                    impactedRoles: { type: Type.ARRAY, items: { type: Type.STRING } }
                },
                required: ["theme", "description", "impactedRoles"]
            }
        },
        synergisticWinners: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    entity: { type: Type.STRING },
                    synergyExplanation: { type: Type.STRING },
                    temporalAssessment: { type: Type.STRING, enum: ["Net Gain", "Recovery", "N/A"] }
                },
                required: ["entity", "synergyExplanation", "temporalAssessment"]
            }
        },
        synergisticLosers: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    entity: { type: Type.STRING },
                    synergyExplanation: { type: Type.STRING }
                },
                required: ["entity", "synergyExplanation"]
            }
        },
        roleSpecificWinners: {
            type: Type.OBJECT,
            properties: {
                Carry: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { hero: { type: Type.STRING }, explanation: { type: Type.STRING }, temporalAssessment: { type: Type.STRING, enum: ["Net Gain", "Recovery", "N/A"] } }, required: ["hero", "explanation", "temporalAssessment"] } },
                Mid: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { hero: { type: Type.STRING }, explanation: { type: Type.STRING }, temporalAssessment: { type: Type.STRING, enum: ["Net Gain", "Recovery", "N/A"] } }, required: ["hero", "explanation", "temporalAssessment"] } },
                Offlane: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { hero: { type: Type.STRING }, explanation: { type: Type.STRING }, temporalAssessment: { type: Type.STRING, enum: ["Net Gain", "Recovery", "N/A"] } }, required: ["hero", "explanation", "temporalAssessment"] } },
                SoftSupport: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { hero: { type: Type.STRING }, explanation: { type: Type.STRING }, temporalAssessment: { type: Type.STRING, enum: ["Net Gain", "Recovery", "N/A"] } }, required: ["hero", "explanation", "temporalAssessment"] } },
                HardSupport: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { hero: { type: Type.STRING }, explanation: { type: Type.STRING }, temporalAssessment: { type: Type.STRING, enum: ["Net Gain", "Recovery", "N/A"] } }, required: ["hero", "explanation", "temporalAssessment"] } }
            },
            required: ["Carry", "Mid", "Offlane", "SoftSupport", "HardSupport"]
        },
        roleSpecificLosers: {
            type: Type.OBJECT,
            properties: {
                Carry: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { hero: { type: Type.STRING }, explanation: { type: Type.STRING } }, required: ["hero", "explanation"] } },
                Mid: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { hero: { type: Type.STRING }, explanation: { type: Type.STRING } }, required: ["hero", "explanation"] } },
                Offlane: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { hero: { type: Type.STRING }, explanation: { type: Type.STRING } }, required: ["hero", "explanation"] } },
                SoftSupport: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { hero: { type: Type.STRING }, explanation: { type: Type.STRING } }, required: ["hero", "explanation"] } },
                HardSupport: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { hero: { type: Type.STRING }, explanation: { type: Type.STRING } }, required: ["hero", "explanation"] } }
            },
            required: ["Carry", "Mid", "Offlane", "SoftSupport", "HardSupport"]
        }
    },
    required: ["metaShifts", "synergisticWinners", "synergisticLosers", "roleSpecificWinners", "roleSpecificLosers"]
};

async function generateMetaAnalysis(patchData: any, herodata: any, previousAnalysis: any = null, retries = 4, backoff = 10000): Promise<any> {
    const changedHeroes = new Set<string>();
    patchData.changes.forEach((c: any) => {
        if (c.category === "hero" && c.entityName) {
            changedHeroes.add(c.entityName);
        }
    });

    let factualGuide = "### FACTUAL_REFERENCE_GUIDE\n";
    changedHeroes.forEach(heroName => {
        const heroId = Object.keys(herodata).find(id => herodata[id].name_loc === heroName);
        if (heroId) {
            const h = herodata[heroId];
            factualGuide += `#### ${heroName}\n`;
            factualGuide += `- Primary Attribute: ${getAttr(h.primary_attr)}\n`;
            factualGuide += `- Base Stats: STR ${h.str_base}, AGI ${h.agi_base}, INT ${h.int_base}\n`;
            const abilities = (h.abilities || []).map((a: any) => a.name_loc).filter(Boolean);
            factualGuide += `- Abilities: ${abilities.join(", ")}\n`;
            
            // Hallucination Prevention
            if (heroName === "Morphling") {
                factualGuide += `- REJECT: Any mention of "Intelligence Form" or "Intelligence Shift". Morphling only shifts between Strength and Agility.\n`;
            }
        }
    });

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
    const contextPrompt = previousAnalysis 
        ? `\n\nCONTEXT FROM PREVIOUS PATCH (${previousAnalysis.version}):\n${JSON.stringify(previousAnalysis.metaShifts)}\nUse this to understand if the current changes are amplifying or reversing recent trends.`
        : "";
    
    if (!ai) {
        return {
            metaShifts: [
                {
                    theme: "Mock Meta Shift",
                    description: "This is a mock description because no API key is present.",
                    impactedRoles: ["All"]
                }
            ],
            synergisticWinners: [{ entity: "Mock Winner", synergyExplanation: "Mock synergy.", temporalAssessment: "N/A" }],
            synergisticLosers: [{ entity: "Mock Loser", synergyExplanation: "Mock synergy." }],
            roleSpecificWinners: { Carry: [], Mid: [], Offlane: [], SoftSupport: [], HardSupport: [] },
            roleSpecificLosers: { Carry: [], Mid: [], Offlane: [], SoftSupport: [], HardSupport: [] }
        };
    }

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `${factualGuide}\n\nAnalyze this Dota 2 patch and output the meta analysis:\n\nPATCH DATA:\n${payloadString}${contextPrompt}`,
            config: {
                systemInstruction: SYSTEM_PROMPT,
                responseMimeType: "application/json",
                responseSchema: responseSchema,
                temperature: 0.1, 
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
            return generateMetaAnalysis(patchData, herodata, previousAnalysis, retries - 1, backoff * 2);
        }
        console.error(`[LLM] Meta Analysis failed after retries:`, error.message || error);
        return null;
    }
}

async function fileExists(path: string) {
    try {
        await access(path);
        return true;
    } catch {
        return false;
    }
}

async function main() {
    await mkdir(OUTPUT_DIR, { recursive: true });
    
    const targetVersion = process.argv[2] || "7.41d";
    const filePath = path.join(INPUT_DIR, `${targetVersion}.json`);

    const herodata = JSON.parse(await readFile(path.join(MAPPINGS_DIR, "herodata.json"), "utf8"));
    
    // Find previous patch for context
    const files = (await readdir(INPUT_DIR))
        .filter(f => f.endsWith(".json"))
        .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));
    
    const currentIndex = files.indexOf(`${targetVersion}.json`);
    let previousAnalysis: any = null;
    if (currentIndex > 0) {
        const prevVersion = files[currentIndex - 1].replace(".json", "");
        const prevPath = path.join(OUTPUT_DIR, `meta-${prevVersion}.json`);
        if (await fileExists(prevPath)) {
            const current = JSON.parse(await readFile(prevPath, "utf8"));
            previousAnalysis = { version: prevVersion, metaShifts: current.metaShifts };
        }
    }
    
    console.log(`[Meta Analyzer] Loading patch ${targetVersion} data...`);
    const data = JSON.parse(await readFile(filePath, "utf8"));
    
    console.log(`[Meta Analyzer] Requesting Synergistic Meta Analysis from LLM... (This may take a moment)`);
    const analysis = await generateMetaAnalysis(data, herodata, previousAnalysis);

    if (analysis) {
        const outPath = path.join(OUTPUT_DIR, `meta-${targetVersion}.json`);
        await writeFile(outPath, JSON.stringify(analysis, null, 2), "utf8");
        console.log(`\n[Success] Meta analysis saved to ${outPath}`);
        
        console.log(`\n=== META SHIFTS ===`);
        (analysis.metaShifts || []).forEach((shift: any) => {
            console.log(`* ${shift.theme} (${(shift.impactedRoles || []).join(", ")})`);
            console.log(`  ${shift.description}`);
        });

        console.log(`\n=== SYNERGISTIC WINNERS ===`);
        (analysis.synergisticWinners || []).forEach((w: any) => {
            console.log(`* ${w.entity} (${w.temporalAssessment}): ${w.synergyExplanation}`);
        });

        console.log(`\n=== SYNERGISTIC LOSERS ===`);
        (analysis.synergisticLosers || []).forEach((l: any) => {
            console.log(`* ${l.entity}: ${l.synergyExplanation}`);
        });
    } else {
        console.error("[Error] Could not generate meta analysis.");
    }
}

main().catch(console.error);
