import styles from './components.module.css';

interface ResultsDisplayProps {
  imagePreview: string;
  prediction: string;
}

export default function ResultsDisplay({ imagePreview, prediction }: ResultsDisplayProps) {
  if (!imagePreview && !prediction) {
    return null;
  }

  return (
    <div className={styles.resultsSection}>
      <h2 className={styles.resultsTitle}>
        Results
      </h2>
      
      {/* Image Display */}
      {imagePreview && (
        <div className={styles.imageContainer}>
          <img
            src={imagePreview}
            alt="Uploaded"
            className={styles.imagePreview}
          />
        </div>
      )}

      {/* Prediction Result */}
      {prediction && (
        <div className={styles.predictionCard}>
          <h3 className={styles.predictionTitle}>
            Prediction Result:
          </h3>
          <div className={styles.predictionResult}>
            {prediction}
          </div>
        </div>
      )}
    </div>
  );
}
