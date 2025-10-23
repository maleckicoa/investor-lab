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

  const handleDownloadTestImages = async () => {
    try {
      const response = await fetch('/demo-apps/api/cifar10?action=download-test-images');
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'test-images.zip';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        alert('Download failed');
      }
    } catch (error) {
      alert('Download failed');
    }
  };

  return (
    <div className={styles.uploadSection}>
      <h2 className={styles.uploadTitle}>Upload Image</h2>
      <div className={styles.buttonRow}>
        <button 
          onClick={handleDownloadTestImages}
          className={styles.downloadButton}
        >
          📥 Test Images
        </button>
        <div className={styles.fileInputWrapper}>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className={styles.hiddenFileInput}
            id="file-upload"
          />
          <label htmlFor="file-upload" className={styles.customFileButton}>
            📁 Choose Image
          </label>
        </div>
      </div>
      <div className={styles.uploadText}>
        Supported formats: JPG, PNG, GIF
      </div>
    </div>
  );
}
