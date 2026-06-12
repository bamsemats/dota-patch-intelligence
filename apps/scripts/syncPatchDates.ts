// apps/scripts/syncPatchDates.ts

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const PATCH_DATES: Record<string, string> = {
    "7.41d": "2026-06-04",
    "7.41c": "2026-05-06",
    "7.41b": "2026-04-07",
    "7.41a": "2026-03-28",
    "7.41": "2026-03-24",
    "7.40c": "2026-01-21",
    "7.40b": "2025-12-23",
    "7.40": "2025-12-15",
    "7.39e": "2025-10-02",
    "7.39d": "2025-08-05",
    "7.39c": "2025-06-24",
    "7.39b": "2025-05-29",
    "7.39": "2025-05-21",
    "7.38c": "2025-03-27",
    "7.38b": "2025-03-05",
    "7.38": "2025-02-19",
    "7.37e": "2024-11-19",
    "7.37d": "2024-10-24",
    "7.37c": "2024-09-27",
    "7.37b": "2024-08-29",
    "7.37": "2024-08-14",
    "7.36c": "2024-07-31",
    "7.36b": "2024-06-20",
    "7.36a": "2024-05-23",
    "7.36": "2024-05-22",
    "7.35d": "2024-03-22",
    "7.35c": "2024-02-22",
    "7.35b": "2024-01-22",
    "7.35": "2023-12-14",
    "7.34e": "2023-11-20",
    "7.34d": "2023-10-09",
    "7.34c": "2023-09-29",
    "7.34b": "2023-08-18",
    "7.34": "2023-08-08",
    "7.33e": "2023-07-14",
    "7.33d": "2023-06-28",
    "7.33c": "2023-05-30",
    "7.33b": "2023-04-27"
};

async function main() {
    console.log("=========================================");
    console.log("   Syncing Patch Release Dates           ");
    console.log("=========================================\n");

    for (const [version, dateStr] of Object.entries(PATCH_DATES)) {
        const releaseDate = new Date(dateStr);
        
        try {
            const patch = await prisma.patch.upsert({
                where: { version },
                update: { releaseDate },
                create: { version, releaseDate }
            });
            console.log(`✔️  Synced ${version}: ${dateStr}`);
        } catch (error: any) {
            console.error(`❌ Failed to sync ${version}:`, error.message);
        }
    }

    console.log("\n🎉 Patch release dates sync completed.");
}

main()
    .catch(console.error)
    .finally(async () => {
        await prisma.$disconnect();
    });
