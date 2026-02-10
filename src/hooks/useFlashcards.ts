import { useCallback, useEffect, useRef, useState } from 'react';
import type { Card, WordType } from '../flashcard-types';
import { isSeeded, load, save, setSeeded } from '../utils/storage';
import { debounce } from '../utils/debounce';
import { loadSampleWords } from '../utils/sampleWords';

export function useFlashcards() {
  const [cards, setCards] = useState<Card[]>(() => load());
  const hasSeededRef = useRef(false);

  // Debounced save function to improve performance
  const debouncedSaveRef = useRef(
    debounce((cardsToSave: Card[]) => {
      save(cardsToSave);
    }, 500)
  );

  useEffect(() => {
    debouncedSaveRef.current(cards);
  }, [cards]);

  useEffect(() => {
    if (hasSeededRef.current) return;
    if (cards.length > 0) return;
    if (isSeeded()) return;

    const seeded = loadSampleWords();
    setCards(seeded);
    save(seeded);
    setSeeded();
    hasSeededRef.current = true;
  }, [cards.length]);

  const addCard = useCallback((
    front: string,
    back: string,
    type: WordType,
    examplesText: string
  ) => {
    const examples = examplesText
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean)
      .map((line) => {
        const [enEx = '', ptEx = ''] = line.split('|').map((s) => s.trim());
        return { en: enEx, pt: ptEx };
      });

    setCards((prev) => {
      const exists = prev.some(
        (c) =>
          c.front.toLowerCase() === front.toLowerCase() &&
          c.back.toLowerCase() === back.toLowerCase()
      );
      if (exists) return prev;

      return [
        {
          id: Math.random().toString(36).slice(2) + Date.now().toString(36),
          front,
          back,
          type,
          examples: examples.length ? examples : undefined,
          createdAt: Date.now(),
        },
        ...prev,
      ];
    });
  }, []);

  const removeCard = useCallback((id: string) => {
    setCards((prev) => prev.filter((c) => c.id !== id));
  }, []);

  const importCards = useCallback((newCards: Card[]) => {
    setCards((prev) => {
      const norm = (s: string) => s.trim().toLowerCase();
      const existingKeys = new Set(
        prev.map((c) => `${norm(c.front)}|${norm(c.back)}`)
      );

      const merged = [
        ...newCards.filter(
          (n) => !existingKeys.has(`${norm(n.front)}|${norm(n.back)}`)
        ),
        ...prev,
      ];

      save(merged);
      return merged;
    });
  }, []);

  const clearAll = useCallback(() => {
    setCards([]);
    save([]);
  }, []);

  return {
    cards,
    setCards,
    addCard,
    removeCard,
    importCards,
    clearAll,
  };
}
