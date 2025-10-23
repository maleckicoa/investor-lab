import styles from './components.module.css';

interface ImageUploadProps {
  onImageSelect: (file: File) => void;
}

export default function ImageUpload({ onImageSelect }: ImageUploadProps) {
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onImageSelect(file);
    }
  };

  return (
    <div className={styles.uploadSection}>
      <h2 className={styles.uploadTitle}>Upload Image</h2>
      <input
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
        className={styles.fileInput}
      />
      <div className={styles.uploadText}>
        Supported formats: JPG, PNG, GIF
      </div>
    </div>
  );
}
