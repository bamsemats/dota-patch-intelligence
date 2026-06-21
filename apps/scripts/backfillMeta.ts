// apps/scripts/backfillMeta.ts

import { mkdir, writeFile, readFile, readdir, access } from "node:fs/promises";
import * as path from "node:path";
import { GoogleGenAI, Type } from "@google/genai";
import { PrismaClient } from "@prisma/client";

require('dotenv').config();
const INPUT_DIR = path.resolve("research-output", "classified-patches");
const OUTPUT_DIR = path.resolve("research-output", "meta-analysis");

const prisma = new PrismaClient();
const hasApiKey = !!process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;

const MAPPINGS_DIR = path.resolve("research-output", "mappings");

if (!hasApiKey) {
    console.error("[Error] GEMINI_API_KEY is not set. Backfill requires Gemini.");
    process.exit(1);
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
3. **Mechanical Validity:** Do not hallucinate interactions. Only claim a synergy if the mechanics actually work together.
4. **Role Purity:** When identifying Role Winners/Losers, ensure the explanation is specific to *how they play that role*.
5. **Temporal Context & Relative Strength:** You will be provided with the "Meta Shifts" of the previous patch. 
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

async function generateMetaAnalysis(patchData: any, herodata: any, previousAnalysis: any = null): Promise<any> {
    const heroChanges = patchData.changes.filter((c: any) => c.category === "hero");
    const itemChanges = patchData.changes.filter((c: any) => c.category === "item" || c.category === "neutral");
    const generalChanges = patchData.changes.filter((c: any) => c.category === "general");

    console.log(`[LLM] Splitting analysis: ${heroChanges.length} Hero, ${itemChanges.length} Item, ${generalChanges.length} General changes.`);

    // 1. Hero Analysis (Winners/Losers)
    const heroAnalysis = await analyzeCategory("Heroes", heroChanges, herodata, previousAnalysis);
    
    // 2. Item & System Analysis (Thematic Shifts)
    const systemAnalysis = await analyzeCategory("Items & Systems", [...itemChanges, ...generalChanges], herodata, previousAnalysis);

    // 3. Final Synthesis
    return synthesizeAnalysis(patchData.version, heroAnalysis, systemAnalysis, previousAnalysis);
}

async function analyzeCategory(name: string, changes: any[], herodata: any, previousAnalysis: any, retries = 3): Promise<any> {
    if (changes.length === 0) return null;

    const changedHeroes = new Set<string>();
    changes.forEach((c: any) => {
        if (c.category === "hero" && c.entityName) changedHeroes.add(c.entityName);
    });

    let factualGuide = "### FACTUAL_REFERENCE_GUIDE\n";
    changedHeroes.forEach(heroName => {
        const heroId = Object.keys(herodata).find(id => herodata[id].name_loc === heroName);
        if (heroId) {
            const h = herodata[heroId];
            factualGuide += `#### ${heroName}\n- Primary Attribute: ${getAttr(h.primary_attr)}\n- Abilities: ${(h.abilities || []).map((a: any) => a.name_loc).filter(Boolean).join(", ")}\n`;
        }
    });

    const payload = JSON.stringify(changes.map(c => ({
        entity: c.entityName, subEntity: c.subEntityName, note: c.rawNote, polarity: c.classification?.classificationType || "Unknown"
    })));

    const contextPrompt = previousAnalysis ? `\n\nPREVIOUS CONTEXT: ${JSON.stringify(previousAnalysis.metaShifts)}` : "";

    try {
        const response = await ai!.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `${factualGuide}\n\nAnalyze these Dota 2 ${name} changes and identify key winners, losers, and thematic shifts:\n\nDATA:\n${payload}${contextPrompt}`,
            config: {
                systemInstruction: SYSTEM_PROMPT + "\nOutput a partial analysis for this category.",
                responseMimeType: "application/json",
                responseSchema: responseSchema, // Use same schema for consistency
                temperature: 0.1,
            }
        });
        return response.text ? JSON.parse(response.text) : null;
    } catch (error: any) {
        if (retries > 0 && error.status === 429) {
             console.warn(`[LLM] Rate limit during ${name} analysis. Retrying...`);
             await new Promise(r => setTimeout(r, 15000));
             return analyzeCategory(name, changes, herodata, previousAnalysis, retries - 1);
        }
        return null;
    }
}

