 'use client';
 
 import React, { useEffect, useRef, useState } from 'react';
 import styles from '../you-tube-rag.module.css';
 import { createSequentialAudioPlayer, Base64AudioSegment } from '../utils/sequentialAudioPlayer';
 
 type SpeakButtonProps = {
   text: string;
   label?: string;
 };
 
 export default function SpeakButton({ text, label = 'Play' }: SpeakButtonProps) {
   const [isLoading, setIsLoading] = useState(false);
   const [isPlaying, setIsPlaying] = useState(false);
 
   const playerRef = useRef<ReturnType<typeof createSequentialAudioPlayer> | null>(null);
 
   function ensurePlayer() {
     if (!playerRef.current) {
       playerRef.current = createSequentialAudioPlayer();
     }
     return playerRef.current;
   }
 
   function stopPlayback() {
     try {
       playerRef.current?.stop();
     } catch {}
     setIsPlaying(false);
   }
 
   async function handleSpeak() {
     if (!text || isLoading) return;
 
     if (isPlaying) {
       stopPlayback();
       return;
     }
 
     setIsLoading(true);
 
     try {
       const resp = await fetch('/demo-apps/api/you-tube-rag-tts-multi', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ text }),
       });
 
       if (!resp.ok) throw new Error(`TTS failed: ${resp.status}`);
 
       const data = await resp.json();
       const segments: Base64AudioSegment[] = Array.isArray(data?.segments) ? data.segments : [];
       if (segments.length === 0) {
         setIsPlaying(false);
         setIsLoading(false);
         return;
       }
 
       const player = ensurePlayer();
       // Network complete, enable button for Stop
       setIsLoading(false);
       setIsPlaying(true);
       await player.play(segments);
       setIsPlaying(false);
     } catch (e) {
       console.error(e);
       setIsPlaying(false);
       setIsLoading(false);
     } finally {
       // no-op; loading is already managed to allow Stop during playback
     }
   }
 
   useEffect(() => {
     return () => {
       try {
         playerRef.current?.stop();
         playerRef.current?.cleanup();
       } catch {}
     };
   }, []);
 
   return (
     <button
       type="button"
       className={styles.ttsButton}
       onClick={handleSpeak}
       disabled={isLoading || !text}
       aria-label="Speak text with TTS"
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
