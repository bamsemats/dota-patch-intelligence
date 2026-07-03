// tests/vectors.test.ts

import { test } from "node:test";
import * as assert from "node:assert";
import { calculateHeroDelta, loadBalanceOntology } from "../apps/scripts/calculateVectors";

test("Feature Vector Delta Mapping (Armor Buff)", async () => {
    const balanceOntology = await loadBalanceOntology();

    // Mock change: Armor buff
    const changes = [
        {
            category: "hero",
            entityName: "Axe",
            changeType: "MODIFICATION",
            metric: "armor",
            classification: {
                state: "NUMERIC",
                classificationType: "Buff",
                strategicWeight: {
                    Divine: 8
                }
            }
        }
    ];

    const result = calculateHeroDelta("Axe", changes, balanceOntology);
    
    // Armor affects physical_survivability (mapped to survivability) and lane_trading (mapped to laning)
    assert.strictEqual(result.heroName, "Axe");
    assert.ok(result.vectorDelta.survivability > 0, "Survivability should have increased");
    assert.ok(result.vectorDelta.laning > 0, "Laning should have increased");
    assert.strictEqual(result.vectorDelta.farming, 0, "Farming should not have changed");
});
