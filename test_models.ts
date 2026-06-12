
import Anthropic from "@anthropic-ai/sdk";
require('dotenv').config();

async function test() {
    const key = process.env.CLAUDE_API_KEY;
    const anthropic = new Anthropic({
        apiKey: key,
    });

    try {
        console.log("Attempting to list models...");
        // @ts-ignore
        const list = await anthropic.models.list();
        console.log("Models:", JSON.stringify(list, null, 2));
    } catch (e: any) {
        console.log(`Failed to list models: ${e.status} ${e.message}`);
    }
}

test();
