/* eslint-disable react/jsx-no-useless-fragment */
'use client';

import React, { useMemo, useState } from 'react';
import styles from '../you-tube-rag.module.css';
import ChatHeader from './ChatHeader';
import ChatMessageList, { Message } from './ChatMessageList';
import ChatInput from './ChatInput';

export default function WealthMateChat() {
  const [messages, setMessages] = useState<Message[]>(() => [
    {
      id: 'welcome',
      role: 'assistant',
      text: 'Hi, I’m WealthMate. I can help you learn investing basics. Ask me anything!',
      timestamp: Date.now(),
    },
  ]);

  const onSend = async (text: string) => {
    const id = crypto.randomUUID();
    const userMsg: Message = {
      id,
      role: 'user',
      text,
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, userMsg]);

    // Mock assistant reply for now (UI only). Replace with API call when ready.
    const reply: Message = {
      id: `${id}-reply`,
      role: 'assistant',
      text: getMockAnswer(text),
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, reply]);
  };

  const chatTitle = useMemo(() => 'WealthMate', []);
  const chatSubtitle = useMemo(() => 'Beginner-friendly investing chat', []);

  return (
    <div className={styles.container}>
      <div className={styles.chatCard}>
        <ChatHeader title={chatTitle} subtitle={chatSubtitle} />
        <ChatMessageList messages={messages} />
        <ChatInput onSend={onSend} />
      </div>
    </div>
  );
}

function getMockAnswer(input: string): string {
  const normalized = input.toLowerCase();
  if (normalized.includes('etf')) {
    return 'An ETF (Exchange-Traded Fund) is a basket of investments you can buy like a stock. ETFs offer instant diversification and usually have low fees.';
  }
  if (normalized.includes('start')) {
    return 'Start by setting a goal, building an emergency fund, and investing consistently in a diversified, low-cost index fund or ETF.';
  }
  if (normalized.includes('diversification')) {
    return 'Diversification means spreading your money across different assets so a single poor performer doesn’t hurt your entire portfolio.';
  }
  if (normalized.includes('much') || normalized.includes('monthly')) {
    return 'A common approach is to invest a set amount monthly (dollar-cost averaging). Start small and increase as your budget allows.';
  }
  return 'Great question! For beginners, focus on clear goals, low-cost diversified funds, and consistent contributions. I can explain any of these further.';
}


