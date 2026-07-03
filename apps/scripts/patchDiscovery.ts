// apps/scripts/patchDiscovery.ts

import { mkdir, writeFile, access } from "node:fs/promises";
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

interface PatchDiscoveryResult {
    version: string;
    steamTitle: string;
    steamUrl: string;
    canonicalUrl: string;
    confidence: number;
    isValidCanonical: boolean;
    discoveryDate: string;
    author: string;
    feedLabel: string;
}

const DOTA_APP_ID = 570;
const NEWS_FETCH_LIMIT = 100;
const OUTPUT_DIR = path.resolve("research-output", "patches");

async function fetchSteamNews(endDate?: number): Promise<SteamNewsItem[]> {
    let url =
        `https://api.steampowered.com/ISteamNews/GetNewsForApp/v2/` +
        `?appid=${DOTA_APP_ID}` +
        `&count=${NEWS_FETCH_LIMIT}` +
        `&maxlength=50000` +
        `&format=json`;
    
    if (endDate) {
        url += `&enddate=${endDate}`;
    }

    console.log(`[Discovery] Fetching Steam news${endDate ? ' before ' + new Date(endDate * 1000).toISOString() : ''}...`);

    const response = await fetch(url);

    if (!response.ok) {
        throw new Error(
            `Steam request failed: ${response.status} ${response.statusText}`
        );
    }

    const data: SteamNewsResponse = await response.json();
    return data.appnews.newsitems;
}

function calculateConfidence(item: SteamNewsItem): { confidence: number; version: string | null } {
    let confidence = 0;
    const title = item.title;
    const normalizedTitle = title.toLowerCase();

    // 1. Feed Label Check
    if (item.feedlabel === "Community Announcements") confidence += 40;
    if (item.feedlabel === "Product Update") confidence += 50;

    // 2. Title patterns (Highly specific to official updates)
    if (normalizedTitle.includes("gameplay patch")) confidence += 40;
    if (normalizedTitle.includes("gameplay update")) confidence += 40;
    if (normalizedTitle.includes("update") && normalizedTitle.includes("is here")) confidence += 30;

    // 3. Penalty for known editorial sources
    if (item.feedlabel === "PCGamesN") confidence -= 50;
    if (item.author.includes("@")) confidence -= 20; // Authors with emails are often external

    // 4. Version extraction
    const versionMatch = title.match(/\b\d+\.\d+[a-z]?\b/);
    const version = versionMatch ? versionMatch[0] : null;

    if (version) {
        confidence += 10;
    } else {
        confidence = 0; // No version, no patch
    }

    // Cap confidence
    confidence = Math.max(0, Math.min(100, confidence));

    return { confidence, version };
}

async function validateCanonicalUrl(version: string): Promise<{ isValid: boolean; finalUrl: string }> {
    const url = `https://www.dota2.com/patches/${version}`;
    try {
        const response = await fetch(url, { method: "HEAD" });
        return {
            isValid: response.ok,
            finalUrl: response.url
        };
    } catch (error) {
        console.error(`[Validation] Error validating ${url}:`, error);
        return { isValid: false, finalUrl: url };
    }
}

async function fetchPatchHtml(url: string): Promise<string | null> {
    try {
        const response = await fetch(url);
        if (!response.ok) return null;
        return await response.text();
    } catch (error) {
        console.error(`[Fetch] Error fetching HTML from ${url}:`, error);
        return null;
    }
}

async function fetchPatchJson(version: string): Promise<any | null> {
    const url = `https://www.dota2.com/datafeed/patchnotes?version=${version}&language=english`;
    try {
        const response = await fetch(url);
        if (!response.ok) return null;
        return await response.json();
    } catch (error) {
        console.error(`[Fetch] Error fetching JSON from ${url}:`, error);
        return null;
    }
}

