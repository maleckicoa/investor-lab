/* eslint-disable react/jsx-no-useless-fragment */
'use client';

import React, { useMemo, useState } from 'react';
import styles from '../you-tube-rag.module.css';
import ChatHeader from './ChatHeader';
import ChatMessageList, { Message } from './ChatMessageList';
import ChatInput from './ChatInput';
import SourcesPanel from './SourcesPanel';

export default function WealthMateChat() {
  const [messages, setMessages] = useState<Message[]>(() => [
    {
      id: 'welcome',
      role: 'assistant',
      text: 'Hi, I’m WealthMate. I can help you learn investing basics. Ask me anything!',
      sources: [],
      timestamp: Date.now(),
    },
  ]);

  const onSend = async (text: string) => {
    const id = crypto.randomUUID();
    const userMsg: Message = {
      id,
      role: 'user',
      text,
      sources: [],
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, userMsg]);

    try {
      const formData = new FormData();
      formData.append('user_input', text);

      const response = await fetch('/demo-apps/api/you-tube-rag', {
        method: 'POST',
        body: formData,
      });

      let answer = '';
      let sources = [];
      let history = [];

      if (response.ok) {
        
        const data = await response.json();
        
        
        if (typeof data?.result === 'string') {
          answer = data.result;
        } else if (data?.result?.answer) {
          answer = data.result.answer;
        } else {
          answer = (data?.result && JSON.stringify(data.result)) || 'I could not find an answer.';
        }

        if (data?.result?.sources) {
          sources = data.result.sources;
        }

        if (data?.result?.history) {
          history = data.result.history;
        }
        
        console.log('answer', answer);
        console.log('sources', sources);
        console.log('history', history);


      } else {
        answer = 'Something went wrong';
      }

    

      const reply: Message = {
        id: `${id}-reply`,
        role: 'assistant',
        text: answer,
        sources: sources,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, reply]);
    } catch {
      const reply: Message = {
        id: `${id}-reply`,
        role: 'assistant',
        text: 'Something went wrong',
        sources: [],
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, reply]);
    }
  };

  const chatTitle = useMemo(() => 'WealthMate', []);
  const chatSubtitle = useMemo(() => 'Beginner-friendly investing chat', []);
  const currentSources = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i -= 1) {
      const m = messages[i];
      if (m.role === 'assistant' && Array.isArray(m.sources) && m.sources.length > 0) {
        return m.sources;
      }
    }
    return [];
  }, [messages]);

  return (
    <div className={styles.container}>
      <img
        src="/site-logo/site-logo.png"
        alt="WealthMate"
        className={styles.containerLogo}
      />
      <div className={styles.chatCard}>
        <ChatHeader title={chatTitle} subtitle={chatSubtitle} />
        <div className={styles.mainContent}>
          <ChatMessageList messages={messages} />
          <SourcesPanel sources={currentSources} />
        </div>
        <ChatInput onSend={onSend} />
      </div>
    </div>
  );
}


