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

      <span className={styles.legendLabel} style={{ marginLeft: '20px' }}>Temporal Context:</span>
      
      <div className={styles.legendItem}>
        <span style={{ fontSize: '0.7rem', padding: '1px 5px', borderRadius: '3px', background: 'rgba(76, 175, 80, 0.2)', color: '#81c784', border: '1px solid #4caf50', fontWeight: 'bold' }}>NET GAIN</span>
        <span style={{ fontSize: '0.85rem', color: '#888', marginLeft: '4px' }}>(Truly Stronger)</span>
      </div>

      <div className={styles.legendItem}>
        <span style={{ fontSize: '0.7rem', padding: '1px 5px', borderRadius: '3px', background: 'rgba(255, 152, 0, 0.2)', color: '#ffb74d', border: '1px solid #ff9800', fontWeight: 'bold' }}>RECOVERY</span>
        <span style={{ fontSize: '0.85rem', color: '#888', marginLeft: '4px' }}>(Post-Nerf Buff)</span>
      </div>
    </div>
  );
}