async function savePatchArtifacts(result: PatchDiscoveryResult, html: string | null, json: any | null) {
    const patchDir = path.join(OUTPUT_DIR, result.version);
    await mkdir(patchDir, { recursive: true });

    await writeFile(
        path.join(patchDir, "metadata.json"),
        JSON.stringify(result, null, 2),
        "utf8"
    );

    if (html) {
        await writeFile(
            path.join(patchDir, "source.html"),
            html,
            "utf8"
        );
    }

    if (json) {
        await writeFile(
            path.join(patchDir, "data.json"),
            JSON.stringify(json, null, 2),
            "utf8"
        );
    }

    console.log(`[Storage] Saved artifacts for version ${result.version} in ${patchDir}`);
}

async function fileExists(filePath: string): Promise<boolean> {
    try {
        await access(filePath);
        return true;
    } catch {
        return false;
    }
}

async function main() {
    const results: PatchDiscoveryResult[] = [];
    const THREE_YEARS_MS = 3 * 365 * 24 * 60 * 60 * 1000;
    const targetStartDate = Date.now() - THREE_YEARS_MS;
    
    let currentEndDate: number | undefined = undefined;
    let keepFetching = true;
    let totalItemsAnalyzed = 0;

    console.log(`[Discovery] Initiating 3-year historical search (Target: ${new Date(targetStartDate).toISOString()})...`);

    while (keepFetching) {
        const newsItems = await fetchSteamNews(currentEndDate);
        if (newsItems.length === 0) break;

        totalItemsAnalyzed += newsItems.length;
        console.log(`[Discovery] Analyzing batch of ${newsItems.length} items (Total: ${totalItemsAnalyzed})...`);

        for (const item of newsItems) {
            const { confidence, version } = calculateConfidence(item);

            if (version && confidence > 40) {
                const classifiedPath = path.resolve("research-output", "classified-patches", `${version}.json`);

                if (await fileExists(classifiedPath)) {
                    // Update currentEndDate even if skipping
                    if (!currentEndDate || item.date < currentEndDate) {
                        currentEndDate = item.date - 1;
                    }
                    continue;
                }

                console.log(`[Candidate] Found: ${version} (Confidence: ${confidence}%) - ${item.title}`);
                const { isValid, finalUrl } = await validateCanonicalUrl(version);

                const result: PatchDiscoveryResult = {
                    version,
                    steamTitle: item.title,
                    steamUrl: item.url,
                    canonicalUrl: finalUrl,
                    confidence,
                    isValidCanonical: isValid,
                    discoveryDate: new Date(item.date * 1000).toISOString(),
                    author: item.author,
                    feedLabel: item.feedlabel
                };

                let html: string | null = null;
                let json: any | null = null;

                if (isValid) {
                    console.log(`[Fetch] Fetching artifacts for ${version}...`);
                    html = await fetchPatchHtml(finalUrl);
                    json = await fetchPatchJson(version);
                }

                await savePatchArtifacts(result, html, json);
                results.push(result);
            }

            // Update currentEndDate to the oldest item in the batch
            if (!currentEndDate || item.date < currentEndDate) {
                currentEndDate = item.date - 1;
            }
        }

        // Check if we've reached the target date
        if (currentEndDate && (currentEndDate * 1000) < targetStartDate) {
            console.log(`[Discovery] Reached target date: ${new Date(currentEndDate * 1000).toISOString()}`);
            keepFetching = false;
        }

        // Safety break to prevent infinite loops (approx 30 pages)
        if (totalItemsAnalyzed > 3000) {
            console.warn(`[Discovery] Safety limit reached (3000 items). Stopping.`);
            keepFetching = false;
        }
    }

    console.log(`\n[Summary] Discovered and processed ${results.length} new patch candidates across ${totalItemsAnalyzed} news items.`);
    
    // Output for automation pipeline
    if (results.length > 0) {
        // Sort by version so the newest is last
        results.sort((a, b) => a.version.localeCompare(b.version, undefined, { numeric: true, sensitivity: 'base' }));
        const newestVersion = results[results.length - 1].version;
        console.log(`NEW_PATCH=${newestVersion}`);
    }
}

main().catch((error) => {
    console.error(`[Error] Fatal error in patch discovery:`, error);
    process.exit(1);
});
