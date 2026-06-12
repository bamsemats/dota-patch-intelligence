// apps/scripts/backfillMeta.ts

import { mkdir, writeFile, readFile, readdir, access } from "node:fs/promises";
import * as path from "node:path";
import Anthropic from "@anthropic-ai/sdk";
import { PrismaClient } from "@prisma/client";

require('dotenv').config();
const INPUT_DIR = path.resolve("research-output", "classified-patches");
const OUTPUT_DIR = path.resolve("research-output", "meta-analysis");

const prisma = new PrismaClient();
const hasApiKey = !!process.env.CLAUDE_API_KEY;
let anthropic: Anthropic | null = null;

if (!hasApiKey) {
    console.error("[Error] CLAUDE_API_KEY is not set. Backfill requires AI.");
    process.exit(1);
} else {
    anthropic = new Anthropic({
        apiKey: process.env.CLAUDE_API_KEY,
    });
}

const SYSTEM_PROMPT = `You are a world-class Dota 2 strategist and analyst for a professional Tier 1 team. Your goal is to provide 100% accurate, high-fidelity meta insights.

CRITICAL MECHANICAL ACCURACY RULES:
1. **Item-Hero Affinity:** NEVER suggest a synergy between a hero and an item they do not realistically build in high-level (9k+ MMR) play. (e.g., Phantom Assassin does NOT build Gleipnir, Anti-Mage does NOT build Conjurer's Catalyst). 
2. **Mechanical Validity:** Do not hallucinate interactions. Only claim a synergy if the mechanics actually work together (e.g., don't claim Mana Break procs spell-based passives unless it actually does).
3. **Systemic Impact:** Focus on how map changes (Roshan, jungle, gold/XP) affect specific *playstyles* (e.g., "Slower jungle gold favors lane dominators like Huskar" is valid; "Slower jungle gold is good for PA" is usually FALSE).
4. **Role Purity:** When identifying Role Winners/Losers, ensure the explanation is specific to *how they play that role*.
5. **Temporal Context:** You will be provided with the "Meta Shifts" of the previous patch. You MUST use this to determine if current changes are amplifying an existing trend or attempting to correct/nerf a previously dominant strategy.

ANALYTICAL FRAMEWORK:
- Identify relational synergies (e.g., Buff to Item X + Buff to Hero Y who builds Item X = Synergistic Winner).
- Look for cascading effects where a system change combined with a hero tweak results in a massive shift.
- Be conservative. If a hero is only slightly buffed but the meta is moving against them, they are NOT a winner.

Your output must be a clinical, professional breakdown that a professional coach would trust.`;

const responseSchema: any = {
    type: "object",
    properties: {
        metaShifts: {
            type: "array",
            items: {
                type: "object",
                properties: {
                    theme: { type: "string" },
                    description: { type: "string" },
                    impactedRoles: { type: "array", items: { type: "string" } }
                },
                required: ["theme", "description", "impactedRoles"]
            }
        },
        synergisticWinners: {
            type: "array",
            items: {
                type: "object",
                properties: {
                    entity: { type: "string" },
                    synergyExplanation: { type: "string" }
                },
                required: ["entity", "synergyExplanation"]
            }
        },
        synergisticLosers: {
            type: "array",
            items: {
                type: "object",
                properties: {
                    entity: { type: "string" },
                    synergyExplanation: { type: "string" }
                },
                required: ["entity", "synergyExplanation"]
            }
        },
        roleSpecificWinners: {
            type: "object",
            properties: {
                Carry: { type: "array", items: { type: "object", properties: { hero: { type: "string" }, explanation: { type: "string" } }, required: ["hero", "explanation"] } },
                Mid: { type: "array", items: { type: "object", properties: { hero: { type: "string" }, explanation: { type: "string" } }, required: ["hero", "explanation"] } },
                Offlane: { type: "array", items: { type: "object", properties: { hero: { type: "string" }, explanation: { type: "string" } }, required: ["hero", "explanation"] } },
                SoftSupport: { type: "array", items: { type: "object", properties: { hero: { type: "string" }, explanation: { type: "string" } }, required: ["hero", "explanation"] } },
                HardSupport: { type: "array", items: { type: "object", properties: { hero: { type: "string" }, explanation: { type: "string" } }, required: ["hero", "explanation"] } }
            },
            required: ["Carry", "Mid", "Offlane", "SoftSupport", "HardSupport"]
        },
        roleSpecificLosers: {
            type: "object",
            properties: {
                Carry: { type: "array", items: { type: "object", properties: { hero: { type: "string" }, explanation: { type: "string" } }, required: ["hero", "explanation"] } },
                Mid: { type: "array", items: { type: "object", properties: { hero: { type: "string" }, explanation: { type: "string" } }, required: ["hero", "explanation"] } },
                Offlane: { type: "array", items: { type: "object", properties: { hero: { type: "string" }, explanation: { type: "string" } }, required: ["hero", "explanation"] } },
                SoftSupport: { type: "array", items: { type: "object", properties: { hero: { type: "string" }, explanation: { type: "string" } }, required: ["hero", "explanation"] } },
                HardSupport: { type: "array", items: { type: "object", properties: { hero: { type: "string" }, explanation: { type: "string" } }, required: ["hero", "explanation"] } }
            },
            required: ["Carry", "Mid", "Offlane", "SoftSupport", "HardSupport"]
        }
    },
    required: ["metaShifts", "synergisticWinners", "synergisticLosers", "roleSpecificWinners", "roleSpecificLosers"]
};

