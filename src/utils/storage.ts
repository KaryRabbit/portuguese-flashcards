import type { Card, ExamplePair } from '../flashcard-types';

export const KEY = 'flashcards-min-v1';
export const SESSION_KEY = 'flashcards-session-v1';
export const SELECTED_KEY = 'flashcards-selected-v1';
export const PROGRESS_KEY = 'flashcards-progress-v1';
export const PAGE_SIZE_KEY = 'flashcards-page-size';

export const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36);

export const load = (): Card[] => {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Card[];
    const now = Date.now();
    return parsed.map((c) => ({
      ...c,
      createdAt: typeof c.createdAt === 'number' ? c.createdAt : now,
      examples: Array.isArray(c?.examples)
        ? c.examples
            .map((e: ExamplePair) => ({
              en: String(e?.en ?? '').trim(),
              pt: String(e?.pt ?? '').trim(),
            }))
            .filter((e) => e.en && e.pt)
        : undefined,
    }));
  } catch {
    return [];
  }
};

export const save = (cards: Card[]) =>
  localStorage.setItem(KEY, JSON.stringify(cards));

export const shuffle = <T,>(a: T[]) => {
  const arr = [...a];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};
