// scripts/inspectSteamNews.ts

import { mkdir, writeFile } from "node:fs/promises";
import * as path from "node:path";

interface SteamNewsItem {
    gid: string;
    title: string;
    url: string;
    is_external_url: boolean;
    author: string;
    contents: string;
    feedlabel: string;
    date: number;
    feedname: string;
    feed_type: number;
    appid: number;
}

interface SteamNewsResponse {
    appnews: {
        appid: number;
        newsitems: SteamNewsItem[];
        count: number;
    };
}

const DOTA_APP_ID = 570;
const NEWS_COUNT = 100;

async function fetchSteamNews(): Promise<SteamNewsItem[]> {
    const url =
        `https://api.steampowered.com/ISteamNews/GetNewsForApp/v2/` +
        `?appid=${DOTA_APP_ID}` +
        `&count=${NEWS_COUNT}` +
        `&maxlength=50000` +
        `&format=json`;

    console.log(`Fetching Steam news...`);

    const response = await fetch(url);

    if (!response.ok) {
        throw new Error(
            `Steam request failed: ${response.status} ${response.statusText}`
        );
    }

    const data: SteamNewsResponse = await response.json();

    return data.appnews.newsitems;
}

function looksLikePatch(title: string): boolean {
    const normalized = title.toLowerCase();

    return (
        normalized.includes("patch") ||
        normalized.includes("gameplay update") ||
        normalized.match(/\d+\.\d+/) !== null
    );
}

function extractPatchVersion(title: string): string | null {
    const match = title.match(/\b\d+\.\d+[a-z]?\b/);
    return match ? match[0] : null;
}

function getCanonicalPatchUrl(version: string): string {
    return `https://www.dota2.com/patches/${version}`;
}

async function saveRawData(newsItems: SteamNewsItem[]) {
    const outputDir = path.resolve("research-output");

    await mkdir(outputDir, {
        recursive: true,
    });

    await writeFile(
        path.join(outputDir, "steam-news.json"),
        JSON.stringify(newsItems, null, 2),
        "utf8"
    );

    console.log(
        `Saved raw JSON to research-output/steam-news.json`
    );
}

function printSummary(newsItems: SteamNewsItem[]) {
    console.log("");
    console.log("=== ALL NEWS POSTS ===");
    console.log("");

    for (const item of newsItems) {
        const date = new Date(item.date * 1000);

        console.log(
            `[${date.toISOString().split("T")[0]}] ${item.title}`
        );
    }

    console.log("");
    console.log("=== POSSIBLE PATCH NOTES ===");
    console.log("");

    const patchCandidates = newsItems.filter((item) =>
        looksLikePatch(item.title)
    );

    for (const patch of patchCandidates) {
        const date = new Date(patch.date * 1000);

        console.log("----------------------------------");
        console.log(`Date: ${date.toISOString()}`);
        console.log(`Title: ${patch.title}`);
        console.log(`URL: ${patch.url}`);
        console.log(`Content Length: ${patch.contents.length}`);
        console.log("");

        console.log(
            patch.contents.substring(0, 500).replace(/\n/g, " ")
        );

        console.log("");
    }

    console.log(
        `Found ${patchCandidates.length} possible patch entries.`
    );
}

async function main() {
    const newsItems = await fetchSteamNews();

    newsItems.filter((item) => {
        if (!looksLikePatch(item.title)) return;
        const version = extractPatchVersion(item.title);
        if (version === null) return;
        console.log({
            title: item.title,
            version,
            steamUrl: item.url,
            canonicalUrl: getCanonicalPatchUrl(version)
        });
    })

    console.log(
        `Fetched ${newsItems.length} news items.`
    );

    await saveRawData(newsItems);

    printSummary(newsItems);
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});