// apps/scripts/checkPatches.ts

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    const patches = await prisma.patch.findMany({
        orderBy: { version: 'asc' }
    });

    console.log(`Total Patches in DB: ${patches.length}`);
    console.table(patches.map(p => ({
        version: p.version,
        releaseDate: p.releaseDate ? p.releaseDate.toISOString().split('T')[0] : 'MISSING'
    })));
}

main().catch(console.error).finally(() => prisma.$disconnect());
