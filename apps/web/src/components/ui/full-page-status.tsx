import Image from "next/image";

import { AppScenery } from "@/components/ui/app-scenery";
import { Brand } from "@/components/ui/brand";

import styles from "./full-page-status.module.css";

interface FullPageStatusProps {
  label: string;
}

export function FullPageStatus({ label }: FullPageStatusProps) {
  return (
    <main className={styles.page} id="main-content">
      <AppScenery />

      <div className={styles.content}>
        <Brand className={styles.brand} />

        <div className={styles.island} aria-hidden="true">
          <span className={`${styles.hex} ${styles.top}`} />
          <span className={`${styles.hex} ${styles.upperLeft}`} />
          <span className={`${styles.hex} ${styles.upperRight}`} />
          <span className={`${styles.hex} ${styles.center}`} />
          <span className={`${styles.hex} ${styles.lowerLeft}`} />
          <span className={`${styles.hex} ${styles.lowerRight}`} />
          <span className={`${styles.hex} ${styles.bottom}`} />
          <Image
            alt=""
            className={styles.settlement}
            height={64}
            priority
            src="/game-assets/pieces/settlement-piece.png"
            width={64}
          />
        </div>

        <div className={styles.copy} aria-atomic="true" aria-live="polite" role="status">
          <p className={styles.eyebrow}>Preparing your voyage</p>
          <p className={styles.label}>{label}</p>
          <p className={styles.hint}>Charting coasts and gathering your crew</p>
          <span className={styles.dots} aria-hidden="true">
            <span />
            <span />
            <span />
          </span>
        </div>
      </div>
    </main>
  );
}
