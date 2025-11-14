import styles from '../robo-reviews.module.css';

type HeroSectionProps = {
  categoryCount: number;
  productCount: number;
};

export default function HeroSection({ categoryCount, productCount }: HeroSectionProps) {
  return (
    <section className={styles.hero}>
      <div className={styles.heroContent}>
        <h1 className={styles.heroTitle}>Robo Reviews</h1>
        <h1 className={styles.heroTitle}>Shop the top-rated products!</h1>
        <p className={styles.heroSubtitle}>
          Explore six hand-picked categories powered by product review intelligence. Click on a
          category to browse highly-rated products along with the reviews that set them apart.
        </p>
      </div>
      <div className={styles.heroStats}>
        <div className={styles.statCard}>
          <span className={styles.statValue}>{categoryCount}</span>
          <span className={styles.statLabel}>Categories</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statValue}>{productCount}</span>
          <span className={styles.statLabel}>Products analyzed</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statValue}>AI Driven</span>
          <span className={styles.statLabel}>Summaries included</span>
        </div>
      </div>
    </section>
  );
}

