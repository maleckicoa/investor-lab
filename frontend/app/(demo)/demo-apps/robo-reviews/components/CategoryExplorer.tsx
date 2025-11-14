import { Category } from '../types';
import styles from '../robo-reviews.module.css';
import FallbackImage from './FallbackImage';

type CategoryExplorerProps = {
  categories: Category[];
  activeCategory: string;
  onSelectCategory: (category: string) => void;
};

export default function CategoryExplorer({
  categories,
  activeCategory,
  onSelectCategory,
}: CategoryExplorerProps) {
  return (
    <section className={styles.categoriesSection}>
      <div className={styles.sectionHeader}>
        <div>
          <p className={styles.eyebrow}>Discover the collection</p>
          <h2 className={styles.sectionTitle}>Shop by category</h2>
        </div>
        <p className={styles.sectionDescription}>
          Tap any category tile to reveal the latest recommended products pulled directly from
          customer sentiment.
        </p>
      </div>

      <div className={styles.categoryGrid}>
        {categories.map((category) => {
          const isActive = category.name === activeCategory;
          return (
            <button
              key={category.name}
              type="button"
              className={`${styles.categoryCard} ${isActive ? styles.categoryCardActive : ''}`}
              onClick={() => onSelectCategory(category.name)}
            >
              <div className={styles.categoryCardBody}>
                <span className={styles.categoryEyebrow}>Category</span>
                <h3 className={styles.categoryName}>{category.name}</h3>
                <p className={styles.categoryCount}>{category.products.length} products</p>
              </div>
              <div className={styles.categoryImageWrapper}>
                <FallbackImage
                  imageUrls={category.previewImages}
                  alt={`${category.name} preview`}
                  containerClassName={styles.categoryImageFallback}
                  fallbackContent={<span>No image</span>}
                />
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}