async function generateMetaAnalysis(patchData: any, previousAnalysis: any = null, retries = 3, backoff = 10000): Promise<any> {
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
    
    try {
        const response = await anthropic!.messages.create({
            model: "claude-sonnet-4-20250514",
            max_tokens: 4096,
            temperature: 0.1,
            system: SYSTEM_PROMPT,
            messages: [
                {
                    role: "user",
                    content: `Analyze this Dota 2 patch and output the meta analysis using the provided tool:\n\nPATCH DATA:\n${payloadString}${contextPrompt}`
                }
            ],
            tools: [
                {
                    name: "output_meta_analysis",
                    description: "Output the final structured meta analysis of the patch.",
                    input_schema: responseSchema
                }
            ],
            tool_choice: { type: "tool", name: "output_meta_analysis" }
        });

        if (response.content && response.content.length > 0) {
            const toolCall: any = response.content.find((block: any) => block.type === 'tool_use' && block.name === 'output_meta_analysis');
            if (toolCall && toolCall.input) {
                 const analysis = toolCall.input;
                 if (!analysis.synergisticLosers) analysis.synergisticLosers = [];
                 if (!analysis.synergisticWinners) analysis.synergisticWinners = [];
                 if (!analysis.metaShifts) analysis.metaShifts = [];
                 return analysis;
            }
        }
        return null;
    } catch (error: any) {
        if (error.status === 429) {
             console.warn(`[LLM] Rate Limit hit for ${patchData.version}. Retrying in ${backoff / 1000}s...`);
             await new Promise(resolve => setTimeout(resolve, backoff));
             return generateMetaAnalysis(patchData, previousAnalysis, retries - 1, backoff * 2);
        }
        
        if (retries > 0 && error.status && (error.status === 503 || error.status >= 500)) {
            console.warn(`[LLM] API Error (Status: ${error.status}) for ${patchData.version}. Retrying in ${backoff / 1000}s...`);
            await new Promise(resolve => setTimeout(resolve, backoff));
            return generateMetaAnalysis(patchData, previousAnalysis, retries - 1, backoff * 2);
        }
        console.error(`[LLM] Meta Analysis failed for ${patchData.version}:`, error.message || error);
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

async function updateDatabase(patchId: number, analysis: any) {
    const data = {
        metaShifts: analysis.metaShifts || [],
        synergisticWinners: analysis.synergisticWinners || [],
        synergisticLosers: analysis.synergisticLosers || [],
        roleSpecificWinners: analysis.roleSpecificWinners || {},
        roleSpecificLosers: analysis.roleSpecificLosers || {}
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
        
        const analysis = await generateMetaAnalysis(data, previousAnalysis);
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

            // Delay to respect rate limits
            await new Promise(resolve => setTimeout(resolve, 15000));
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
