import { useCallback, useState } from 'react';
import { KNOWN_KEY } from '../utils/storage';

export function useKnownCards() {
  const [knownIds, setKnownIds] = useState<Set<string>>(() => {
    try {
      const raw = localStorage.getItem(KNOWN_KEY);
      if (!raw) return new Set();
      const arr = JSON.parse(raw) as string[];
      return new Set(arr);
    } catch {
      return new Set();
    }
  });

  const persist = (next: Set<string>) => {
    localStorage.setItem(KNOWN_KEY, JSON.stringify([...next]));
  };

  const markKnown = useCallback((id: string) => {
    setKnownIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      persist(next);
      return next;
    });
  }, []);

  const markLearning = useCallback((id: string) => {
    setKnownIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      persist(next);
      return next;
    });
  }, []);

  return { knownIds, markKnown, markLearning };
}