async function synthesizeAnalysis(version: string, heroPart: any, systemPart: any, previousAnalysis: any): Promise<any> {
    console.log(`[LLM] Synthesizing final analysis for ${version}...`);
    
    const combinedData = {
        heroTrends: heroPart?.metaShifts || [],
        systemTrends: systemPart?.metaShifts || [],
        heroWinners: heroPart?.roleSpecificWinners || {},
        heroLosers: heroPart?.roleSpecificLosers || {},
        allSynergies: [...(heroPart?.synergisticWinners || []), ...(systemPart?.synergisticWinners || [])]
    };

    const prompt = `Synthesize these partial analyses into a final comprehensive meta analysis for Patch ${version}. Ensure the themes are high-level and strategic.\n\nPARTIAL DATA:\n${JSON.stringify(combinedData)}`;

    try {
        const response = await ai!.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                systemInstruction: SYSTEM_PROMPT + "\nYou MUST identification exactly 3-5 heroes per role for final Winners/Losers.",
                responseMimeType: "application/json",
                responseSchema: responseSchema,
                temperature: 0.1,
            }
        });
        return response.text ? JSON.parse(response.text) : null;
    } catch (e) {
        console.error("[LLM] Synthesis failed:", e);
        return heroPart || systemPart; // Fallback to partial if synthesis fails
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

async function updateDatabase(patchId: number, analysis: any) {
    const data = {
        metaShifts: analysis.metaShifts || [],
        synergisticWinners: analysis.synergisticWinners || [],
        synergisticLosers: analysis.synergisticLosers || [],
        roleSpecificWinners: analysis.roleSpecificWinners || {},
        roleSpecificLosers: analysis.roleSpecificLosers || {},
        truthScore: analysis.truthScore || null,
        analysisVersion: analysis.analysisVersion || 0
    };

    await prisma.metaAnalysis.upsert({
        where: { patchId },
        update: data,
        create: {
            patchId,
            ...data
        }
    });
}

async function main() {
    await mkdir(OUTPUT_DIR, { recursive: true });

    const force = process.argv.includes("--force");
    const startAtArg = process.argv.find(arg => arg.startsWith("--start-at="));
    const startAtVersion = startAtArg ? startAtArg.split("=")[1] : null;

    const herodata = JSON.parse(await readFile(path.join(MAPPINGS_DIR, "herodata.json"), "utf8"));

    const files = (await readdir(INPUT_DIR))
        .filter(f => f.endsWith(".json"))
        .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));


    console.log(`[Backfill] Found ${files.length} patches to process.`);

    let previousAnalysis: any = null;
    let foundStart = !startAtVersion;

    for (const file of files) {
        const version = file.replace(".json", "");
        const outPath = path.join(OUTPUT_DIR, `meta-${version}.json`);

        // Skip until we reach the start version if specified
        if (!foundStart) {
            if (version === startAtVersion) {
                foundStart = true;
            } else {
                console.log(`[Backfill] Skipping ${version} (pre-start version)`);
                if (await fileExists(outPath)) {
                    const current = JSON.parse(await readFile(outPath, "utf8"));
                    previousAnalysis = { version, metaShifts: current.metaShifts };
                }
                continue;
            }
        }

        // Load previous analysis if it exists
        if (await fileExists(outPath)) {
            const current = JSON.parse(await readFile(outPath, "utf8"));
            if (!force && current.roleSpecificLosers) {
                console.log(`[Backfill] Skipping ${version} (already exists)`);
                previousAnalysis = { version, metaShifts: current.metaShifts };
                continue;
            }
        }


        console.log(`[Backfill] Processing ${version}...`);
        const data = JSON.parse(await readFile(path.join(INPUT_DIR, file), "utf8"));
        
        const analysis = await generateMetaAnalysis(data, herodata, previousAnalysis);
        if (analysis) {
            // Write to File System (Archive)
            await writeFile(outPath, JSON.stringify(analysis, null, 2), "utf8");
            
            // Write to Database (Live)
            const patchRecord = await prisma.patch.findUnique({ where: { version } });
            if (patchRecord) {
                await updateDatabase(patchRecord.id, analysis);
                console.log(`[Backfill] Success: ${version} saved.`);
            }

            previousAnalysis = { version, metaShifts: analysis.metaShifts };

            // Delay to respect rate limits (Gemini Free tier is 15 RPM, but we want to be safe)
            await new Promise(resolve => setTimeout(resolve, 10000));
        } else {
            console.error(`[Backfill] Failed: ${version}`);
        }
    }
    
    console.log("[Backfill] Completed.");
    await prisma.$disconnect();
}

main().catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
});
