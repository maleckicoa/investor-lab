import styles from './components.module.css';

interface RunModelButtonProps {
  hasImage: boolean;
  isLoading: boolean;
  onRunModel: () => void;
}

export default function RunModelButton({ hasImage, isLoading, onRunModel }: RunModelButtonProps) {
  return (
    <div className={styles.buttonContainer}>
      <button
        onClick={onRunModel}
        disabled={!hasImage || isLoading}
        className={styles.runButton}
      >
        {isLoading ? '🔄 Running Model...' : '🚀 Run Model'}
      </button>
    </div>
  );
}
