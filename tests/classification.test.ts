// tests/classification.test.ts

import { test } from "node:test";
import * as assert from "node:assert";
import { determineClassification, loadOntologies } from "../apps/scripts/classifyPatches";

test("Semantic Polarity Override Matching (Bloodrage Magic Stick Buff)", async () => {
    await loadOntologies();

    // Bloodrage change: "no longer procs magic stick or its upgrades"
    const change = {
        changeType: "MODIFICATION",
        metric: null,
        rawNote: "Bloodrage: no longer procs magic stick or its upgrades"
    };

    const classification = determineClassification(change);
    
    assert.strictEqual(classification.classificationType, "Buff");
    assert.strictEqual(classification.state, "KNOWN_SEMANTIC");
    assert.strictEqual(classification.semanticTag, "MAGIC_STICK_INTERACTION");
});

test("Human/Manual Classification Override Matching", async () => {
    await loadOntologies();

    const change = {
        entityName: "Bloodseeker",
        changeType: "MODIFICATION",
        metric: null,
        rawNote: "Bloodrage: no longer procs magic stick or its upgrades"
    };

    const classification = determineClassification(change);
    
    assert.strictEqual(classification.classificationType, "Buff");
    assert.strictEqual(classification.state, "KNOWN_SEMANTIC");
    assert.strictEqual(classification.semanticTag, "MANUAL_OVERRIDE");
});
