'use client';

import { useMemo, useState } from 'react';
import bestProducts from './best_products.json';
import styles from './robo-reviews.module.css';
import HeroSection from './components/HeroSection';
import CategoryExplorer from './components/CategoryExplorer';
import ProductsShowcase from './components/ProductsShowcase';
import ShoppingCart from './components/ShoppingCart';
import ProductReviews from './components/ProductReviews';
import { Category, Product, Review } from './types';

type CartItem = {
  product: Product;
  quantity: number;
};

type RawProduct = {
  predicted_product_category: string;
  name: string;
  imageURLs: string | null;
  llm_summary: string;
  summary_reviews_string?: string;
};

const cleanImageList = (imageURLs: string | null): string[] => {
  if (!imageURLs) return [];

  return imageURLs
    .split(',')
    .map((url) => url.replace(/\r|\n/g, '').trim())
    .filter(Boolean);
};

const parseReviews = (reviewsString: string | undefined): Review[] => {
  if (!reviewsString) return [];

  const reviews: Review[] = [];
  // Pattern: "Name: [product] Title: [title] Review: [review]"
  // Split by "Title:" to get individual reviews
  const parts = reviewsString.split(/Title:\s*/).filter(Boolean);

  for (const part of parts) {
    // Each part should have "title Review: review" format
    // The review text continues until the next "Name:" or end of string
    const match = part.match(/^(.+?)\s*Review:\s*([\s\S]+?)(?=\s*Name:|$)/);
    if (match) {
      const title = match[1].trim();
      const review = match[2].trim();
      if (title && review) {
        reviews.push({ title, review });
      }
    }
  }

  return reviews;
};

const buildCategories = (records: RawProduct[]): Category[] => {
  const map = records.reduce<Record<string, Product[]>>((acc, record) => {
    const category = record.predicted_product_category.trim();
    const entry: Product = {
      name: record.name.trim(),
      summary: record.llm_summary.trim(),
      images: cleanImageList(record.imageURLs),
      reviews: parseReviews(record.summary_reviews_string),
    };

    if (!acc[category]) {
      acc[category] = [];
    }

    acc[category].push(entry);
    return acc;
  }, {});

  return Object.entries(map).map(([name, products]) => {
    // Collect all images from all products in this category for preview
    const allImages = products.flatMap((product) => product.images);
    return {
      name,
      products,
      previewImages: allImages,
    };
  });
};

const categoriesData = buildCategories(bestProducts as RawProduct[]);
const totalProducts = categoriesData.reduce((sum, category) => sum + category.products.length, 0);

export default function AutoReviewsPage() {
  const [activeCategory, setActiveCategory] = useState<string>(categoriesData[0]?.name ?? '');
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedProductForReviews, setSelectedProductForReviews] = useState<Product | null>(null);
  const [isReviewsOpen, setIsReviewsOpen] = useState(false);

  const selectedCategory = useMemo(
    () => categoriesData.find((category) => category.name === activeCategory),
    [activeCategory],
  );

  const productsToShow = selectedCategory?.products ?? [];

  const handleAddToCart = (product: Product) => {
    setCartItems((prevItems) => {
      const existingItem = prevItems.find((item) => item.product.name === product.name);
      if (existingItem) {
        return prevItems.map((item) =>
          item.product.name === product.name
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        );
      }
      return [...prevItems, { product, quantity: 1 }];
    });
    setIsCartOpen(true);
  };

  const handleRemoveItem = (productName: string) => {
    setCartItems((prevItems) => prevItems.filter((item) => item.product.name !== productName));
  };

  const handleUpdateQuantity = (productName: string, quantity: number) => {
    if (quantity <= 0) {
      handleRemoveItem(productName);
      return;
    }
    setCartItems((prevItems) =>
      prevItems.map((item) =>
        item.product.name === productName ? { ...item, quantity } : item,
      ),
    );
  };

  const cartItemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  const handleViewReviews = (product: Product) => {
    setSelectedProductForReviews(product);
    setIsReviewsOpen(true);
  };

  return (
    <main className={styles.page}>
      <HeroSection categoryCount={categoriesData.length} productCount={totalProducts} />
      <CategoryExplorer
        categories={categoriesData}
        activeCategory={activeCategory}
        onSelectCategory={(category) => setActiveCategory(category)}
      />
      <ProductsShowcase
        activeCategory={activeCategory}
        products={productsToShow}
        onAddToCart={handleAddToCart}
        onViewReviews={handleViewReviews}
      />
      <button
        type="button"
        className={styles.cartButton}
        onClick={() => setIsCartOpen(true)}
        aria-label="Open shopping cart"
      >
        🛒
        {cartItemCount > 0 && <span className={styles.cartBadge}>{cartItemCount}</span>}
      </button>
      <ShoppingCart
        cartItems={cartItems}
        onRemoveItem={handleRemoveItem}
        onUpdateQuantity={handleUpdateQuantity}
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
      />
      <ProductReviews
        product={selectedProductForReviews}
        isOpen={isReviewsOpen}
        onClose={() => {
          setIsReviewsOpen(false);
          setSelectedProductForReviews(null);
        }}
      />
    </main>
  );
}

