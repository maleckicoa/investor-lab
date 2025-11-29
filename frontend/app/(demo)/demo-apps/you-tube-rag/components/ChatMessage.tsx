import React, { useEffect, useMemo, useState } from 'react';
import styles from '../you-tube-rag.module.css';

export type ChatRole = 'user' | 'assistant';

export type ChatMessageProps = {
  role: ChatRole;
  text: string;
  timestamp?: string | number;
};

export default function ChatMessage({ role, text, timestamp }: ChatMessageProps) {
  const isUser = role === 'user';
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const timestampLabel = useMemo(() => {
    if (!mounted || timestamp == null) return '';
    try {
      const date = typeof timestamp === 'number' ? new Date(timestamp) : new Date(timestamp);
      return new Intl.DateTimeFormat(undefined, {
        hour: '2-digit',
        minute: '2-digit',
      }).format(date);
    } catch {
      return '';
    }
  }, [mounted, timestamp]);

  return (
    <div className={`${styles.messageRow} ${isUser ? styles.messageRowUser : styles.messageRowAssistant}`}>
      {!isUser && (
        <div className={`${styles.avatar} ${styles.avatarAssistant}`} aria-hidden="true">W</div>
      )}
      {isUser && (
        <div className={`${styles.avatar} ${styles.avatarUser}`} aria-hidden="true">U</div>
      )}
      <div className={`${styles.bubble} ${isUser ? styles.bubbleUser : styles.bubbleAssistant}`}>
        <div className={styles.messageText}>{text}</div>
        {mounted && timestampLabel && (
          <div className={styles.timestamp} suppressHydrationWarning>
            {timestampLabel}
          </div>
        )}
      </div>
    </div>
  );
}


