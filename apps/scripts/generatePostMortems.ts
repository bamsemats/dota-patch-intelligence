// apps/scripts/generatePostMortems.ts

import { readFile, writeFile, readdir } from "node:fs/promises";
import * as path from "node:path";
import { GoogleGenAI, Type } from "@google/genai";

require('dotenv').config();

const RESEARCH_DIR = path.resolve("research-output");
const META_DIR = path.join(RESEARCH_DIR, "meta-analysis");
const CLASSIFIED_DIR = path.join(RESEARCH_DIR, "classified-patches");
const CALIBRATION_DIR = path.join(RESEARCH_DIR, "calibration-data");

const hasApiKey = !!process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;

if (!hasApiKey) {
    console.warn("[Warning] GEMINI_API_KEY is not set. Running in MOCK mode.");
} else {
    ai = new GoogleGenAI({});
}

const SYSTEM_PROMPT = `You are a world-class Dota 2 analyst and coach.
Your task is to write a post-mortem explanation for a failed patch prediction.
You will be given the hero name, what we predicted (UP or DOWN), the actual winrate delta, and the list of changes they received.
You will also be given the context of other major changes in the patch (highly buffed or nerfed heroes/items).

Analyze the data and provide a concise 1-2 sentence tactical explanation of why this hero's winrate went in the opposite direction of the prediction (e.g. why their winrate fell despite buffs, or rose despite nerfs).
Keep it highly analytical, using strategic Dota concepts like counter-meta picks, XP/gold tempo, item interactions, or relative power shifts.`;

const responseSchema = {
    type: Type.OBJECT,
    properties: {
        postMortem: {
            type: Type.STRING,
            description: "A 1-2 sentence strategic retrospective explaining why this hero's winrate moved contrary to the prediction."
        }
    },
    required: ["postMortem"]
};

async function generatePostMortemText(
    heroName: string,
    prediction: "UP" | "DOWN",
    delta: string,
    changes: string[],
    patchContext: string
): Promise<string> {
    if (!ai) {
        return `[MOCK] ${heroName}'s winrate went the opposite way (${delta}) because of indirect item changes and popular counter-picks in the meta.`;
    }

    const prompt = `
Hero: ${heroName}
Prediction: ${prediction}
Actual Winrate Delta: ${delta}
Hero Patch Changes:
${changes.join("\n")}

Patch Context (Other major shifts):
${patchContext}

Write the post-mortem explanation.`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                systemInstruction: SYSTEM_PROMPT,
                responseMimeType: "application/json",
                responseSchema: responseSchema,
                temperature: 0.2
            }
        });

        if (response.text) {
            const parsed = JSON.parse(response.text);
            return parsed.postMortem || "";
        }
        return "";
    } catch (e: any) {
        console.error(`[Post-Mortem] LLM failed for ${heroName}:`, e.message);
        return "";
    }
}

async function main() {
    console.log("=========================================");
    console.log("   Automatic Post-Mortem Generator       ");
    console.log("=========================================\n");

    const files = await readdir(META_DIR);
    const metaFiles = files
        .filter(f => f.startsWith("meta-") && f.endsWith(".json"))
        .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));

    for (const file of metaFiles) {
        const version = file.replace("meta-", "").replace(".json", "");
        console.log(`[Post-Mortem] Processing patch ${version}...`);

        const metaPath = path.join(META_DIR, file);
        const meta = JSON.parse(await readFile(metaPath, "utf8"));

        const classifiedPath = path.join(CLASSIFIED_DIR, `${version}.json`);
        let classified: any = null;
        try {
            classified = JSON.parse(await readFile(classifiedPath, "utf8"));
        } catch (e) {
            console.log(`[Post-Mortem] Classified patches missing for ${version}. Skipping.`);
            continue;
        }

        // Build some patch context to feed to LLM
        const itemBuffs = (classified.changes || [])
            .filter((c: any) => (c.category === "item" || c.category === "neutral") && c.classification?.classificationType === "Buff")
            .slice(0, 10)
            .map((c: any) => c.entityName)
            .join(", ");
        const itemNerfs = (classified.changes || [])
            .filter((c: any) => (c.category === "item" || c.category === "neutral") && c.classification?.classificationType === "Nerf")
            .slice(0, 10)
            .map((c: any) => c.entityName)
            .join(", ");
        const generalChanges = (classified.changes || [])
            .filter((c: any) => c.category === "general")
            .slice(0, 5)
            .map((c: any) => c.rawNote)
            .join("\n");
        const patchContext = `Item Buffs: ${itemBuffs || "None"}\nItem Nerfs: ${itemNerfs || "None"}\nSystem Changes:\n${generalChanges || "None"}`;

        const updateDetails = async (list: any[], heroNameKey: string, predDirection: "UP" | "DOWN") => {
            for (const item of list) {
                const name = item[heroNameKey];
                if (item.isCorrectPrediction === false && !item.postMortem) {
                    const heroChanges = (classified.changes || [])
                        .filter((c: any) => c.category === "hero" && c.entityName === name)
                        .map((c: any) => c.rawNote);

                    console.log(`[Post-Mortem] Generating retro for ${name} (${item.actualDelta})...`);
                    const explanation = await generatePostMortemText(
                        name,
                        predDirection,
                        item.actualDelta || "0%",
                        heroChanges,
                        patchContext
                    );
                    if (explanation) {
                        item.postMortem = explanation;
                    }
                }
            }
        };

        if (meta.synergisticWinners) await updateDetails(meta.synergisticWinners, 'entity', 'UP');
        if (meta.synergisticLosers) await updateDetails(meta.synergisticLosers, 'entity', 'DOWN');

        const roles = ["Carry", "Mid", "Offlane", "SoftSupport", "HardSupport"];
        for (const role of roles) {
            if (meta.roleSpecificWinners?.[role]) {
                await updateDetails(meta.roleSpecificWinners[role], 'hero', 'UP');
            }
            if (meta.roleSpecificLosers?.[role]) {
                await updateDetails(meta.roleSpecificLosers[role], 'hero', 'DOWN');
            }
        }

        await writeFile(metaPath, JSON.stringify(meta, null, 2), "utf8");
    }

    console.log("\n🎉 Post-mortems generated successfully.");
}

main().catch(console.error);
