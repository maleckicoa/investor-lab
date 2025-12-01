import React from 'react';
import styles from '../you-tube-rag.module.css';

type RawSource =
  | string
  | {
      url: string;
      title?: string;
      thumbnail?: string;       // local relative path if backend provided
      thumbnail_url?: string;   // absolute URL if backend provided
      id?: string;
    };

type SourceItem = {
  url: string;
  title?: string;
  thumbnail?: string;
};

type SourcesPanelProps = {
  sources?: RawSource[];
};

function getYoutubeId(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname.includes('youtube.com')) {
      return u.searchParams.get('v');
    }
  } catch {
    return null;
  }
  return null;
}

function computeThumb(url: string, provided?: string): string | undefined {
  if (provided) return provided;
  const vid = getYoutubeId(url);
  return vid ? `https://img.youtube.com/vi/${vid}/mqdefault.jpg` : undefined;
}

function normalizeSources(sources?: RawSource[]): SourceItem[] {
  if (!sources || !Array.isArray(sources)) return [];
  const items = sources.map((s): SourceItem | null => {
    if (typeof s === 'string') {
      return { url: s, title: undefined, thumbnail: computeThumb(s) };
    }
    if (s && typeof s === 'object' && typeof s.url === 'string') {
      const thumb = computeThumb(s.url, s.thumbnail_url || s.thumbnail);
      return { url: s.url, title: s.title, thumbnail: thumb };
    }
    return null;
  });
  return items.filter((x): x is SourceItem => x !== null);
}

export default function SourcesPanel({ sources }: SourcesPanelProps) {
  const items = normalizeSources(sources);
  if (!items.length) return null;

  return (
    <aside className={styles.sourcesPanel} aria-label="Answer sources">
      <div className={styles.sourcesHeader}>Sources</div>
      <div className={styles.sourcesList}>
        {items.map((item, idx) => (
          <a
            key={`${item.url}-${idx}`}
            href={item.url}
            target="_blank"
            rel="noreferrer"
            className={styles.sourceLink}
            title={item.title || item.url}
          >
            {item.thumbnail ? (
              <img className={styles.sourceThumb} src={item.thumbnail} alt={item.title || 'Video thumbnail'} />
            ) : (
              <span className={styles.sourceIcon} aria-hidden="true">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </span>
            )}
            <span className={styles.sourceText}>{item.title || 'Video'}</span>
          </a>
        ))}
      </div>
    </aside>
  );
}


