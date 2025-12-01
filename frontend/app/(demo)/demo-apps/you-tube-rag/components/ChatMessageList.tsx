import React, { useEffect, useRef } from 'react';
import styles from '../you-tube-rag.module.css';
import ChatMessage, { ChatRole } from './ChatMessage';

export type Message = {
  id: string;
  role: ChatRole;
  text: string;
  sources: any[];
  timestamp?: string | number;
};

type ChatMessageListProps = {
  messages: Message[];
};

export default function ChatMessageList({ messages }: ChatMessageListProps) {
  const listRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages]);

  return (
    <div className={styles.messageList} ref={listRef} role="log" aria-live="polite">
      {messages.map((m) => (
        <ChatMessage key={m.id} role={m.role} text={m.text} timestamp={m.timestamp} />
      ))}
    </div>
  );
}


