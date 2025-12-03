'use client';

import React, { useEffect, useRef, useState } from 'react';
import styles from '../you-tube-rag.module.css';

type SpeakButtonProps = {
  text: string;
  label?: string;
};

export default function SpeakButton({ text, label = 'Speak' }: SpeakButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const urlRef = useRef<string | null>(null);

  async function handleSpeak() {
    if (!text || isLoading) return;

    // If currently playing, stop immediately
    if (isPlaying && audioRef.current) {
      try {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      } catch {}
      setIsPlaying(false);
      if (urlRef.current) {
        URL.revokeObjectURL(urlRef.current);
        urlRef.current = null;
      }
      audioRef.current = null;
      return;
    }

    setIsLoading(true);
    try {
      const resp = await fetch('/demo-apps/api/you-tube-rag-tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: text }),
      });
      if (!resp.ok) throw new Error(`TTS failed: ${resp.status}`);
      const blob = await resp.blob();
      const url = URL.createObjectURL(blob);
      urlRef.current = url;
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onended = () => {
        setIsPlaying(false);
        if (urlRef.current) {
          URL.revokeObjectURL(urlRef.current);
          urlRef.current = null;
        }
        audioRef.current = null;
      };
      await audio.play();
      setIsPlaying(true);
    } catch (e) {
      // swallow for UI; could add toast
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      try {
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
        }
      } catch {}
      if (urlRef.current) {
        URL.revokeObjectURL(urlRef.current);
        urlRef.current = null;
      }
    };
  }, []);

  return (
    <button
      type="button"
      className={styles.ttsButton}
      onClick={handleSpeak}
      disabled={isLoading || !text}
      aria-label="Speak message"
    >
      {isLoading ? (
        '…'
      ) : !isPlaying ? (
        <>
          <span className={styles.ttsIcon} aria-hidden="true">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
              <path d="M8 5v14l11-7z" />
            </svg>
          </span>
          {label}
        </>
      ) : (
        <>
          <span className={styles.ttsIcon} aria-hidden="true">
            {/* stop icon */}
            <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
              <rect x="6" y="6" width="12" height="12" rx="2" />
            </svg>
          </span>
          Stop
        </>
      )}
    </button>
  );
}


