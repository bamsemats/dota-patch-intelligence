import Page from "./patch/[version]/page";

const API_BASE = process.env.API_URL || "http://localhost:8080";

export default async function Home() {
  let latestPatch = "7.41d"; // Fallback
  
  try {
    const res = await fetch(`${API_BASE}/api/patches`);
    if (res.ok) {
      const patches = await res.json();
      if (patches.length > 0) {
        latestPatch = patches[0].version;
      }
    }
  } catch (error) {
    console.error("Failed to fetch latest patch from API:", error);
  }

  // Re-use the dynamic page component to render the latest patch at the root
  return <Page params={Promise.resolve({ version: latestPatch })} />;
}
