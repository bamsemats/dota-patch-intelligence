// tests/counters.test.ts

import { test } from "node:test";
import * as assert from "node:assert";
import { processPatch } from "../apps/scripts/calculateVectors";

test("Counters and Synergy Ripple Propagation", async () => {
    // Mock balance ontology
    const balanceOntology = {
        metrics: {
            "armor": {
                affects: ["physical_survivability"],
                weights: { Divine: 8 }
            }
        },
        rippleCoefficients: {
            counter: -0.2,
            partner: 0.1
        }
    };

    // Mock patch data: Axe receives a major armor buff (Buff, weight 8)
    const mockPatchFile = {
        version: "TestPatch",
        changes: [
            {
                category: "hero",
                entityName: "Axe",
                changeType: "MODIFICATION",
                metric: "armor",
                classification: {
                    state: "NUMERIC",
                    classificationType: "Buff",
                    strategicWeight: { Divine: 8 }
                }
            }
        ]
    };

    // Save temporary patch file
    const fs = require("node:fs/promises");
    const path = require("node:path");
    const tempDir = path.resolve("scratch");
    await fs.mkdir(tempDir, { recursive: true });
    const tempPath = path.join(tempDir, "test_patch.json");
    await fs.writeFile(tempPath, JSON.stringify(mockPatchFile), "utf8");

    // Mock heroes list and counters map
    // Anti-Mage is countered by Axe
    const heroesList = ["Anti-Mage", "Axe"];
    const countersMap = {
        "Anti-Mage": {
            counters: ["Axe"],
            partners: []
        }
    };

    try {
        const result = await processPatch(tempPath, balanceOntology, heroesList, countersMap, {});
        
        // Find Anti-Mage's delta in result
        const amDelta = result.vectorDeltas.find(d => d.heroName === "Anti-Mage");
        const axeDelta = result.vectorDeltas.find(d => d.heroName === "Axe");

        // Axe should have direct positive survivability (armor buff)
        assert.ok(axeDelta && axeDelta.vectorDelta.survivability > 0, "Axe should have direct positive survivability");

        // Anti-Mage should have negative survivability and laning due to Axe (counter) being buffed
        // Direct score of Axe is 8 (armor weight). Ripple = 8 * (-0.2) = -1.6.
        // Survivability gets 0.5 * ripple = -0.8.
        // Laning gets 0.5 * ripple = -0.8.
        assert.ok(amDelta, "Anti-Mage should have a delta due to ripple effect");
        assert.strictEqual(amDelta!.vectorDelta.survivability, -0.8);
        assert.strictEqual(amDelta!.vectorDelta.laning, -0.8);

    } finally {
        await fs.unlink(tempPath).catch(() => {});
    }
});

test("Item Hero Affinity Ripple Propagation", async () => {
    const balanceOntology = {
        metrics: {
            "armor": {
                affects: ["physical_survivability"],
                weights: { Divine: 8 }
            }
        }
    };

    // Magic Stick receives a major armor buff (Buff, weight 8)
    const mockPatchFile = {
        version: "TestPatch",
        changes: [
            {
                category: "item",
                entityName: "Magic Stick",
                changeType: "MODIFICATION",
                metric: "armor",
                classification: {
                    state: "NUMERIC",
                    classificationType: "Buff",
                    strategicWeight: { Divine: 8 }
                }
            }
        ]
    };

    const fs = require("node:fs/promises");
    const path = require("node:path");
    const tempDir = path.resolve("scratch");
    await fs.mkdir(tempDir, { recursive: true });
    const tempPath = path.join(tempDir, "test_patch_affinity.json");
    await fs.writeFile(tempPath, JSON.stringify(mockPatchFile), "utf8");

    const heroesList = ["Anti-Mage", "Bloodseeker"];
    const countersMap = {};
    const affinityMap = {
        "Magic Stick": ["Bloodseeker"]
    };

    try {
        const result = await processPatch(tempPath, balanceOntology, heroesList, countersMap, affinityMap);
        
        const bsDelta = result.vectorDeltas.find(d => d.heroName === "Bloodseeker");
        const amDelta = result.vectorDeltas.find(d => d.heroName === "Anti-Mage");

        // Anti-Mage does not buy Magic Stick, so should have no delta
        assert.ok(!amDelta, "Anti-Mage should have no delta");

        // Bloodseeker buys Magic Stick, so should receive 20% of its delta (8 * 0.2 = 1.6)
        assert.ok(bsDelta, "Bloodseeker should have a delta due to item affinity ripple");
        assert.strictEqual(bsDelta!.vectorDelta.survivability, 1.6);

    } finally {
        await fs.unlink(tempPath).catch(() => {});
    }
});
