import { Product, Review } from '../types';
import styles from '../robo-reviews.module.css';
import FallbackImage from './FallbackImage';

type ProductReviewsProps = {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
};

export default function ProductReviews({ product, isOpen, onClose }: ProductReviewsProps) {
  if (!isOpen || !product) return null;

  return (
    <>
      <div className={styles.reviewsOverlay} onClick={onClose} />
      <div className={styles.reviewsContainer}>
        <div className={styles.reviewsHeader}>
          <div className={styles.reviewsHeaderContent}>
            <div className={styles.reviewsProductImage}>
              <FallbackImage
                imageUrls={product.images}
                alt={product.name}
                containerClassName={styles.reviewsImageFallback}
                fallbackContent={<span>No image</span>}
              />
            </div>
            <div className={styles.reviewsProductInfo}>
              <h2 className={styles.reviewsProductName}>{product.name}</h2>
              <p className={styles.reviewsCount}>
                {product.reviews.length} {product.reviews.length === 1 ? 'review' : 'reviews'}
              </p>
            </div>
          </div>
          <button
            type="button"
            className={styles.reviewsCloseButton}
            onClick={onClose}
            aria-label="Close reviews"
          >
            ×
          </button>
        </div>

        <div className={styles.reviewsList}>
          {product.reviews.length === 0 ? (
            <div className={styles.reviewsEmpty}>
              <p>No reviews available for this product.</p>
            </div>
          ) : (
            product.reviews.map((review: Review, index: number) => (
              <article key={index} className={styles.reviewCard}>
                <h3 className={styles.reviewTitle}>{review.title}</h3>
                <p className={styles.reviewText}>{review.review}</p>
              </article>
            ))
          )}
        </div>
      </div>
    </>
  );
}

