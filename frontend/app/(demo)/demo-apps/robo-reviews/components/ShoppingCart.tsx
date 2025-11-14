import { Product } from '../types';
import styles from '../robo-reviews.module.css';
import FallbackImage from './FallbackImage';

type CartItem = {
  product: Product;
  quantity: number;
};

type ShoppingCartProps = {
  cartItems: CartItem[];
  onRemoveItem: (productName: string) => void;
  onUpdateQuantity: (productName: string, quantity: number) => void;
  isOpen: boolean;
  onClose: () => void;
};

export default function ShoppingCart({
  cartItems,
  onRemoveItem,
  onUpdateQuantity,
  isOpen,
  onClose,
}: ShoppingCartProps) {
  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  if (!isOpen) return null;

  return (
    <>
      <div className={styles.cartOverlay} onClick={onClose} />
      <div className={styles.cartContainer}>
        <div className={styles.cartHeader}>
          <h2 className={styles.cartTitle}>Shopping Cart</h2>
          <button
            type="button"
            className={styles.cartCloseButton}
            onClick={onClose}
            aria-label="Close cart"
          >
            ×
          </button>
        </div>

        {cartItems.length === 0 ? (
          <div className={styles.cartEmpty}>
            <p>Your cart is empty</p>
            <p className={styles.cartEmptySubtext}>Add products to get started</p>
          </div>
        ) : (
          <>
            <div className={styles.cartItems}>
              {cartItems.map((item) => (
                <div key={item.product.name} className={styles.cartItem}>
                  <div className={styles.cartItemImage}>
                    <FallbackImage
                      imageUrls={item.product.images}
                      alt={item.product.name}
                      containerClassName={styles.cartItemImageFallback}
                      fallbackContent={<span>No image</span>}
                    />
                  </div>
                  <div className={styles.cartItemContent}>
                    <h3 className={styles.cartItemName}>{item.product.name}</h3>
                    <p className={styles.cartItemSummary}>{item.product.summary}</p>
                    <div className={styles.cartItemControls}>
                      <div className={styles.quantityControls}>
                        <button
                          type="button"
                          className={styles.quantityButton}
                          onClick={() => onUpdateQuantity(item.product.name, item.quantity - 1)}
                          disabled={item.quantity <= 1}
                        >
                          −
                        </button>
                        <span className={styles.quantityValue}>{item.quantity}</span>
                        <button
                          type="button"
                          className={styles.quantityButton}
                          onClick={() => onUpdateQuantity(item.product.name, item.quantity + 1)}
                        >
                          +
                        </button>
                      </div>
                      <button
                        type="button"
                        className={styles.removeButton}
                        onClick={() => onRemoveItem(item.product.name)}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className={styles.cartFooter}>
              <div className={styles.cartTotal}>
                <span className={styles.cartTotalLabel}>Total items:</span>
                <span className={styles.cartTotalValue}>{totalItems}</span>
              </div>
              <button type="button" className={styles.checkoutButton}>
                Proceed to Checkout
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
}

