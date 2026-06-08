// apps/scripts/analyzePatch.ts

import { readFile, readdir, mkdir, writeFile } from "node:fs/promises";
import * as path from "node:path";

const INPUT_DIR = path.resolve("research-output", "classified-patches");
const OUTPUT_DIR = path.resolve("research-output", "analytics");

interface HeroAnalysis {
    heroName: string;
    buffs: number;
    nerfs: number;
    reworks: number;
    adjustments: number;
    netScore: number; // Buffs - Nerfs
    totalChanges: number;
}

interface ItemAnalysis {
    itemName: string;
    buffs: number;
    nerfs: number;
    reworks: number;
    adjustments: number;
    netScore: number;
    totalChanges: number;
}

interface PatchAnalysis {
    version: string;
    totalChanges: number;
    classificationSummary: {
        buffs: number;
        nerfs: number;
        reworks: number;
        adjustments: number;
    };
    biggestWinners: HeroAnalysis[];
    biggestLosers: HeroAnalysis[];
    mostChangedHeroes: HeroAnalysis[];
    itemSummary: {
        mostBuffed: ItemAnalysis[];
        mostNerfed: ItemAnalysis[];
    };
}

async function analyzeFile(filePath: string): Promise<PatchAnalysis> {
    const data = JSON.parse(await readFile(filePath, "utf8"));
    const version = data.version;

    const summary = { buffs: 0, nerfs: 0, reworks: 0, adjustments: 0 };
    const heroMap = new Map<string, HeroAnalysis>();
    const itemMap = new Map<string, ItemAnalysis>();

    for (const change of data.changes) {
        const type = change.classification.classificationType;
        
        if (type === "Buff") summary.buffs++;
        else if (type === "Nerf") summary.nerfs++;
        else if (type === "Rework") summary.reworks++;
        else summary.adjustments++;

        if (change.category === "hero") {
            const name = change.entityName;
            if (!heroMap.has(name)) {
                heroMap.set(name, { heroName: name, buffs: 0, nerfs: 0, reworks: 0, adjustments: 0, netScore: 0, totalChanges: 0 });
            }
            const stat = heroMap.get(name)!;
            stat.totalChanges++;
            if (type === "Buff") { stat.buffs++; stat.netScore++; }
            if (type === "Nerf") { stat.nerfs++; stat.netScore--; }
            if (type === "Rework") stat.reworks++;
            if (type === "Adjustment") stat.adjustments++;
        }

        if (change.category === "item" || change.category === "neutral") {
            const name = change.entityName;
            if (!itemMap.has(name)) {
                itemMap.set(name, { itemName: name, buffs: 0, nerfs: 0, reworks: 0, adjustments: 0, netScore: 0, totalChanges: 0 });
            }
            const stat = itemMap.get(name)!;
            stat.totalChanges++;
            if (type === "Buff") { stat.buffs++; stat.netScore++; }
            if (type === "Nerf") { stat.nerfs++; stat.netScore--; }
            if (type === "Rework") stat.reworks++;
            if (type === "Adjustment") stat.adjustments++;
        }
    }

    const heroes = Array.from(heroMap.values());
    const items = Array.from(itemMap.values());

    // Sort to find winners, losers, and most changed
    const biggestWinners = [...heroes].sort((a, b) => b.netScore - a.netScore).slice(0, 5);
    const biggestLosers = [...heroes].sort((a, b) => a.netScore - b.netScore).slice(0, 5);
    const mostChangedHeroes = [...heroes].sort((a, b) => b.totalChanges - a.totalChanges).slice(0, 5);

    const mostBuffedItems = [...items].sort((a, b) => b.netScore - a.netScore).slice(0, 3);
    const mostNerfedItems = [...items].sort((a, b) => a.netScore - b.netScore).slice(0, 3);

    return {
        version,
        totalChanges: data.changes.length,
        classificationSummary: summary,
        biggestWinners,
        biggestLosers,
        mostChangedHeroes,
        itemSummary: {
            mostBuffed: mostBuffedItems,
            mostNerfed: mostNerfedItems
        }
    };
}

async function main() {
    await mkdir(OUTPUT_DIR, { recursive: true });
    
    // Default to the latest patch or allow passing a version via args
    const targetVersion = process.argv[2]; 
    const files = await readdir(INPUT_DIR);
    
    let fileToProcess = files.find(f => f === `${targetVersion}.json`);
    
    // If no specific version provided, just analyze the latest one (lexicographical sort)
    if (!fileToProcess && !targetVersion) {
        fileToProcess = files.sort((a, b) => b.localeCompare(a))[0];
    }

    if (!fileToProcess) {
        console.error(`[Analytics] Could not find classified data for patch.`);
        process.exit(1);
    }

    console.log(`[Analytics] Analyzing patch ${fileToProcess}...`);
    
    const analysis = await analyzeFile(path.join(INPUT_DIR, fileToProcess));
    
    await writeFile(
        path.join(OUTPUT_DIR, `analysis-${analysis.version}.json`),
        JSON.stringify(analysis, null, 2),
        "utf8"
    );

    console.log(`\n=== Patch ${analysis.version} Summary ===`);
    console.log(`Total Changes: ${analysis.totalChanges}`);
    console.log(`Buffs: ${analysis.classificationSummary.buffs} | Nerfs: ${analysis.classificationSummary.nerfs} | Reworks: ${analysis.classificationSummary.reworks} | Adjustments: ${analysis.classificationSummary.adjustments}`);
    
    console.log(`\n=== Biggest Winners (Net Buffs) ===`);
    analysis.biggestWinners.forEach(h => console.log(`${h.heroName}: +${h.netScore} (Buffs: ${h.buffs}, Nerfs: ${h.nerfs})`));

    console.log(`\n=== Biggest Losers (Net Nerfs) ===`);
    analysis.biggestLosers.forEach(h => console.log(`${h.heroName}: ${h.netScore} (Buffs: ${h.buffs}, Nerfs: ${h.nerfs})`));

    console.log(`\n=== Most Changed Heroes ===`);
    analysis.mostChangedHeroes.forEach(h => console.log(`${h.heroName}: ${h.totalChanges} changes`));
}

main().catch(console.error);