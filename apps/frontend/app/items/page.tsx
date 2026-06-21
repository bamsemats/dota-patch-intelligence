import { promises as fs } from "node:fs";
import path from "node:path";
import Link from "next/link";
import styles from "../components/EntityList.module.css";

const researchDir = path.resolve(process.cwd(), "../../research-output");
const mappingsDir = path.join(researchDir, "mappings");
const historyDir = path.join(researchDir, "item-history");
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

  // 2. Load Item Slugs from global mapping
  let itemSlugs: Record<string, string> = {};
  try {
      const rawSlugs = await fs.readFile(path.join(mappingsDir, "item_slugs.json"), "utf-8");
      itemSlugs = JSON.parse(rawSlugs);
  } catch(e) {
      console.warn("Could not load item slugs mapping.");
  }

  const getItemImageUrl = (name: string) => {
    let slug = itemSlugs[name];
    
    if (!slug) {
        slug = name.replace(/ /g, '_').replace(/[^a-zA-Z0-9_]/g, '').toLowerCase();
        // ... same fallback logic as before
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
