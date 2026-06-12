import Link from "next/link";
import PatchSelector from "../../components/PatchSelector";
import SummaryTabs from "./SummaryTabs";
import { getLocalPatches, getLocalMeta } from "../../lib/localData";

interface PageProps {
  params: Promise<{ version: string }>;
}

const API_BASE = process.env.API_URL || "http://localhost:8080";

export async function generateStaticParams() {
  try {
    const res = await fetch(`${API_BASE}/api/patches`);
    if (!res.ok) throw new Error("API not ok");
    const patches = await res.json();
    return patches.map((p: any) => ({
      version: p.version,
    }));
  } catch (error) {
    console.warn("API unavailable for generateStaticParams, falling back to local files.");
    const patches = await getLocalPatches();
    return patches.map((v) => ({ version: v }));
  }
}

export async function generateMetadata({ params }: PageProps) {
  const { version: patchVersion } = await params;
  const title = `Dota 2 Patch ${patchVersion} Strategic Summary`;
  const description = `Read the contextual impact analysis and synergistic meta shifts for Dota 2 patch ${patchVersion}. Discover the biggest winners and losers in this patch.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "article",
      siteName: "Dota Patch Intelligence",
      images: [
        {
          url: "/api/og?title=" + encodeURIComponent(`Patch ${patchVersion}`), 
          width: 1200,
          height: 630,
          alt: `Dota 2 Patch ${patchVersion} Summary`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function Page({ params }: PageProps) {
  const { version: patchVersion } = await params;
  
  let availablePatches: string[] = [];
  try {
    const res = await fetch(`${API_BASE}/api/patches`);
    if (res.ok) {
      const patches = await res.json();
      availablePatches = patches.map((p: any) => p.version);
    } else {
      throw new Error();
    }
  } catch (e) {
    availablePatches = await getLocalPatches();
    availablePatches.reverse(); // desc for dropdown
  }

  let metaData = null;
  try {
    const res = await fetch(`${API_BASE}/api/patches/${patchVersion}/meta`);
    if (res.ok) {
      metaData = await res.json();
    } else {
      throw new Error();
    }
  } catch (e) {
    metaData = await getLocalMeta(patchVersion);
  }

  return (
    <div className="container">
      <div style={{ display: 'flex', gap: '20px', alignItems: 'center', marginBottom: '10px' }}>
         <Link href="/" style={{ color: 'var(--color-artifact)', textDecoration: 'none' }}>← Home</Link>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '20px' }}>
        <h1 style={{ color: "var(--color-artifact)", margin: 0, fontSize: "2.5rem" }}>
          Patch {patchVersion} Intelligence
        </h1>
        
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
          <PatchSelector availablePatches={availablePatches} currentPatch={patchVersion} />
        </div>
      </div>

      <p style={{ color: '#888', marginBottom: '40px' }}>
        Strategic summary and impact analysis for patch {patchVersion}.
      </p>

      {metaData ? (
        <SummaryTabs metaData={metaData} />
      ) : (
        <p>No strategic meta analysis available for this patch yet.</p>
      )}
    </div>
  );
}
