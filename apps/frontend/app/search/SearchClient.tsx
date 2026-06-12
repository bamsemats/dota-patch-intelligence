"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import styles from "../components/EntityList.module.css";

interface SearchEntry {
  v: string; // version
  e: string; // entity
  s: string; // sub-entity
  c: string; // classification
  n: string; // note
  cat: string; // category
}

export default function SearchClient() {
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [results, setResults] = useState<SearchEntry[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchResults = async () => {
      if (query.length < 2) {
        setResults([]);
        return;
      }
      
      setLoading(true);
      try {
        // Use relative URL so it works in prod if reverse-proxied, 
        // or explicitly configure NEXT_PUBLIC_API_URL.
        // For static local build, we assume Fastify is on 8080 during dev,
        // but for static export it needs an absolute URL or proxy.
        // We'll hardcode localhost for this local stage of Phase 12.
        const res = await fetch(`http://localhost:8080/api/search?q=${encodeURIComponent(query)}`);
        if (res.ok) {
          const data = await res.json();
          setResults(data);
        }
      } catch (error) {
        console.error("Search failed:", error);
      } finally {
        setLoading(false);
      }
    };

    const debounceTimer = setTimeout(fetchResults, 300);
    return () => clearTimeout(debounceTimer);
  }, [query]);

  const filteredResults = results.filter(entry => {
    if (categoryFilter !== "all" && entry.cat !== categoryFilter) return false;
    return true;
  });

  return (
    <div>
      <div className={styles.controlsRow}>
        <div className={styles.searchContainer} style={{ maxWidth: 'none' }}>
          <input 
            type="text" 
            placeholder="Search for heroes, items, or mechanics (e.g. 'Armor', 'Movement Speed', 'Crystal Maiden')..." 
            className={styles.searchInput}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
        </div>
      </div>

      <div className={styles.controls} style={{ marginBottom: '30px' }}>
        <button 
          className={`${styles.filterBtn} ${categoryFilter === "all" ? styles.active : ""}`}
          onClick={() => setCategoryFilter("all")}
        >
          All Categories
        </button>
        <button 
          className={`${styles.filterBtn} ${categoryFilter === "hero" ? styles.active : ""}`}
          onClick={() => setCategoryFilter("hero")}
        >
          Heroes
        </button>
        <button 
          className={`${styles.filterBtn} ${categoryFilter === "item" ? styles.active : ""}`}
          onClick={() => setCategoryFilter("item")}
        >
          Items
        </button>
        <button 
          className={`${styles.filterBtn} ${categoryFilter === "general" ? styles.active : ""}`}
          onClick={() => setCategoryFilter("general")}
        >
          General
        </button>
      </div>

      {loading && <div style={{ marginBottom: '20px', color: '#888' }}>Searching...</div>}

      {query.length >= 2 && !loading && (
        <div style={{ marginBottom: '20px', color: '#888' }}>
          Found {filteredResults.length === 100 ? "100+" : filteredResults.length} results
        </div>
      )}

      <div className={styles.changesList}>
        {filteredResults.map((res, idx) => (
          <div key={idx} className={`${styles.changeItem} ${styles[res.c]}`} style={{ background: 'var(--bg-panel)', padding: '15px', borderRadius: '8px', marginBottom: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <div style={{ fontWeight: 'bold' }}>
                <span style={{ color: 'var(--color-rare)', marginRight: '8px' }}>[{res.v}]</span>
                <span style={{ color: 'var(--color-artifact)' }}>{res.e}</span>
                {res.s && <span style={{ color: 'var(--color-consumable)' }}> - {res.s}</span>}
              </div>
              <Link 
                href={`/patch/${res.v}`}
                style={{ color: 'var(--color-rare)', fontSize: '0.85rem', textDecoration: 'none' }}
              >
                View Patch &rarr;
              </Link>
            </div>
            <div style={{ color: '#ccc', fontSize: '0.9rem' }}>{res.n}...</div>
            <div style={{ marginTop: '8px', display: 'flex', gap: '8px' }}>
              <span style={{ 
                fontSize: '0.7rem', 
                padding: '2px 6px', 
                borderRadius: '4px', 
                background: 'rgba(255,255,255,0.05)',
                color: res.c === 'Buff' ? 'var(--color-buff)' : res.c === 'Nerf' ? 'var(--color-nerf)' : 'var(--color-adjustment)'
              }}>
                {res.c}
              </span>
              <span style={{ fontSize: '0.7rem', color: '#666', textTransform: 'uppercase' }}>{res.cat}</span>
            </div>
          </div>
        ))}

        {query.length > 0 && query.length < 2 && (
          <p style={{ color: '#666' }}>Keep typing to search...</p>
        )}

        {query.length >= 2 && !loading && filteredResults.length === 0 && (
          <p style={{ color: '#666' }}>No results found for "{query}".</p>
        )}
      </div>
    </div>
  );
}
