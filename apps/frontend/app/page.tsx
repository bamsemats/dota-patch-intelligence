import Page from "./patch/[version]/page";
import { getLocalPatches } from "./lib/localData";

const API_BASE = process.env.API_URL || "http://localhost:8080";

export default async function Home() {
  let latestPatch = "7.41d"; 
  
  try {
    const res = await fetch(`${API_BASE}/api/patches`);
    if (res.ok) {
      const patches = await res.json();
      if (patches.length > 0) {
        latestPatch = patches[0].version;
      }
    } else {
      throw new Error();
    }
  } catch (error) {
    console.warn("API unavailable for Home, falling back to local files.");
    const patches = await getLocalPatches();
    if (patches.length > 0) {
      latestPatch = patches[patches.length - 1]; // sorted asc by default
    }
  }

  // Re-use the dynamic page component to render the latest patch at the root
  return <Page params={Promise.resolve({ version: latestPatch })} />;
}
