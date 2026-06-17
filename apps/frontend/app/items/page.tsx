import { promises as fs } from "node:fs";
import path from "node:path";
import Link from "next/link";
import styles from "../components/EntityList.module.css";

const researchDir = path.resolve(process.cwd(), "../../research-output");
const mappingsDir = path.join(researchDir, "mappings");
const categoryPath = path.join(mappingsDir, "item_categories.json");

export async function generateMetadata() {
  return {
    title: "All Items - Dota Patch Intelligence",
    description: "Browse the full roster of Dota 2 items, categorized by type and tier.",
  };
}

export default async function ItemsPage() {
  // 1. Load the curated categories
  let categories: Record<string, Record<string, string[]>> = {};
  try {
    const rawCategories = await fs.readFile(categoryPath, "utf-8");
    categories = JSON.parse(rawCategories);
  } catch (e) {
    console.error("Could not load item categories.");
    return <div className="container">Error: Curated item list not found.</div>;
  }

  const getItemImageUrl = (name: string) => {
    let slug = name.replace(/ /g, '_').replace(/[^a-zA-Z0-9_]/g, '').toLowerCase();
    if (slug === "aghanims_scepter") slug = "ultimate_scepter";
    if (slug === "aghanims_shard") slug = "aghanims_shard";
    if (slug === "town_portal_scroll") slug = "tpscroll";
    if (slug === "boots_of_speed") slug = "boots";
    if (slug === "boots_of_travel") slug = "travel_boots";
    if (slug === "boots_of_travel_2") slug = "travel_boots_2";
    if (slug === "gem_of_true_sight") slug = "gem";
    if (slug === "observer_ward") slug = "ward_observer";
    if (slug === "sentry_ward") slug = "ward_sentry";
    if (slug === "tango") slug = "tango";
    if (slug === "clarity") slug = "clarity";
    if (slug === "healing_salve") slug = "flask";
    if (slug === "smoke_of_deceit") slug = "smoke_of_deceit";
    if (slug === "dust_of_appearance") slug = "dust";
    if (slug === "bottle") slug = "bottle";
    if (slug === "animal_courier") slug = "courier";
    if (slug === "flying_courier") slug = "flying_courier";
    if (slug === "shadow_amulet") slug = "shadow_amulet";
    if (slug === "magic_stick") slug = "magic_stick";
    if (slug === "magic_wand") slug = "magic_wand";
    if (slug === "manta_style") slug = "manta";
    if (slug === "gunpowder_gauntlet") slug = "gunpowder_gauntlets";

    // Neutral Enhancements (ISSUE-20 Fix)
    if (slug.endsWith("_enhancement")) {
      slug = `enhancement_${slug.replace("_enhancement", "")}`;
    }

    return `https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/items/${slug}.png`;
  };

  return (
    <div className="container">
      <div style={{ marginBottom: '60px' }}>
        <h1 style={{ color: "var(--color-artifact)", margin: 0, fontSize: "clamp(2rem, 5vw, 3rem)" }}>
          Items Roster
        </h1>
        <p style={{ color: '#888', fontSize: '1.2rem' }}>Comprehensive catalog of Dota 2 equipment and balance trajectories.</p>
      </div>

      {Object.entries(categories).map(([mainGroup, subGroups]) => (
        <div key={mainGroup} style={{ marginBottom: '80px' }}>
          <h2 style={{ 
            color: "var(--color-rare)", 
            fontSize: "2rem", 
            borderBottom: "2px solid var(--color-rare)", 
            paddingBottom: "10px",
            marginBottom: "30px",
            textTransform: "uppercase",
            letterSpacing: "2px"
          }}>
            {mainGroup}
          </h2>

          {Object.entries(subGroups).map(([subGroup, items]) => (
            <div key={subGroup} style={{ marginBottom: '40px' }}>
              <h3 style={{ 
                color: "var(--color-epic)", 
                fontSize: "1.4rem", 
                marginBottom: "20px",
                paddingLeft: "10px",
                borderLeft: "4px solid var(--color-epic)"
              }}>
                {subGroup}
              </h3>
              
              <div className={styles.grid}>
                {items.map((name) => {
                  const safeName = name.toLowerCase()
                    .replace(/[^a-z0-9]+/g, '_')
                    .replace(/^_+|_+$/g, '');

                  return (
                    <Link 
                      href={`/item/${safeName}`}

                      key={name} 
                      className={`${styles.card} ${styles.clickable}`}
                      style={{ minHeight: '120px', textDecoration: 'none', color: 'inherit' }}
                    >
                      <div className={styles.heroImageWrapper}>
                        <img 
                          src={getItemImageUrl(name)} 
                          alt="" 
                          className={styles.itemImage} 
                        />
                      </div>

                      <div className={styles.cardHeader} style={{ borderBottom: 'none' }}>
                        <h4 className={styles.itemName} style={{ fontSize: '1.2rem', zIndex: 1 }}>{name}</h4>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
