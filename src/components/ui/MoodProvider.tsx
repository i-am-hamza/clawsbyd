'use client';

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  type ReactNode,
} from 'react';

interface MoodContextValue {
  mood: number;
  setMood: (value: number) => void;
}

const MoodContext = createContext<MoodContextValue>({ mood: 0, setMood: () => undefined });

export function useMood() {
  return useContext(MoodContext);
}

interface MoodProviderProps {
  children: ReactNode;
  initial?: number;
}

/**
 * MoodProvider — sets --mood (0–1) on its root element.
 *
 * Accent colour and display weight derive from --mood via CSS only
 * (color-mix in oklch + font-variation-settings calc).
 * No React re-render happens per drag frame — only the CSS var changes.
 * Filtering of a list runs on a debounced value (120ms).
 *
 * AA contrast verified at mood 0/0.25/0.5/0.75/1 in tokens.css.
 */
export function MoodProvider({ children, initial = 0 }: MoodProviderProps) {
  const [moodValue, setMoodValue] = useState(initial);
  const rootRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const setMood = useCallback((value: number) => {
    const clamped = Math.max(0, Math.min(1, value));
    // Apply CSS var immediately (no React re-render)
    rootRef.current?.style.setProperty('--mood', String(clamped));
    // Debounce the React state update (used for list filtering)
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setMoodValue(clamped), 120);
  }, []);

  return (
    <MoodContext.Provider value={{ mood: moodValue, setMood }}>
      <div ref={rootRef} style={{ '--mood': String(initial) } as React.CSSProperties}>
        {children}
      </div>
    </MoodContext.Provider>
  );
}

/** Mood slider — a styled range input that drives --mood */
export function MoodSlider({ className = '' }: { className?: string }) {
  const { mood, setMood } = useMood();

  return (
    <div className={`flex flex-col gap-2 ${className}`} role="group" aria-label="Vibe selector">
      <div className="flex justify-between text-xs text-[var(--text-muted)] select-none" aria-hidden="true">
        <span>Dainty</span>
        <span>Soft</span>
        <span>Statement</span>
        <span>Bold</span>
        <span>Glam</span>
      </div>
      <input
        type="range"
        min={0}
        max={1}
        step={0.01}
        value={mood}
        onChange={e => setMood(parseFloat(e.target.value))}
        aria-label="Vibe from Dainty to Glam"
        aria-valuemin={0}
        aria-valuemax={1}
        aria-valuenow={mood}
        aria-valuetext={moodLabel(mood)}
        className="w-full accent-[var(--accent)] cursor-pointer"
        style={{ accentColor: 'var(--accent)' }}
      />
    </div>
  );
}

function moodLabel(mood: number): string {
  if (mood < 0.15) return 'Dainty';
  if (mood < 0.35) return 'Soft';
  if (mood < 0.65) return 'Statement';
  if (mood < 0.85) return 'Bold';
  return 'Glam';
}
