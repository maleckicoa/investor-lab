import { Product } from '../types';
import styles from '../robo-reviews.module.css';
import FallbackImage from './FallbackImage';

type ProductsShowcaseProps = {
  activeCategory: string;
  products: Product[];
  onAddToCart: (product: Product) => void;
  onViewReviews: (product: Product) => void;
};

export default function ProductsShowcase({
  activeCategory,
  products,
  onAddToCart,
  onViewReviews,
}: ProductsShowcaseProps) {
  return (
    <section className={styles.productsSection}>
      <div className={styles.productsHeader}>
        <div>
          <p className={styles.eyebrow}>Featured picks</p>
          <h2 className={styles.sectionTitle}>
            {activeCategory ? activeCategory : 'Choose a category to begin'}
          </h2>
        </div>
        {activeCategory && (
          <span className={styles.sectionDescription}>
            Showing {products.length} curated products
          </span>
        )}
      </div>

      {products.length === 0 ? (
        <div className={styles.emptyState}>
          <p>Select a category above to explore AI-generated product insights.</p>
        </div>
      ) : (
        <div className={styles.productsGrid}>
          {products.map((product) => (
            <article key={product.name} className={styles.productCard}>
              <div className={styles.productImage}>
                <FallbackImage
                  imageUrls={product.images}
                  alt={product.name}
                  containerClassName={styles.productImageFallback}
                  fallbackContent={<span>Image coming soon</span>}
                />
              </div>
              <div className={styles.productContent}>
                <p className={styles.productCategory}>{activeCategory}</p>
                <h3 className={styles.productName}>{product.name}</h3>
                <p className={styles.productSummary}>{product.summary}</p>
                <div className={styles.productActions}>
                  <button
                    type="button"
                    className={styles.primaryButton}
                    onClick={() => onViewReviews(product)}
                  >
                    View product reviews
                  </button>
                  <button
                    type="button"
                    className={styles.secondaryButton}
                    onClick={() => onAddToCart(product)}
                  >
                    Add to shopping cart
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

