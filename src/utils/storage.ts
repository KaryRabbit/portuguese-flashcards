import type { Card, ExamplePair, StudyGroup } from '../flashcard-types';

export const KEY = 'flashcards-min-v1';
export const SESSION_KEY = 'flashcards-session-v1';
export const SELECTED_KEY = 'flashcards-selected-v1';
export const PROGRESS_KEY = 'flashcards-progress-v1';
export const PAGE_SIZE_KEY = 'flashcards-page-size';
export const SEED_KEY = 'flashcards-seed-v1';
export const GROUPS_KEY = 'flashcards-groups-v1';
export const KNOWN_KEY = 'flashcards-known-v1';
export const BATCH_KEY = 'flashcards-batch-v1';

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

export const loadGroups = (): StudyGroup[] => {
  try {
    const raw = localStorage.getItem(GROUPS_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw) as StudyGroup[];
    const now = Date.now();

    return parsed
      .map((group) => ({
        id: String(group?.id ?? ''),
        name: String(group?.name ?? '').trim(),
        cardIds: Array.isArray(group?.cardIds)
          ? group.cardIds
              .map((id) => String(id).trim())
              .filter(Boolean)
          : [],
        createdAt: typeof group?.createdAt === 'number' ? group.createdAt : now,
      }))
      .filter((group) => group.id && group.name && group.cardIds.length > 0);
  } catch {
    return [];
  }
};

export const saveGroups = (groups: StudyGroup[]) =>
  localStorage.setItem(GROUPS_KEY, JSON.stringify(groups));

export const isSeeded = () => {
  try {
    return localStorage.getItem(SEED_KEY) === 'true';
  } catch {
    return false;
  }
};

export const setSeeded = () => {
  try {
    localStorage.setItem(SEED_KEY, 'true');
  } catch {
    // ignore
  }
};

export const shuffle = <T,>(a: T[]) => {
  const arr = [...a];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};
