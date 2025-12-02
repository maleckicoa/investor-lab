import React, { useState } from 'react';
import styles from '../you-tube-rag.module.css';

type ChatInputProps = {
  onSend: (text: string) => void;
  suggestions?: string[];
  placeholder?: string;
};

export default function ChatInput({
  onSend,
  suggestions = [
    'How do I start investing?',
    'What is an ETF?',
    'Tell me more about interest rates?',
    'What is diversification?',
  ],
  placeholder = 'Ask WealthMate anything about investing basics...',
}: ChatInputProps) {
  const [text, setText] = useState('');
  const [isSending, setIsSending] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim() || isSending) return;
    setIsSending(true);
    onSend(text.trim());
    setText('');
    setIsSending(false);
  }

  function handleSuggestionClick(s: string) {
    if (isSending) return;
    onSend(s);
  }

  return (
    <div className={styles.inputSection}>
      {suggestions && suggestions.length > 0 && (
        <div className={styles.suggestions} aria-label="Suggested questions">
          {suggestions.map((s) => (
            <button
              key={s}
              type="button"
              className={styles.suggestionChip}
              onClick={() => handleSuggestionClick(s)}
            >
              {s}
            </button>
          ))}
        </div>
      )}
      <form className={styles.inputBar} onSubmit={handleSubmit}>
        <input
          className={styles.input}
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={placeholder}
          aria-label="Message WealthMate"
        />
        <button className={styles.sendButton} type="submit" disabled={!text.trim() || isSending}>
          Send
        </button>
      </form>
    </div>
  );
}


