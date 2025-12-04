export type Base64AudioSegment = {
  index: number;
  audioBase64: string;
  mime?: string; // default audio/mpeg
};

export type SequentialAudioController = {
  play: (segments: Base64AudioSegment[]) => Promise<void>;
  stop: () => void;
  cleanup: () => void;
};

export function createSequentialAudioPlayer(): SequentialAudioController {
  let currentAudio: HTMLAudioElement | null = null;
  let objectUrls: string[] = [];
  let stopRequested = false;
  let currentIndex = 0;
  let resolvePlayRef: (() => void) | null = null;

  function cleanup() {
    try {
      if (currentAudio) {
        currentAudio.pause();
      }
    } catch {}
    currentAudio = null;
    for (const url of objectUrls) {
      try {
        URL.revokeObjectURL(url);
      } catch {}
    }
    objectUrls = [];
    currentIndex = 0;
  }

  function stop() {
    stopRequested = true;
    try {
      if (currentAudio) currentAudio.pause();
    } catch {}
    currentAudio = null;
    // resolve any pending play promise immediately
    if (resolvePlayRef) {
      const r = resolvePlayRef;
      resolvePlayRef = null;
      r();
    }
    // release resources
    for (const url of objectUrls) {
      try {
        URL.revokeObjectURL(url);
      } catch {}
    }
    objectUrls = [];
    currentIndex = 0;
  }

  function base64ToUrl(b64: string, mime: string): string {
    const binary = atob(b64);
    const len = binary.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i += 1) {
      bytes[i] = binary.charCodeAt(i);
    }
    const blob = new Blob([bytes], { type: mime });
    const url = URL.createObjectURL(blob);
    objectUrls.push(url);
    return url;
  }

  async function play(segments: Base64AudioSegment[]): Promise<void> {
    stopRequested = false;
    cleanup(); // ensure clean start

    const ordered = [...segments].sort((a, b) => a.index - b.index);
    const urls = ordered.map((seg) =>
      base64ToUrl(seg.audioBase64, seg.mime || 'audio/mpeg')
    );

    return new Promise((resolve) => {
      resolvePlayRef = () => {
        cleanup();
        resolve();
      };
      const playNext = () => {
        if (stopRequested) {
          if (resolvePlayRef) {
            const r = resolvePlayRef;
            resolvePlayRef = null;
            r();
          } else {
            resolve();
          }
          return;
        }
        if (currentIndex >= urls.length) {
          // finished
          if (resolvePlayRef) {
            const r = resolvePlayRef;
            resolvePlayRef = null;
            r();
          } else {
            cleanup();
            resolve();
          }
          return;
        }
        const url = urls[currentIndex];
        currentAudio = new Audio(url);
        currentAudio.onended = () => {
          currentIndex += 1;
          playNext();
        };
        currentAudio.onerror = () => {
          // skip on error
          currentIndex += 1;
          playNext();
        };
        currentAudio.play().catch(() => {
          currentIndex += 1;
          playNext();
        });
      };
      playNext();
    });
  }

  return { play, stop, cleanup };
}


