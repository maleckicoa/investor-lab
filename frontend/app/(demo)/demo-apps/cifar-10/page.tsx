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
    
    const formData = new FormData();
    formData.append('file', selectedImage);
    
    try {
      const response = await fetch('/demo-apps/api/cifar10', {
        method: 'POST',
        body: formData,
      });
      
      const result = await response.json();
      if (result.status === 'success') {
        setPrediction(`${result.prediction} (${(result.confidence * 100).toFixed(1)}%)`);
      } else {
        setPrediction('Error processing image');
      }
    } catch (error) {
      console.error('Error:', error);
      setPrediction('Error processing image');
    } finally {
      setIsLoading(false);
    }
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
