'use client';

import { useState } from 'react';
import ImageUpload from './components/ImageUpload';
import RunModelButton from './components/RunModelButton';
import ResultsDisplay from './components/ResultsDisplay';
import styles from './cifar-10.module.css';

export default function CIFAR10Demo() {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [prediction, setPrediction] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const handleImageSelect = (file: File) => {
    setSelectedImage(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
    setPrediction(''); // Clear previous prediction
  };

  const runModel = async () => {
    if (!selectedImage) {
      alert('Please upload an image first!');
      return;
    }

    setIsLoading(true);
    
    // Simulate model prediction (replace with actual API call)
    setTimeout(() => {
      const categories = [
        'airplane', 'automobile', 'bird', 'cat', 'deer',
        'dog', 'frog', 'horse', 'ship', 'truck'
      ];
      const randomPrediction = categories[Math.floor(Math.random() * categories.length)];
      setPrediction(randomPrediction);
      setIsLoading(false);
    }, 2000);
  };

  return (
    <div className={styles.container}>
      {/* Title */}
      <h1 className={styles.title}>
        CIFAR-10 Image Classification
      </h1>

      {/* Components */}
      <ImageUpload onImageSelect={handleImageSelect} />
      <RunModelButton 
        hasImage={!!selectedImage} 
        isLoading={isLoading} 
        onRunModel={runModel} 
      />
      <ResultsDisplay 
        imagePreview={imagePreview} 
        prediction={prediction} 
      />

      {/* Back Button */}
      <div className={styles.backContainer}>
        <a
          href="/demo-apps"
          className={styles.backLink}
        >
          ← Back to Demo Apps
        </a>
      </div>
    </div>
  );
}
