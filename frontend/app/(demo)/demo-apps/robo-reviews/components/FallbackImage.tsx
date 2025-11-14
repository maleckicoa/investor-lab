'use client';

import { useState, useEffect } from 'react';
import styles from '../robo-reviews.module.css';

type FallbackImageProps = {
  imageUrls: string[];
  alt: string;
  className?: string;
  fallbackContent?: React.ReactNode;
  containerClassName?: string;
};

export default function FallbackImage({
  imageUrls,
  alt,
  className,
  fallbackContent,
  containerClassName,
}: FallbackImageProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [hasError, setHasError] = useState(false);

  // Reset when imageUrls change
  useEffect(() => {
    if (imageUrls.length === 0) {
      setHasError(true);
      return;
    }
    setCurrentIndex(0);
    setHasError(false);
  }, [imageUrls.join(',')]);

  const handleImageError = () => {
    if (currentIndex < imageUrls.length - 1) {
      // Try next image
      setCurrentIndex((prev) => prev + 1);
    } else {
      // All images failed
      setHasError(true);
    }
  };

  if (hasError || imageUrls.length === 0) {
    return (
      <div className={containerClassName || styles.productImageFallback}>
        {fallbackContent || <span>Image not available</span>}
      </div>
    );
  }

  const currentUrl = imageUrls[currentIndex];

  return (
    <img
      src={currentUrl}
      alt={alt}
      className={className}
      onError={handleImageError}
      loading="lazy"
    />
  );
}

