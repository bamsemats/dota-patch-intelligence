"use client";

import styles from "./Legend.module.css";

export default function Legend() {
  return (
    <div className={styles.legendContainer}>
      <span className={styles.legendLabel}>Change Legend:</span>
      
      <div className={styles.legendItem}>
        <div className={`${styles.colorBox} ${styles.buff}`}></div>
        <span>Buff</span>
      </div>
      
      <div className={styles.legendItem}>
        <div className={`${styles.colorBox} ${styles.nerf}`}></div>
        <span>Nerf</span>
      </div>
      
      <div className={styles.legendItem}>
        <div className={`${styles.colorBox} ${styles.adjustment}`}></div>
        <span>Adjustment</span>
      </div>
      
      <div className={styles.legendItem}>
        <div className={`${styles.colorBox} ${styles.rework}`}></div>
        <span>Rework</span>
      </div>
    </div>
  );
}
