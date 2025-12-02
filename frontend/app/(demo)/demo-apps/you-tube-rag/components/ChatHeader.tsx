import React from 'react';
import styles from '../you-tube-rag.module.css';

type ChatHeaderProps = {
  title?: string;
  subtitle?: string;
};

export default function ChatHeader({ title = 'WealthMate', subtitle = 'Your beginner-friendly investing guide' }: ChatHeaderProps) {
  return (
    <header className={styles.header}>
      <div className={styles.headerText}>
        <h1 className={styles.title}>{title}</h1>
        <p className={styles.subtitle}>{subtitle}</p>
      </div>
    </header>
  );
}


