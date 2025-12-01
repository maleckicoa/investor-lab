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
        console.log('answer', answer);
        console.log('sources', sources);


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


